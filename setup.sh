#!/bin/bash

# n8n-nodes-fabricjs-renderer setup script

echo "🚀 Setting up n8n-nodes-fabricjs-renderer..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the n8n_package directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if TypeScript is available
if ! command -v tsc &> /dev/null; then
    echo "📝 Installing TypeScript globally..."
    npm install -g typescript
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Run linting
echo "🔍 Running linter..."
npm run lint

if [ $? -eq 0 ]; then
    echo "✅ Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update package.json with your information:"
    echo "   - Change author name and email"
    echo "   - Update repository URL"
    echo "   - Update homepage URL"
    echo ""
    echo "2. Update README.md with your specific information"
    echo ""
    echo "3. Test your node locally:"
    echo "   npm run dev"
    echo ""
    echo "4. Publish to npm:"
    echo "   npm publish"
    echo ""
    echo "5. Submit for n8n verification (optional):"
    echo "   Visit: https://n8n.io/community-nodes"
else
    echo "❌ Setup failed. Please check the errors above."
    exit 1
fi 