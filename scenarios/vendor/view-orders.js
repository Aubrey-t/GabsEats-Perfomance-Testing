import { check } from 'k6';
import { VendorApiClient } from '../../lib/api-client.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * View incoming orders scenario
 */
export default function viewOrders(baseUrl, params = {}) {
  const apiClient = new VendorApiClient(baseUrl);
  
  // Get incoming orders
  const response = apiClient.getOrders(params);
  
  // Verify response
  check(response, {
    'orders retrieved successfully': (r) => r.success && r.json && r.json.orders,
    'orders have required fields': (r) => {
      if (!r.success || !r.json || !r.json.orders) return false;
      return r.json.orders.every(order => 
        order.id && order.status && order.total !== undefined && 
        order.customerId && order.items
      );
    },
    'orders response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  // Add realistic delay after viewing orders
  const delay = generateDelay(2, 5);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    orders: response.json ? response.json.orders : [],
    totalCount: response.json ? response.json.totalCount : 0
  };
}

/**
 * View orders by status
 */
export function viewOrdersByStatus(baseUrl, status) {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.getOrders({ status });
  
  check(response, {
    'orders filtered by status': (r) => r.success && r.json && r.json.orders,
    'all orders match status': (r) => {
      if (!r.success || !r.json || !r.json.orders) return false;
      return r.json.orders.every(order => order.status === status);
    },
  });
  
  return {
    success: response.success,
    orders: response.json ? response.json.orders : [],
    status: status
  };
}

/**
 * View pending orders
 */
export function viewPendingOrders(baseUrl) {
  return viewOrdersByStatus(baseUrl, 'pending');
}

/**
 * View accepted orders
 */
export function viewAcceptedOrders(baseUrl) {
  return viewOrdersByStatus(baseUrl, 'accepted');
}

/**
 * View preparing orders
 */
export function viewPreparingOrders(baseUrl) {
  return viewOrdersByStatus(baseUrl, 'preparing');
}

/**
 * View ready for pickup orders
 */
export function viewReadyForPickupOrders(baseUrl) {
  return viewOrdersByStatus(baseUrl, 'ready_for_pickup');
}

/**
 * Get order details
 */
export function getOrderDetails(baseUrl, orderId) {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.get(`/vendor/orders/${orderId}`);
  
  check(response, {
    'order details retrieved': (r) => r.success && r.json && r.json.order,
    'order has complete details': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      const order = r.json.order;
      return order.id && order.status && order.total !== undefined && 
             order.customerId && order.items && order.deliveryAddress;
    },
  });
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null
  };
}

/**
 * Get order statistics
 */
export function getOrderStatistics(baseUrl, timeRange = 'today') {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.get(`/vendor/orders/statistics?timeRange=${timeRange}`);
  
  check(response, {
    'order statistics retrieved': (r) => r.success && r.json && r.json.statistics,
    'statistics have required fields': (r) => {
      if (!r.success || !r.json || !r.json.statistics) return false;
      const stats = r.json.statistics;
      return stats.totalOrders !== undefined && stats.pendingOrders !== undefined &&
             stats.completedOrders !== undefined && stats.revenue !== undefined;
    },
  });
  
  return {
    success: response.success,
    statistics: response.json ? response.json.statistics : null,
    timeRange: timeRange
  };
} 