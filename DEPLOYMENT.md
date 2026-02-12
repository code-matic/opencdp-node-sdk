# OpenCDP Node.js SDK - Deployment Guide

## Overview

This SDK is currently published to **two separate npm packages**. 

1. **`@codematic.io/cdp-node`** - Scoped package. . 
2. **`cdp-node`** - Unscoped package. .

## Package Details

| Package Name | Scope | Access | Purpose |
|--------------|-------|--------|---------|
| `@codematic.io/cdp-node` | Scoped | Public | **1st package** - |
| `cdp-node` | Unscoped | Public | **Second package** - |

## Prerequisites

Before deploying, ensure you have:

1. **npm account access** to both packages
2. **Proper authentication** (`npm login`)
3. **Version updated** in `package.json`
4. **All tests passing** (`npm run test`)
5. **Build working** (`npm run build`)

## Deployment Commands

### Deploy to Both Packages (Recommended)

```bash
npm run publish:all
```

This command deploys to both packages sequentially:
1. First deploys to `cdp-node` (unscoped)
2. Then deploys to `@codematic.io/cdp-node` (scoped)

### Alternatively you can deploy to Individual Packages

#### Deploy to Unscoped Package (`cdp-node`)
```bash
npm run publish:unscoped
```

#### Deploy to Scoped Package (`@codematic.io/cdp-node`)
```bash
npm run publish:scoped
```

## Deployment Process

The deployment script (`publish.js`) performs the following steps:

1. **Backup** - Saves original `package.json`
2. **Modify** - Temporarily changes package name for target
3. **Build** - Runs TypeScript compilation
4. **Publish** - Publishes to npm with appropriate access flags
5. **Restore** - Restores original `package.json`

## Version Management

### Updating Version

1. **Manual Update**: Edit `version` in `package.json`
2. **Semantic Versioning**: Follow `MAJOR.MINOR.PATCH` format
3. **Changelog**: Update `CHANGELOG.md` if available

### Version Examples

```json
{
  "version": "4.0.3"  // Current version
}
```

## Deployment Checklist

Before deploying, verify:

- [ ] **Version updated** in `package.json`
- [ ] **All tests passing** (`npm run test`)
- [ ] **Build successful** (`npm run build`)
- [ ] **No linting errors** (`npm run lint` if available)
- [ ] **Documentation updated** (README.md, etc.)
- [ ] **Changelog updated** (if applicable)
- [ ] **npm login** completed
- [ ] **Proper npm permissions** for both packages

## Troubleshooting

### Common Issues

1. **"You cannot publish over the previously published versions"**
   - **Solution**: Update version in `package.json`

2. **"403 Forbidden"**
   - **Solution**: Check npm login and package permissions

3. **"Package name already exists"**
   - **Solution**: Ensure you have access to both package names

4. **Build failures**
   - **Solution**: Run `npm install` and check TypeScript compilation

### Recovery

If deployment fails:

1. **Check logs** for specific error messages
2. **Verify npm login** status
3. **Check package permissions** in npm
4. **Restore package.json** if needed (script handles this automatically)

## Package Usage

### Installation Commands

#### Scoped Package 
```bash
npm install @codematic.io/cdp-node
# or
yarn add @codematic.io/cdp-node
```

#### Unscoped Package
```bash
npm install cdp-node
# or
yarn add cdp-node
```

### Import Examples

#### Scoped Package
```javascript
import { CDPClient } from '@codematic.io/cdp-node';
```

#### Unscoped Package
```javascript
import { CDPClient } from 'cdp-node';
```

## Security Considerations

- **Public packages**: Both packages are public, no sensitive data should be included
- **API keys**: Never commit API keys or secrets
- **Dependencies**: Regularly update dependencies for security patches

## Best Practices

1. **Always test** before deploying
2. **Use semantic versioning** properly
3. **Deploy to both packages** for consistency
4. **Update documentation** with new features
5. **Monitor package downloads** and issues
6. **Keep dependencies updated**

## Support

For deployment issues:

1. Check this documentation
2. Review npm logs
3. Verify package permissions
4. Contact the development team

---

**Last Updated**: August 2024  
**SDK Version**: 4.0.3 