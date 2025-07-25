#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting GitHub Pages deployment build ---"

# 1. Clean up old build artifacts
echo "--- Cleaning old docs folder..."
rm -rf docs
mkdir docs

# 2. Build the React application
echo "--- Building React app..."
cd react-app
npm install
npm run build # This creates the react-app/dist folder

# 3. Move the built React app to its final destination in docs
# Note: We are moving the contents of dist, not the folder itself
echo "--- Moving built React app to docs/jarvis-app..."
mv dist ../docs/jarvis-app
cd ..

# 4. Copy the main static site to the docs folder
echo "--- Copying main marketing site to docs..."
cp -R main-site/* docs/

# 5. Copy the CNAME file for custom domain
echo "--- Copying CNAME..."
cp CNAME docs/

echo "--- Build complete. The 'docs' folder is ready for deployment."