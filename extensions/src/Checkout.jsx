import React from 'react';
import {
  reactExtension,
  useCartLines,
  useApplyAttributeChange,
  useInstructions,
  Banner,
  BlockStack,
  Text,
  useTranslate,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const cartLines = useCartLines();
  const applyAttributeChange = useApplyAttributeChange();
  const instructions = useInstructions();
  const translate = useTranslate();

  // Check for incompatible products in cart with error handling
  const incompatibleProducts = cartLines.filter(line => {
    try {
      const product = line.merchandise;
      if (!product || !product.metafields) return false;
      
      // Get all SKUs currently in cart
      const cartSkus = cartLines.map(cartLine => 
        cartLine.merchandise.sku || cartLine.merchandise.id
      ).filter(Boolean);
      
      // Check for incompatible_sku metafield
      const incompatibleMetafield = product.metafields.find(
        metafield => 
          metafield?.namespace === 'custom' && 
          metafield?.key === 'incompatible_sku'
      );
      
      if (!incompatibleMetafield?.value) return false;
      
      // Handle boolean true (legacy support)
      if (incompatibleMetafield.value === 'true' || incompatibleMetafield.value === true) {
        return true;
      }
      
      // Parse comma-separated SKUs and check for conflicts
      const incompatibleSkus = incompatibleMetafield.value
        .split(',')
        .map(sku => sku.trim())
        .filter(Boolean);
      
      // Check if any incompatible SKUs are present in cart
      const hasConflict = incompatibleSkus.some(incompatibleSku => 
        cartSkus.includes(incompatibleSku)
      );
      
      return hasConflict;
    } catch (error) {
      console.error('Error checking product compatibility:', error);
      return false;
    }
  });

  // Tag order if incompatible products are present
  React.useEffect(() => {
    if (incompatibleProducts.length > 0 && instructions.attributes.canUpdateAttributes) {
      const incompatibleSkus = incompatibleProducts.map(line => 
        line.merchandise.sku || line.merchandise.id
      );
      
      applyAttributeChange({
        type: 'updateAttribute',
        key: 'incompatible_products_warning_shown',
        value: 'true'
      });
      
      applyAttributeChange({
        type: 'updateAttribute',
        key: 'incompatible_skus',
        value: incompatibleSkus.join(',')
      });
    }
  }, [incompatibleProducts, instructions.attributes.canUpdateAttributes, applyAttributeChange]);

  // Don't render anything if no incompatible products
  if (incompatibleProducts.length === 0) {
    return null;
  }

  return (
    <BlockStack spacing="tight">
      <Banner status="warning">
        <BlockStack spacing="tight">
          <Text size="medium" emphasis="strong">
            ⚠️ Compatibility Warning
          </Text>
          <Text size="small">
            {incompatibleProducts.length === 1 
              ? `The following item in your cart may not be suitable for your needs:`
              : `The following ${incompatibleProducts.length} items in your cart may are not compatible with one another:.`
            }
          </Text>
          <BlockStack spacing="extraTight">
            {incompatibleProducts.map((line, index) => (
              <Text key={line.id} size="small" emphasis="strong">
                • {line.merchandise.title} {line.quantity > 1 && `(Qty: ${line.quantity})`}
              </Text>
            ))}
          </BlockStack>
          <Text size="small">
            Please review these products before completing your purchase.
          </Text>
        </BlockStack>
      </Banner>
      
      
      <Banner status="info">
        <Text size="small">
          Need help choosing the right size? Contact our customer support team 
          for personalized recommendations.
        </Text>
      </Banner>
    </BlockStack>
  );
}

