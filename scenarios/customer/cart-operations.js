import { check } from 'k6';
import { CustomerApiClient } from '../../lib/api-client.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Add item to cart scenario
 */
export default function addToCart(baseUrl, item) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // Add item to cart
  const response = apiClient.addToCart(item);
  
  // Verify response
  check(response, {
    'item added to cart': (r) => r.success && r.json && r.json.cartItem,
    'cart item has correct data': (r) => {
      if (!r.success || !r.json || !r.json.cartItem) return false;
      const cartItem = r.json.cartItem;
      return cartItem.id && cartItem.menuItemId === item.menuItemId && 
             cartItem.quantity === item.quantity;
    },
    'add to cart response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  // Add realistic delay after adding item
  const delay = generateDelay(1, 3);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    cartItem: response.json ? response.json.cartItem : null
  };
}

/**
 * Get cart contents
 */
export function getCart(baseUrl) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.getCart();
  
  check(response, {
    'cart retrieved successfully': (r) => r.success && r.json && r.json.cart,
    'cart has items array': (r) => {
      if (!r.success || !r.json || !r.json.cart) return false;
      return Array.isArray(r.json.cart.items);
    },
    'cart has totals': (r) => {
      if (!r.success || !r.json || !r.json.cart) return false;
      return r.json.cart.subtotal !== undefined && r.json.cart.total !== undefined;
    },
  });
  
  return {
    success: response.success,
    cart: response.json ? response.json.cart : { items: [], subtotal: 0, total: 0 }
  };
}

/**
 * Update cart item quantity
 */
export function updateCartItem(baseUrl, itemId, quantity) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.updateCartItem(itemId, quantity);
  
  check(response, {
    'cart item updated': (r) => r.success && r.json && r.json.cartItem,
    'quantity updated correctly': (r) => {
      if (!r.success || !r.json || !r.json.cartItem) return false;
      return r.json.cartItem.quantity === quantity;
    },
  });
  
  return {
    success: response.success,
    cartItem: response.json ? response.json.cartItem : null
  };
}

/**
 * Remove item from cart
 */
export function removeFromCart(baseUrl, itemId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.removeFromCart(itemId);
  
  check(response, {
    'item removed from cart': (r) => r.success,
    'remove response time < 1500ms': (r) => r.timings.duration < 1500,
  });
  
  return {
    success: response.success
  };
}

/**
 * Clear entire cart
 */
export function clearCart(baseUrl) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.delete('/cart');
  
  check(response, {
    'cart cleared': (r) => r.success,
  });
  
  return {
    success: response.success
  };
}

/**
 * Add multiple items to cart
 */
export function addMultipleItemsToCart(baseUrl, items) {
  const results = [];
  
  for (const item of items) {
    const result = addToCart(baseUrl, item);
    results.push(result);
    
    // Small delay between adding items
    sleep(0.5);
  }
  
  return {
    success: results.every(r => r.success),
    results: results
  };
}

/**
 * Simulate realistic cart building
 */
export function buildRealisticCart(baseUrl, vendorId, menuItems) {
  const cartItems = [];
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  
  for (let i = 0; i < numItems; i++) {
    const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
    
    const cartItem = {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      specialInstructions: Math.random() > 0.7 ? 'Extra cheese please' : null
    };
    
    const result = addToCart(baseUrl, cartItem);
    if (result.success) {
      cartItems.push(result.cartItem);
    }
    
    // Realistic delay between adding items
    const delay = generateDelay(2, 5);
    sleep(delay / 1000);
  }
  
  return {
    success: cartItems.length > 0,
    cartItems: cartItems
  };
} 