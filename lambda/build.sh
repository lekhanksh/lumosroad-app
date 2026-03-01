#!/bin/bash
set -e

echo "Building Python Lambda deployment package..."

# Clean previous builds
rm -rf deploy/
mkdir -p deploy

# Copy function and requirements
cp lambda_function.py deploy/
cp requirements.txt deploy/

# Install dependencies into deploy folder
cd deploy
pip install -r requirements.txt -t .

# Create zip
zip -r ../safety-scorer-python.zip .

cd ..
echo "Built: safety-scorer-python.zip"
ls -lh safety-scorer-python.zip
