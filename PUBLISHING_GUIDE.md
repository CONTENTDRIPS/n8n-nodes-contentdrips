# Publishing Guide for n8n-nodes-contentdrips

This guide will help you publish your Contentdrips API node to the n8n community.

## Prerequisites

Before publishing, ensure you have:

1. A Contentdrips account with API access
2. Node.js 18+ installed
3. npm account for publishing packages
4. (Optional) GitHub repository for source code

## Setup Steps

### 1. Prepare the Package

```bash
# Navigate to the n8n_package directory
cd n8n_package

# Run the setup script
./setup.sh
```

### 2. Customize Your Package

Update the following files with your information:

#### package.json
```json
{
  "name": "n8n-nodes-contentdrips",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/n8n-nodes-contentdrips.git"
  },
  "homepage": "https://github.com/yourusername/n8n-nodes-contentdrips"
}
```

#### credentials/ContentdripsApi.credentials.ts
Update the `documentationUrl` to point to your documentation.

### 3. Test Locally

Before publishing, test your node locally:

```bash
# Build the project
npm run build

# Link for local testing
npm link

# In your n8n installation directory
npm link n8n-nodes-contentdrips
```

### 4. Publish to npm

```bash
# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish
```

## Standards Compliance

Your package follows n8n community node standards:

✅ **Package Name**: Starts with `n8n-nodes-`
✅ **Keywords**: Includes `n8n-community-node-package`
✅ **Package.json**: Contains `n8n` attribute with nodes and credentials
✅ **TypeScript**: Written in TypeScript with proper types
✅ **Documentation**: Comprehensive README included

## Verification Process (Optional)

To get your node verified by n8n:

### Technical Requirements
- ✅ No runtime dependencies (dev dependencies are allowed)
- ✅ Follows UX guidelines
- ✅ Proper error handling
- ✅ Comprehensive documentation

### Submission
1. Publish to npm registry
2. Submit via: https://n8n.io/community-nodes
3. Wait for n8n team review

## File Structure

Your completed n8n package has this structure:

```
n8n_package/
├── credentials/
│   └── ContentdripsApi.credentials.ts
├── nodes/
│   └── Contentdrips/
│       ├── Contentdrips.node.ts
│       └── GenericFunctions.ts
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .gitignore
├── README.md
├── LICENSE.md
├── setup.sh
└── PUBLISHING_GUIDE.md
```

## Node Features

Your n8n node provides:

### Operations
- **Generate Graphic**: Create PNG or PDF graphics from templates
- **Generate Carousel**: Create multi-slide carousels with intro, content, and ending slides
- **Check Job Status**: Monitor background job processing
- **Get Job Result**: Retrieve completed results with download URLs

### Configuration Options
- Template ID selection
- Output format choice (PNG/PDF)
- Branding configuration (name, handle, bio, website, avatar)
- Content updates via labeled elements
- Carousel structure (intro, slides, ending)

### Error Handling
- Parameter validation
- API error catching
- Timeout management
- Continue on fail support

## Usage in n8n

Once published and installed, users can:

1. Add the "Contentdrips" node to their workflows
2. Configure credentials with their Contentdrips API token
3. Choose operations and provide template data
4. Process results in subsequent nodes

## Maintenance

### Updating Your Node

1. Make changes to the TypeScript files
2. Update version in package.json
3. Run `npm run build`
4. Run `npm publish`

### Monitoring

- Check npm download statistics
- Monitor user feedback and issues
- Keep dependencies updated
- Follow n8n version compatibility

## Support

For questions or issues:

1. Check n8n community forums
2. Review n8n documentation
3. Create GitHub issues in your repository
4. Engage with the n8n community

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) 