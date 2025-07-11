import { check } from 'k6';
import { VendorApiClient } from '../../lib/api-client.js';
import { recordOrderMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Accept order scenario
 */
export default function acceptOrder(baseUrl, orderId) {
  const apiClient = new VendorApiClient(baseUrl);
  
  // Accept order
  const response = apiClient.acceptOrder(orderId);
  
  // Record order metrics
  recordOrderMetrics(response, 'accept', response.success);
  
  // Verify response
  check(response, {
    'order accepted successfully': (r) => r.success && r.json && r.json.order,
    'order status is accepted': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.status === 'accepted';
    },
    'order has acceptance timestamp': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.acceptedAt !== undefined;
    },
    'accept order response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  // Add realistic delay after accepting order
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    orderId: orderId
  };
}

/**
 * Update order status
 */
export function updateOrderStatus(baseUrl, orderId, status) {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.updateOrderStatus(orderId, status);
  
  check(response, {
    'order status updated': (r) => r.success && r.json && r.json.order,
    'status matches request': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.status === status;
    },
  });
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    status: status
  };
}

/**
 * Start preparing order
 */
export function startPreparingOrder(baseUrl, orderId) {
  return updateOrderStatus(baseUrl, orderId, 'preparing');
}

/**
 * Mark order as ready for pickup
 */
export function markOrderReadyForPickup(baseUrl, orderId) {
  return updateOrderStatus(baseUrl, orderId, 'ready_for_pickup');
}

/**
 * Simulate complete order processing flow
 */
export function processOrderFlow(baseUrl, orderId) {
  const flow = {
    orderId: orderId,
    steps: [],
    success: false
  };
  
  // Step 1: Accept order
  const acceptResult = acceptOrder(baseUrl, orderId);
  flow.steps.push({
    step: 'accept',
    success: acceptResult.success,
    status: acceptResult.order ? acceptResult.order.status : null
  });
  
  if (!acceptResult.success) {
    return flow;
  }
  
  // Step 2: Start preparing
  const preparingResult = startPreparingOrder(baseUrl, orderId);
  flow.steps.push({
    step: 'preparing',
    success: preparingResult.success,
    status: preparingResult.order ? preparingResult.order.status : null
  });
  
  if (!preparingResult.success) {
    return flow;
  }
  
  // Simulate preparation time
  const prepTime = generateDelay(30, 120); // 30 seconds to 2 minutes
  sleep(prepTime / 1000);
  
  // Step 3: Mark ready for pickup
  const readyResult = markOrderReadyForPickup(baseUrl, orderId);
  flow.steps.push({
    step: 'ready_for_pickup',
    success: readyResult.success,
    status: readyResult.order ? readyResult.order.status : null
  });
  
  flow.success = flow.steps.every(step => step.success);
  
  return flow;
}

/**
 * Accept multiple orders
 */
export function acceptMultipleOrders(baseUrl, orderIds) {
  const results = [];
  
  for (const orderId of orderIds) {
    const result = acceptOrder(baseUrl, orderId);
    results.push(result);
    
    // Small delay between accepting orders
    sleep(1);
  }
  
  return {
    success: results.every(r => r.success),
    results: results
  };
}

/**
 * Batch process orders
 */
export function batchProcessOrders(baseUrl, orderIds) {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.post('/vendor/orders/batch-accept', {
    orderIds: orderIds
  }, 'vendor');
  
  check(response, {
    'batch order processing successful': (r) => r.success && r.json && r.json.results,
    'all orders processed': (r) => {
      if (!r.success || !r.json || !r.json.results) return false;
      return r.json.results.every(result => result.success);
    },
  });
  
  return {
    success: response.success,
    results: response.json ? response.json.results : [],
    orderIds: orderIds
  };
}

/**
 * Get order processing timeline
 */
export function getOrderTimeline(baseUrl, orderId) {
  const apiClient = new VendorApiClient(baseUrl);
  
  const response = apiClient.get(`/vendor/orders/${orderId}/timeline`);
  
  check(response, {
    'order timeline retrieved': (r) => r.success && r.json && r.json.timeline,
    'timeline has events': (r) => {
      if (!r.success || !r.json || !r.json.timeline) return false;
      return Array.isArray(r.json.timeline) && r.json.timeline.length > 0;
    },
  });
  
  return {
    success: response.success,
    timeline: response.json ? response.json.timeline : [],
    orderId: orderId
  };
} 