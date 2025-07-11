import { check } from 'k6';
import { CustomerApiClient } from '../../lib/api-client.js';
import { recordBrowsingMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * View vendor menu scenario
 */
export default function viewMenu(baseUrl, vendorId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // View vendor menu
  const response = apiClient.viewMenu(vendorId);
  
  // Record menu viewing metrics
  recordBrowsingMetrics(response, 'menu');
  
  // Verify response
  check(response, {
    'menu loaded successfully': (r) => r.success && r.json && r.json.menu,
    'menu has items': (r) => {
      if (!r.success || !r.json || !r.json.menu) return false;
      return Array.isArray(r.json.menu) && r.json.menu.length > 0;
    },
    'menu items have required fields': (r) => {
      if (!r.success || !r.json || !r.json.menu) return false;
      return r.json.menu.every(item => 
        item.id && item.name && item.price !== undefined && item.description
      );
    },
    'menu load response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  // Add realistic delay after viewing menu
  const delay = generateDelay(2, 5);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    menu: response.json ? response.json.menu : [],
    vendorId: vendorId
  };
}

/**
 * View menu with category filter
 */
export function viewMenuByCategory(baseUrl, vendorId, category) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.viewMenu(vendorId, { category });
  
  recordBrowsingMetrics(response, 'menu');
  
  check(response, {
    'menu filtered by category': (r) => r.success && r.json && r.json.menu,
    'all items match category': (r) => {
      if (!r.success || !r.json || !r.json.menu) return false;
      return r.json.menu.every(item => item.category === category);
    },
  });
  
  return {
    success: response.success,
    menu: response.json ? response.json.menu : [],
    vendorId: vendorId,
    category: category
  };
}

/**
 * Get menu item details
 */
export function getMenuItemDetails(baseUrl, vendorId, itemId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.get(`/vendors/${vendorId}/menu/items/${itemId}`);
  
  check(response, {
    'item details loaded': (r) => r.success && r.json && r.json.item,
    'item has all details': (r) => {
      if (!r.success || !r.json || !r.json.item) return false;
      const item = r.json.item;
      return item.id && item.name && item.price !== undefined && 
             item.description && item.preparationTime !== undefined;
    },
  });
  
  return {
    success: response.success,
    item: response.json ? response.json.item : null
  };
} 