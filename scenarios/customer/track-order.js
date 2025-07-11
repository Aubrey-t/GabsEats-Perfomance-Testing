import { check } from 'k6';
import { CustomerApiClient } from '../../lib/api-client.js';
import { recordOrderMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Track order scenario
 */
export default function trackOrder(baseUrl, orderId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // Track order
  const response = apiClient.trackOrder(orderId);
  
  // Record tracking metrics
  recordOrderMetrics(response, 'track', response.success);
  
  // Verify response
  check(response, {
    'order tracking successful': (r) => r.success && r.json && r.json.tracking,
    'tracking has required fields': (r) => {
      if (!r.success || !r.json || !r.json.tracking) return false;
      const tracking = r.json.tracking;
      return tracking.orderId && tracking.status && tracking.estimatedDeliveryTime;
    },
    'order tracking response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  // Add realistic delay after tracking
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    tracking: response.json ? response.json.tracking : null,
    orderId: orderId
  };
}

/**
 * Track order with location updates
 */
export function trackOrderWithLocation(baseUrl, orderId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.get(`/orders/${orderId}/track/location`);
  
  check(response, {
    'order location tracking successful': (r) => r.success && r.json && r.json.location,
    'location has coordinates': (r) => {
      if (!r.success || !r.json || !r.json.location) return false;
      const location = r.json.location;
      return location.latitude !== undefined && location.longitude !== undefined;
    },
  });
  
  return {
    success: response.success,
    location: response.json ? response.json.location : null,
    orderId: orderId
  };
}

/**
 * Get order status history
 */
export function getOrderStatusHistory(baseUrl, orderId) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.get(`/orders/${orderId}/status-history`);
  
  check(response, {
    'status history retrieved': (r) => r.success && r.json && r.json.statusHistory,
    'status history is array': (r) => {
      if (!r.success || !r.json || !r.json.statusHistory) return false;
      return Array.isArray(r.json.statusHistory);
    },
    'status entries have required fields': (r) => {
      if (!r.success || !r.json || !r.json.statusHistory) return false;
      return r.json.statusHistory.every(entry => 
        entry.status && entry.timestamp && entry.description
      );
    },
  });
  
  return {
    success: response.success,
    statusHistory: response.json ? response.json.statusHistory : [],
    orderId: orderId
  };
}

/**
 * Simulate continuous order tracking
 */
export function continuousOrderTracking(baseUrl, orderId, duration = 300) {
  const apiClient = new CustomerApiClient(baseUrl);
  const startTime = Date.now();
  const trackingUpdates = [];
  
  while (Date.now() - startTime < duration * 1000) {
    const response = apiClient.trackOrder(orderId);
    
    if (response.success && response.json && response.json.tracking) {
      trackingUpdates.push({
        timestamp: new Date().toISOString(),
        status: response.json.tracking.status,
        estimatedDeliveryTime: response.json.tracking.estimatedDeliveryTime
      });
      
      // Check if order is delivered or cancelled
      if (response.json.tracking.status === 'delivered' || 
          response.json.tracking.status === 'cancelled') {
        break;
      }
    }
    
    // Wait before next tracking update
    sleep(30); // 30 seconds between updates
  }
  
  return {
    success: trackingUpdates.length > 0,
    trackingUpdates: trackingUpdates,
    orderId: orderId,
    duration: Date.now() - startTime
  };
}

/**
 * Track multiple orders
 */
export function trackMultipleOrders(baseUrl, orderIds) {
  const results = [];
  
  for (const orderId of orderIds) {
    const result = trackOrder(baseUrl, orderId);
    results.push(result);
    
    // Small delay between tracking different orders
    sleep(1);
  }
  
  return {
    success: results.every(r => r.success),
    results: results
  };
}

/**
 * Get delivery notifications
 */
export function getDeliveryNotifications(baseUrl) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.get('/notifications/delivery');
  
  check(response, {
    'delivery notifications retrieved': (r) => r.success && r.json && r.json.notifications,
    'notifications are array': (r) => {
      if (!r.success || !r.json || !r.json.notifications) return false;
      return Array.isArray(r.json.notifications);
    },
  });
  
  return {
    success: response.success,
    notifications: response.json ? response.json.notifications : []
  };
}

/**
 * Simulate complete order tracking experience
 */
export function completeOrderTrackingExperience(baseUrl, orderId) {
  const experience = {
    orderId: orderId,
    steps: [],
    success: false
  };
  
  // Step 1: Initial order tracking
  const initialTracking = trackOrder(baseUrl, orderId);
  experience.steps.push({
    step: 'initial_tracking',
    success: initialTracking.success,
    status: initialTracking.tracking ? initialTracking.tracking.status : null
  });
  
  if (!initialTracking.success) {
    return experience;
  }
  
  // Step 2: Get status history
  const statusHistory = getOrderStatusHistory(baseUrl, orderId);
  experience.steps.push({
    step: 'status_history',
    success: statusHistory.success,
    historyCount: statusHistory.statusHistory.length
  });
  
  // Step 3: Track with location (if available)
  const locationTracking = trackOrderWithLocation(baseUrl, orderId);
  experience.steps.push({
    step: 'location_tracking',
    success: locationTracking.success,
    hasLocation: !!locationTracking.location
  });
  
  // Step 4: Get delivery notifications
  const notifications = getDeliveryNotifications(baseUrl);
  experience.steps.push({
    step: 'notifications',
    success: notifications.success,
    notificationCount: notifications.notifications.length
  });
  
  experience.success = experience.steps.every(step => step.success);
  
  return experience;
} 