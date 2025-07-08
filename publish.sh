#!/bin/bash

echo "🚀 Publishing n8n-nodes-contentdrips with correct naming convention"

# Remove old package-lock.json to regenerate with new package name
echo "📦 Cleaning up old package-lock.json..."
rm -f package-lock.json

# Reinstall dependencies to generate new package-lock.json
echo "📦 Reinstalling dependencies..."
npm install

# Build the package
echo "🔨 Building the package..."
npm run build

# Run linting
echo "🔍 Running linter..."
npm run lint

# Check if everything looks good
echo "✅ Pre-publish checks complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the build completed successfully"
echo "2. Test your node locally if needed"
echo "3. Run: npm publish"
echo ""
echo "⚠️  Important notes:"
echo "- This is a NEW package name, so it will be published as a fresh package"
echo "- Users will need to uninstall the old 'contentdrips-n8n' and install 'n8n-nodes-contentdrips'"
echo "- Consider updating your GitHub repository name to match: 'n8n-nodes-contentdrips'"
echo ""
echo "🔗 Installation command for users:"
echo "   npm install n8n-nodes-contentdrips" 