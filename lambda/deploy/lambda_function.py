import json
import os
import math
import base64
import boto3
import requests
from typing import Dict, List, Any, Optional

# Config
GOOGLE_ROUTES_API_KEY = os.getenv("GOOGLE_ROUTES_API_KEY")
GOOGLE_ROUTES_ENDPOINT = os.getenv(
    "GOOGLE_ROUTES_ENDPOINT", 
    "https://maps.googleapis.com/maps/api/directions/json"
)
BEDROCK_REGION = os.getenv("BEDROCK_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

# AWS clients
bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)


def decode_polyline(encoded: str) -> List[Dict[str, float]]:
    """Decode Google polyline to coordinate list."""
    coords = []
    index = 0
    lat = 0
    lng = 0
    
    while index < len(encoded):
        b: int
        shift = 0
        result = 0
        
        # Decode latitude
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        lat += (result & 1) != 0 and ~(result >> 1) or (result >> 1)
        
        # Reset for longitude
        shift = 0
        result = 0
        
        # Decode longitude
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        lng += (result & 1) != 0 and ~(result >> 1) or (result >> 1)
        
        coords.append({"latitude": lat / 1e5, "longitude": lng / 1e5})
    
    return coords


def haversine_km(coord1: Dict[str, float], coord2: Dict[str, float]) -> float:
    """Calculate distance between two coordinates in km."""
    R = 6371  # Earth radius in km
    
    lat1, lon1 = math.radians(coord1["latitude"]), math.radians(coord1["longitude"])
    lat2, lon2 = math.radians(coord2["latitude"]), math.radians(coord2["longitude"])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def route_distance_km(coords: List[Dict[str, float]]) -> float:
    """Calculate total route distance."""
    total = 0.0
    for i in range(1, len(coords)):
        total += haversine_km(coords[i-1], coords[i])
    return total


def normalize_01(value: float) -> float:
    """Clamp value to [0, 1] range."""
    if not isinstance(value, (int, float)) or math.isnan(value) or not math.isfinite(value):
        return 0.5
    return max(0.0, min(1.0, value))


def compute_lumos_score(factors: Dict[str, float]) -> int:
    """Compute overall safety score (0-100)."""
    weights = {
        "lightingDensity": 0.4,
        "nightLuminosity": 0.3,
        "areaSafetyIndex": 0.3,
    }
    
    raw = sum(factors[k] * weights[k] for k in weights)
    return int(round(normalize_01(raw) * 100))


def build_lumos_route(google_route: Dict[str, Any], index: int) -> Dict[str, Any]:
    """Convert Google route to LumosRoute with safety scoring."""
    legs = google_route.get("legs", [])
    total_distance = sum(leg.get("distance", {}).get("value", 0) for leg in legs)
    total_duration = sum(leg.get("duration", {}).get("value", 0) for leg in legs)
    
    # Safety factor calculations (same logic as TypeScript version)
    distance_km = total_distance / 1000
    duration_min = total_duration / 60
    
    lighting_density = normalize_01(1.2 - distance_km * 0.02 + index * 0.05)
    night_luminosity = normalize_01(0.5 + 0.1 * math.cos(duration_min / 10 + index))
    area_safety_index = normalize_01(0.7 - duration_min * 0.01 + index * 0.03)
    
    safety_factors = {
        "lightingDensity": lighting_density,
        "nightLuminosity": night_luminosity,
        "areaSafetyIndex": area_safety_index,
    }
    
    lumos_score = compute_lumos_score(safety_factors)
    
    # Decode polyline
    polyline_str = google_route.get("overview_polyline", {}).get("points", "")
    coordinates = decode_polyline(polyline_str) if polyline_str else []
    
    # Safety note
    if lumos_score >= 80:
        safety_note = "Well-lit main roads via commercial zones"
    elif lumos_score >= 60:
        safety_note = "Moderate lighting; some residential stretches"
    else:
        safety_note = "Some poorly lit residential stretches"
    
    return {
        "id": f"route-{index}",
        "polyline": polyline_str,
        "coordinates": coordinates,
        "legs": [
            {
                "distanceMeters": leg.get("distance", {}).get("value", 0),
                "durationSeconds": leg.get("duration", {}).get("value", 0),
            }
            for leg in legs
        ],
        "summary": {
            "distanceMeters": total_distance,
            "durationSeconds": total_duration,
        },
        "safetyFactors": safety_factors,
        "lumosScore": lumos_score,
        "safetyNote": safety_note,
    }


def parse_duration_seconds(duration: str) -> int:
    """Parse Google duration string to seconds."""
    # Directions API returns seconds directly as number
    if isinstance(duration, (int, float)):
        return int(duration)
    # Routes API returns "123s" format
    if isinstance(duration, str) and duration.endswith("s"):
        try:
            return int(float(duration[:-1]))
        except (ValueError, TypeError):
            return 0
    return 0


def call_google_routes(origin: Dict[str, float], destination: Dict[str, float]) -> Dict[str, Any]:
    """Call Google Routes API."""
    if not GOOGLE_ROUTES_API_KEY:
        raise ValueError("Missing GOOGLE_ROUTES_API_KEY environment variable")
    
    params = {
        "origin": f"{origin['lat']},{origin['lng']}",
        "destination": f"{destination['lat']},{destination['lng']}",
        "mode": "driving",
        "alternatives": "true",
        "avoid": "tolls|highways",
        "key": GOOGLE_ROUTES_API_KEY,
    }
    
    response = requests.get(GOOGLE_ROUTES_ENDPOINT, params=params, timeout=8)
    response.raise_for_status()
    result = response.json()
    print(f"Google Routes response: {json.dumps(result, indent=2)}")
    return result


def explain_with_bedrock(routes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Call Claude 3 Opus via Bedrock for safety explanation."""
    prompt = f"""You are LumosRoad's Safety Scoring Agent.

You are given multiple candidate driving routes at night in Pune, India. Each route has:
- A Lumos safety score (0–100)
- Normalized safety factors: lightingDensity, nightLuminosity, areaSafetyIndex
- Distance and duration summaries

Choose which route is safest overall for a typical cautious user at night and explain why.

Return ONLY a compact JSON object with this shape, no extra commentary:
{{
  "safestRouteId": "route-x",
  "routes": [
    {{"id": "route-x", "lumosScore": 92, "rationale": "..."}}
  ],
  "highLevelSummary": "..."
}}

Routes:
{json.dumps([
    {
        "id": r["id"],
        "lumosScore": r["lumosScore"],
        "safetyFactors": r["safetyFactors"],
        "summary": r["summary"],
    }
    for r in routes
], indent=2)}
"""
    
    # Bedrock request for Claude 3 Opus
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        ],
    }
    
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(request_body),
    )
    
    response_body = json.loads(response["body"].read().decode())
    content = response_body.get("content", [{}])[0].get("text", "")
    
    if not content:
        raise ValueError("Empty response from Bedrock")
    
    # Extract JSON from response
    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    raise ValueError("Failed to parse Bedrock response as JSON")


def lambda_handler(event, context):
    """Main Lambda handler."""
    try:
        # Parse request - handle both direct and body-wrapped formats
        if "origin" in event and "destination" in event:
            # Direct format (for testing)
            origin = event.get("origin")
            destination = event.get("destination")
        else:
            # API Gateway format (body as string)
            body = json.loads(event.get("body", "{}"))
            origin = body.get("origin")
            destination = body.get("destination")
        
        if not origin or not destination:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "origin and destination are required"}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        # Get routes from Google
        google_response = call_google_routes(origin, destination)
        routes = google_response.get("routes", [])
        
        if not routes:
            return {
                "statusCode": 502,
                "body": json.dumps({"message": "No routes returned from Google"}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        # Build Lumos routes with safety scoring
        lumos_routes = [build_lumos_route(route, i) for i, route in enumerate(routes[:3])]
        
        # Get AI explanation from Claude 3 Haiku
        explanation = explain_with_bedrock(lumos_routes)
        
        response_payload = {
            "safestRouteId": explanation.get("safestRouteId"),
            "routes": lumos_routes,
            "explanation": explanation,
        }
        
        return {
            "statusCode": 200,
            "body": json.dumps(response_payload),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal error", "error": str(e)}),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
