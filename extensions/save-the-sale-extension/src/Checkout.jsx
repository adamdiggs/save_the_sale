import React from 'react';
import {
  reactExtension,
  Banner,
  BlockStack,
  useCartLines,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  useApi,
  Text
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const cartLines = useCartLines();
  const applyAttributeChange = useApplyAttributeChange();
  const instructions = useInstructions();
  const translate = useTranslate();
  const { query } = useApi();
  const [variantMetafields, setVariantMetafields] = useState({});
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(new Set());
  const attributesAppliedRef = useRef(new Set());

  // Query variant metafields via Storefront API
  useEffect(() => {
    const fetchVariantMetafields = async () => {
      if (cartLines.length === 0) return;
      
      const variantIds = cartLines.map(line => line.merchandise.id);
      const cacheKey = variantIds.sort().join(',');
      
      // Skip if we've already processed this exact cart configuration
      if (processedRef.current.has(cacheKey)) {
        setLoading(false);
        return;
      }
      
      try {
        // console.log('Fetching metafields for variants:', variantIds);
        
        const queries = variantIds.map(variantId => {
          return query(`
            query getVariantMetafields($id: ID!) {
              node(id: $id) {
                ... on ProductVariant {
                  sku
                  metafield(namespace: "custom", key: "incompatible_skus") {
                    value
                  }
                }
              }
            }
          `, { variables: { id: variantId } });
        });
        
        const results = await Promise.all(queries);
        const metafieldData = {};
        
        results.forEach((result, index) => {
          const variantId = variantIds[index];
          if (result?.data?.node?.metafield) {
            metafieldData[variantId] = result.data.node.metafield.value;
            // console.log(`Variant ${result.data.node.sku} metafield:`, result.data.node.metafield.value);
          }
        });
        
        setVariantMetafields(prev => ({ ...prev, ...metafieldData }));
        processedRef.current.add(cacheKey);
      } catch (error) {
        console.error('Error fetching variant metafields:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVariantMetafields();
  }, [cartLines.map(line => line.merchandise.id).join(',')]);

  // Check for incompatible products in cart using fetched metafields
  const incompatibilityInfo = useMemo(() => {
    const conflicts = [];
    
    cartLines.forEach(line => {
      try {
        const variant = line.merchandise;
        const variantId = variant.id;
        const metafieldValue = variantMetafields[variantId];
        
        if (!metafieldValue) return;
        
        // Get all SKUs currently in cart
        const cartSkus = cartLines.map(cartLine => 
          cartLine.merchandise.sku || cartLine.merchandise.id
        ).filter(Boolean);
        
        // Handle boolean true (legacy support)
        if (metafieldValue === 'true' || metafieldValue === true) {
          conflicts.push({
            product: line,
            incompatibleWith: cartLines.filter(l => l.id !== line.id)
          });
          return;
        }
        
        // Parse comma-separated SKUs and check for conflicts
        const incompatibleSkus = metafieldValue
          .split(',')
          .map(sku => sku.trim())
          .filter(Boolean);
        
        // Find specific incompatible products in cart
        const incompatibleProducts = cartLines.filter(cartLine => {
          const cartSku = cartLine.merchandise.sku || cartLine.merchandise.id;
          return cartLine.id !== line.id && incompatibleSkus.includes(cartSku);
        });
        
        if (incompatibleProducts.length > 0) {
          conflicts.push({
            product: line,
            incompatibleWith: incompatibleProducts
          });
        }
        
        // console.log(`Variant ${variant.sku} conflicts:`, incompatibleProducts.length > 0, 'incompatible with:', incompatibleProducts.map(p => p.merchandise.sku));
      } catch (error) {
        console.error('Error checking variant compatibility:', error);
      }
    });
    
    return conflicts;
  }, [cartLines, variantMetafields]);

  // Tag order if incompatible products are present - memoize to prevent re-renders
  const attributeUpdateNeeded = useMemo(() => {
    if (incompatibilityInfo.length === 0 || !instructions.attributes.canUpdateAttributes) {
      return null;
    }
    
    const allIncompatibleSkus = incompatibilityInfo.flatMap(info => [
      info.product.merchandise.sku || info.product.merchandise.id,
      ...info.incompatibleWith.map(line => line.merchandise.sku || line.merchandise.id)
    ]).filter(Boolean);
    
    const skuString = allIncompatibleSkus.join(',');
    
    return {
      needsWarning: instructions.attributes.warning_shown !== 'true',
      needsSkuUpdate: instructions.attributes.incompat_skus !== skuString,
      skuString
    };
  }, [incompatibilityInfo, instructions.attributes.canUpdateAttributes, instructions.attributes.warning_shown, instructions.attributes.incompat_skus]);
  
  React.useEffect(() => {
    if (!attributeUpdateNeeded) return;
    
    const cacheKey = `${attributeUpdateNeeded.needsWarning}-${attributeUpdateNeeded.skuString}`;
    if (attributesAppliedRef.current.has(cacheKey)) return;
    
    if (attributeUpdateNeeded.needsWarning) {
      applyAttributeChange({
        type: 'updateAttribute',
        key: 'warning_shown',
        value: 'true'
      });
    }
    
    if (attributeUpdateNeeded.needsSkuUpdate) {
      applyAttributeChange({
        type: 'updateAttribute',
        key: 'incompat_skus',
        value: attributeUpdateNeeded.skuString
      });
    }
    
    attributesAppliedRef.current.add(cacheKey);
  }, [attributeUpdateNeeded, applyAttributeChange]);

  // Show loading state
  if (loading) {
    return null; // or a loading spinner if desired
  }
  
  // Don't render anything if no incompatible products
  if (incompatibilityInfo.length === 0) {
    return null;
  }

  return (
    <BlockStack spacing="tight">
      <Banner status="warning">
        <BlockStack spacing="tight">
          <Text size="medium" emphasis="strong">
            Compatibility Warning
          </Text>
          <BlockStack spacing="extraTight">
            {incompatibilityInfo.map((conflict, index) => (
              <BlockStack key={conflict.product.id} spacing="extraTight">
                <Text size="small" emphasis="strong">
                  • {conflict.product.merchandise.title} {conflict.product.quantity > 1 && `(Qty: ${conflict.product.quantity})`}
                  is not compatible with {conflict.incompatibleWith.map(item => item.merchandise.title).join(', ')}
                </Text>
              </BlockStack>
            ))}
          </BlockStack>
          <Text size="small">
            Please review these products before completing your purchase.
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}

