# Metafield Setup Guide

## Overview

The Save the Sale Extension detects incompatible products using Shopify metafields. You can specify either a simple compatibility flag or a list of specific SKUs that conflict with each product.

## Metafield Configuration

**Required metafield structure:**
- **Namespace**: `custom`
- **Key**: `incompatible_sku`
- **Type**: `single_line_text_field` (recommended) or `boolean`
- **Value Options:**
  - **Comma-separated SKUs**: `"SKU123,SKU456,SKU789"` (recommended)
  - **Legacy boolean**: `true` or `"true"` (marks all products as incompatible)

## Setup Methods

### Method 1: Shopify Admin (Recommended for small catalogs)

#### Step 1: Access Product Metafields
1. Go to **Products** in your Shopify Admin
2. Select the product you want to mark as incompatible
3. Scroll down to the **Metafields** section
4. Click **Add metafield**

#### Step 2: Create the Metafield
1. **Namespace**: Enter `custom`
2. **Key**: Enter `incompatible_sku`
3. **Type**: Select `Single line text`
4. **Value**: Enter comma-separated SKUs that conflict with this product
   - Example: `LARGE-CRATE-001,MEDIUM-CARRIER-B,XL-DOG-BED`
5. Click **Save**

#### Step 3: Repeat for All Incompatible Products
Repeat this process for each product that has conflicts.

### Method 2: Bulk CSV Import

#### Step 1: Export Products
1. Go to **Products** > **Export**
2. Export your current products to get the correct format

#### Step 2: Add Metafield Columns
Add these columns to your CSV:
- `Metafield: custom.incompatible_sku [single_line_text_field]`
- Set value to comma-separated SKUs for each product

Example CSV data:
```
Handle,Title,Metafield: custom.incompatible_sku [single_line_text_field]
large-dog-crate,Large Dog Crate,"MEDIUM-CRATE-001,SMALL-CARRIER-A"
medium-pet-carrier,Medium Pet Carrier,"LARGE-CRATE-001,XL-DOG-BED"
```

#### Step 3: Import Updated CSV
1. Go to **Products** > **Import**
2. Upload your modified CSV file

### Method 3: Shopify GraphQL Admin API

Use this for programmatic setup or large catalogs:

```graphql
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      metafields(first: 10) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "gid://shopify/Product/YOUR_PRODUCT_ID",
    "metafields": [
      {
        "namespace": "custom",
        "key": "incompatible_sku",
        "value": "SKU123,SKU456,SKU789",
        "type": "single_line_text_field"
      }
    ]
  }
}
```

### Method 4: Shopify CLI/API Scripts

Create a script to bulk update products:

```javascript
// bulk-update-metafields.js
const productUpdates = [
  {
    id: 'gid://shopify/Product/123',
    incompatibleSkus: 'LARGE-CRATE-001,MEDIUM-CARRIER-B'
  },
  {
    id: 'gid://shopify/Product/456', 
    incompatibleSkus: 'SMALL-CRATE-A,XL-DOG-BED'
  }
];

productUpdates.forEach(async (update) => {
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id }
        userErrors { field message }
      }
    }
  `;
  
  const variables = {
    input: {
      id: update.id,
      metafields: [{
        namespace: "custom",
        key: "incompatible_sku",
        value: update.incompatibleSkus,
        type: "single_line_text_field"
      }]
    }
  };
  
  // Execute mutation with your GraphQL client
});
```

## Examples

### Scenario: Pet Crate Compatibility

**Large Dog Crate (SKU: LARGE-CRATE-001)**
- Incompatible with: `MEDIUM-CRATE-B,SMALL-CARRIER-A,TRAVEL-KENNEL-S`
- Metafield value: `"MEDIUM-CRATE-B,SMALL-CARRIER-A,TRAVEL-KENNEL-S"`

**Medium Pet Carrier (SKU: MEDIUM-CARRIER-B)**  
- Incompatible with: `LARGE-CRATE-001,XL-DOG-BED,GIANT-KENNEL`
- Metafield value: `"LARGE-CRATE-001,XL-DOG-BED,GIANT-KENNEL"`

### When Customer Adds Both Products:
If a customer adds both "Large Dog Crate" and "Medium Pet Carrier" to their cart, the extension will detect the conflict and show a warning listing both products.

## Verification

### Check Metafields in Admin
1. Go to the product page
2. Scroll to **Metafields** section
3. Verify `custom.incompatible_sku` appears with comma-separated SKUs

### Test the Extension
1. Add a product with incompatible SKUs to cart
2. Add one of the conflicting SKUs to cart  
3. Go to checkout
4. Verify the compatibility warning appears listing both products

### GraphQL Query to List Metafields
```graphql
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    sku
    metafields(first: 10) {
      edges {
        node {
          namespace
          key
          value
          type
        }
      }
    }
  }
}
```

## Common Issues & Solutions

### Issue: Extension not detecting conflicts
**Solutions:**
- Verify namespace is exactly `custom` (lowercase)
- Verify key is exactly `incompatible_sku` (with underscore)
- Check SKUs match exactly (case-sensitive)
- Ensure no extra spaces around commas

### Issue: Wrong products flagged
**Solutions:**
- Review SKU values in metafields
- Use GraphQL query to audit all metafields
- Verify product SKUs match what's in the metafield

### Issue: Extension shows all products as incompatible
**Solutions:**
- Check if using legacy boolean `true` value
- Convert to comma-separated SKU format for granular control

## Best Practices

### SKU Naming
- Use consistent, descriptive SKU patterns
- Example: `SIZE-CATEGORY-NUMBER` → `LARGE-CRATE-001`

### Metafield Management
- Document your incompatibility rules
- Test with small batches before bulk updates
- Regular audits to ensure accuracy

### Testing Strategy
1. Start with 2-3 test products
2. Verify conflicts work correctly  
3. Scale to full catalog
4. Monitor order attributes for effectiveness

## Next Steps

1. Identify product conflict patterns in your catalog
2. Map out which SKUs conflict with each other
3. Choose your preferred setup method
4. Apply metafields systematically
5. Test thoroughly in development store
6. Monitor order tags and customer feedback
