import { check } from 'k6';
import { CustomerApiClient } from '../../lib/api-client.js';
import { recordOrderMetrics } from '../../lib/metrics.js';
import { generateOrderData, generateDelay } from '../../lib/data-generator.js';

/**
 * Place order scenario
 */
export default function placeOrder(baseUrl, vendorId, customerId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // Generate realistic order data
  const orderData = generateOrderData(vendorId, customerId);
  
  // Place order
  const response = apiClient.placeOrder(orderData);
  
  // Record order metrics
  recordOrderMetrics(response, 'place', response.success);
  
  // Verify response
  check(response, {
    'order placed successfully': (r) => r.success && r.json && r.json.order,
    'order has required fields': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      const order = r.json.order;
      return order.id && order.status && order.total !== undefined && 
             order.items && Array.isArray(order.items);
    },
    'order status is pending': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.status === 'pending';
    },
    'order placement response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  // Add realistic delay after placing order
  const delay = generateDelay(3, 6);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    orderData: orderData
  };
}

/**
 * Place order with specific items
 */
export function placeOrderWithItems(baseUrl, vendorId, customerId, items) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // Calculate order totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = 3.99;
  const total = subtotal + tax + deliveryFee;
  
  const orderData = {
    vendorId: vendorId,
    customerId: customerId,
    items: items,
    subtotal: subtotal,
    tax: tax,
    deliveryFee: deliveryFee,
    total: total,
    deliveryAddress: generateAddress(),
    specialInstructions: Math.random() > 0.8 ? 'Please ring doorbell' : null,
    paymentMethod: 'credit_card'
  };
  
  const response = apiClient.placeOrder(orderData);
  
  recordOrderMetrics(response, 'place', response.success);
  
  check(response, {
    'order placed with specific items': (r) => r.success && r.json && r.json.order,
    'order total matches calculation': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return Math.abs(r.json.order.total - total) < 0.01; // Allow small rounding differences
    },
  });
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    orderData: orderData
  };
}

/**
 * Place order with different payment methods
 */
export function placeOrderWithPaymentMethod(baseUrl, vendorId, customerId, paymentMethod) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const orderData = generateOrderData(vendorId, customerId);
  orderData.paymentMethod = paymentMethod;
  
  const response = apiClient.placeOrder(orderData);
  
  recordOrderMetrics(response, 'place', response.success);
  
  check(response, {
    'order placed with payment method': (r) => r.success && r.json && r.json.order,
    'payment method recorded': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.paymentMethod === paymentMethod;
    },
  });
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    paymentMethod: paymentMethod
  };
}

/**
 * Simulate order cancellation
 */
export function cancelOrder(baseUrl, orderId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.patch(`/orders/${orderId}/cancel`, null, 'customer');
  
  check(response, {
    'order cancelled successfully': (r) => r.success && r.json && r.json.order,
    'order status is cancelled': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.status === 'cancelled';
    },
  });
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null
  };
}

/**
 * Get order history
 */
export function getOrderHistory(baseUrl, params = {}) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.getOrders(params);
  
  check(response, {
    'order history retrieved': (r) => r.success && r.json && r.json.orders,
    'orders have required fields': (r) => {
      if (!r.success || !r.json || !r.json.orders) return false;
      return r.json.orders.every(order => 
        order.id && order.status && order.total !== undefined
      );
    },
  });
  
  return {
    success: response.success,
    orders: response.json ? response.json.orders : [],
    totalCount: response.json ? response.json.totalCount : 0
  };
}

/**
 * Simulate complete checkout flow
 */
export function completeCheckoutFlow(baseUrl, vendorId, customerId, cartItems) {
  // Step 1: Review cart
  const cartReview = getCart(baseUrl);
  if (!cartReview.success) {
    return { success: false, error: 'Failed to review cart' };
  }
  
  // Step 2: Place order
  const orderResult = placeOrderWithItems(baseUrl, vendorId, customerId, cartItems);
  if (!orderResult.success) {
    return { success: false, error: 'Failed to place order' };
  }
  
  // Step 3: Clear cart after successful order
  clearCart(baseUrl);
  
  return {
    success: true,
    order: orderResult.order,
    cartReview: cartReview.cart
  };
} 