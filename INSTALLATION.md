# Installation Guide - Save the Sale Extension

## Prerequisites

- **Node.js 18+** installed on your machine
- **Shopify CLI** installed globally
- **Shopify Partner Account** with app development access
- **Development Store** for testing
- **Production Store** access for final deployment

## Step 1: Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

Verify installation:
```bash
shopify version
```

## Step 2: Set Up Development Environment

### Navigate to Extension Directory
```bash
cd "/Users/adamtracht/Desktop/Save the Sale Extension"
```

### Install Dependencies
```bash
npm install
```

### Authenticate with Shopify
```bash
shopify auth login
```

## Step 3: Development & Testing

### Start Development Server
```bash
npm run dev
```

This will:
- Prompt you to select/create a Shopify app
- Connect to your development store
- Start local development server
- Provide a preview URL for testing

### Configure Extension in Development Store

1. **Access your development store admin**
2. **Go to Settings > Checkout**
3. **Find "Save the Sale Extension" in the extensions list**
4. **Click "Add" to install the extension**
5. **Configure placement** (typically after order summary)

### Test the Extension

1. **Set up test products** with incompatible SKU metafields (see METAFIELD_SETUP.md)
2. **Add conflicting products to cart**
3. **Go to checkout**
4. **Verify warnings appear correctly**

## Step 4: Deploy to Production

### Build for Production
```bash
npm run build
```

### Deploy Extension
```bash
npm run deploy
```

Follow the prompts to:
- Select your production app
- Confirm deployment
- Get the extension version number

### Submit for Review (if required)

If this is a public app:
1. **Go to Partner Dashboard**
2. **Navigate to your app**
3. **Submit extension for review**
4. **Wait for approval**

## Step 5: Install on Production Store

### For Private Apps (Recommended)
1. **Access your production store admin**
2. **Go to Apps > App and sales channel settings**
3. **Find your app in the list**
4. **Click "Install" if not already installed**

### Configure Extension
1. **Go to Settings > Checkout**
2. **Find "Save the Sale Extension"**
3. **Click "Add" to activate**
4. **Position the extension** (recommended: after order summary, before payment)

## Step 6: Configure Metafields

Follow the **METAFIELD_SETUP.md** guide to:
1. **Add incompatible_sku metafields** to relevant products
2. **Set up comma-separated SKU conflict lists**
3. **Test with sample products**

## Step 7: Verification & Testing

### Test Scenarios
1. **No conflicts**: Add compatible products → No warnings
2. **Single conflict**: Add conflicting products → Warning appears
3. **Multiple conflicts**: Add multiple conflicting products → All listed in warning
4. **Legacy format**: Test products with boolean `true` metafield

### Monitor Order Attributes
Check that orders with warnings include:
- `incompatible_products_warning_shown: true`
- `incompatible_skus: SKU1,SKU2,SKU3`

## Troubleshooting

### Extension Not Appearing
**Solutions:**
- Verify extension is deployed and activated
- Check extension targets in shopify.extension.toml
- Ensure store has checkout extensibility enabled

### Warnings Not Showing
**Solutions:**
- Verify metafields are set correctly (namespace: `custom`, key: `incompatible_sku`)
- Check browser console for JavaScript errors
- Confirm products have correct SKU values

### Development Issues
**Solutions:**
- Run `shopify app dev` to restart development server
- Clear browser cache
- Check Shopify CLI logs for errors

## Production Monitoring

### Key Metrics to Track
- **Warning display frequency**
- **Customer proceed-despite-warning rate**
- **Order attribute tagging accuracy**
- **Extension performance impact**

### Regular Maintenance
- **Monitor error logs**
- **Update metafields** as product catalog changes
- **Review compatibility rules** quarterly
- **Update extension** when new Shopify API versions release

## Security Considerations

- **Metafield access**: Extension only reads product metafields
- **Data collection**: Only order attributes are modified
- **Customer privacy**: No personal data is collected by extension
- **API permissions**: Minimal required permissions only

## Support

### Common Commands
```bash
# Start development
npm run dev

# Build for production  
npm run build

# Deploy to store
npm run deploy

# View logs
shopify app logs

# Update CLI
npm update -g @shopify/cli
```

### Getting Help
- **Shopify Partner Documentation**: https://shopify.dev/docs
- **Extension API Reference**: https://shopify.dev/docs/api/checkout-ui-extensions
- **Community Forums**: https://community.shopify.com/

## Next Steps After Installation

1. **Configure metafields** for your product catalog
2. **Monitor initial performance** for 1-2 weeks
3. **Gather customer feedback** on warning effectiveness
4. **Plan for V2 features** (AI-powered breed recommendations)
5. **Set up analytics dashboard** for tracking success metrics
