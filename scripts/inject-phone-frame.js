#!/usr/bin/env node
/**
 * Post-build script: wraps the Expo web export in a phone-frame UI.
 * Run after `npx expo export --platform web`.
 */
const fs = require("fs");
const path = require("path");

const distIndex = path.join(__dirname, "..", "dist", "index.html");
let html = fs.readFileSync(distIndex, "utf-8");

// Extract the script tag(s) from the body
const scriptMatch = html.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/g) || [];
const scripts = scriptMatch.join("\n");

// Build the new HTML
const output = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>LumosRoad — Safety-First Navigation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; padding: 0; }
      body {
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .phone-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }
      .phone-header { text-align: center; }
      .phone-header h1 {
        margin: 0; font-size: 28px; font-weight: 800;
        color: #fff; letter-spacing: 0.5px;
      }
      .phone-header h1 span { color: #818CF8; }
      .phone-header p { margin: 8px 0 0; font-size: 14px; color: #94A3B8; }
      .phone-frame {
        width: 390px; height: 844px;
        border-radius: 50px; border: 6px solid #334155;
        background: #000; overflow: hidden; position: relative;
        box-shadow: 0 0 0 2px #1E293B, 0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.15);
      }
      .phone-frame::before {
        content: ''; position: absolute; top: 0; left: 50%;
        transform: translateX(-50%); width: 160px; height: 34px;
        background: #000; border-radius: 0 0 20px 20px; z-index: 10;
      }
      .phone-frame::after {
        content: ''; position: absolute; bottom: 8px; left: 50%;
        transform: translateX(-50%); width: 130px; height: 5px;
        background: #334155; border-radius: 3px; z-index: 10;
      }
      #root { display: flex; height: 100%; flex: 1; }
      .phone-footer { text-align: center; }
      .phone-footer p { margin: 0; font-size: 12px; color: #475569; }

      @media (max-width: 500px) {
        body { background: #F8FAFC; }
        .phone-wrapper { gap: 0; }
        .phone-header, .phone-footer { display: none; }
        .phone-frame {
          width: 100vw; height: 100vh;
          border-radius: 0; border: none; box-shadow: none;
        }
        .phone-frame::before, .phone-frame::after { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="phone-wrapper">
      <div class="phone-header">
        <h1>Lumos<span>Road</span></h1>
        <p>Safety-First Navigation for Pune</p>
      </div>
      <div class="phone-frame">
        <div id="root"></div>
      </div>
      <div class="phone-footer">
        <p>Built with Expo &amp; React Native</p>
      </div>
    </div>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    ${scripts}
  </body>
</html>
`;

fs.writeFileSync(distIndex, output, "utf-8");
console.log("Phone frame injected into dist/index.html");
