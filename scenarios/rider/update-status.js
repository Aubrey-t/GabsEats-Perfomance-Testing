import { check } from 'k6';
import { RiderApiClient } from '../../lib/api-client.js';
import { recordOrderMetrics } from '../../lib/metrics.js';
import { generateLocation, generateDelay } from '../../lib/data-generator.js';

/**
 * Update order status scenario
 */
export default function updateOrderStatus(baseUrl, orderId, status) {
  const apiClient = new RiderApiClient(baseUrl);
  
  // Update order status
  const response = apiClient.updateOrderStatus(orderId, status);
  
  // Record delivery metrics
  recordOrderMetrics(response, 'deliver', response.success);
  
  // Verify response
  check(response, {
    'order status updated successfully': (r) => r.success && r.json && r.json.order,
    'status matches request': (r) => {
      if (!r.success || !r.json || !r.json.order) return false;
      return r.json.order.status === status;
    },
    'status update response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  // Add realistic delay after status update
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    order: response.json ? response.json.order : null,
    status: status
  };
}

/**
 * Accept delivery assignment
 */
export function acceptAssignment(baseUrl, orderId) {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.acceptAssignment(orderId);
  
  check(response, {
    'assignment accepted successfully': (r) => r.success && r.json && r.json.assignment,
    'assignment status is active': (r) => {
      if (!r.success || !r.json || !r.json.assignment) return false;
      return r.json.assignment.status === 'active';
    },
  });
  
  return {
    success: response.success,
    assignment: response.json ? response.json.assignment : null,
    orderId: orderId
  };
}

/**
 * Mark order as picked up
 */
export function markOrderPickedUp(baseUrl, orderId) {
  return updateOrderStatus(baseUrl, orderId, 'picked_up');
}

/**
 * Mark order as in transit
 */
export function markOrderInTransit(baseUrl, orderId) {
  return updateOrderStatus(baseUrl, orderId, 'in_transit');
}

/**
 * Mark order as delivered
 */
export function markOrderDelivered(baseUrl, orderId) {
  return updateOrderStatus(baseUrl, orderId, 'delivered');
}

/**
 * Update rider location
 */
export function updateLocation(baseUrl, location) {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.updateLocation(location);
  
  check(response, {
    'location updated successfully': (r) => r.success && r.json && r.json.location,
    'location has coordinates': (r) => {
      if (!r.success || !r.json || !r.json.location) return false;
      const loc = r.json.location;
      return loc.latitude !== undefined && loc.longitude !== undefined;
    },
  });
  
  return {
    success: response.success,
    location: response.json ? response.json.location : null
  };
}

/**
 * Simulate complete delivery flow
 */
export function completeDeliveryFlow(baseUrl, orderId) {
  const flow = {
    orderId: orderId,
    steps: [],
    success: false
  };
  
  // Step 1: Accept assignment
  const acceptResult = acceptAssignment(baseUrl, orderId);
  flow.steps.push({
    step: 'accept_assignment',
    success: acceptResult.success,
    status: acceptResult.assignment ? acceptResult.assignment.status : null
  });
  
  if (!acceptResult.success) {
    return flow;
  }
  
  // Step 2: Update location (simulate traveling to pickup)
  const pickupLocation = generateLocation();
  const locationUpdate = updateLocation(baseUrl, pickupLocation);
  flow.steps.push({
    step: 'update_location',
    success: locationUpdate.success,
    location: pickupLocation
  });
  
  // Simulate travel time to pickup
  const travelTime = generateDelay(60, 300); // 1-5 minutes
  sleep(travelTime / 1000);
  
  // Step 3: Mark as picked up
  const pickedUpResult = markOrderPickedUp(baseUrl, orderId);
  flow.steps.push({
    step: 'picked_up',
    success: pickedUpResult.success,
    status: pickedUpResult.order ? pickedUpResult.order.status : null
  });
  
  if (!pickedUpResult.success) {
    return flow;
  }
  
  // Step 4: Mark as in transit
  const inTransitResult = markOrderInTransit(baseUrl, orderId);
  flow.steps.push({
    step: 'in_transit',
    success: inTransitResult.success,
    status: inTransitResult.order ? inTransitResult.order.status : null
  });
  
  if (!inTransitResult.success) {
    return flow;
  }
  
  // Simulate delivery time
  const deliveryTime = generateDelay(120, 600); // 2-10 minutes
  sleep(deliveryTime / 1000);
  
  // Step 5: Update location (simulate arriving at delivery)
  const deliveryLocation = generateLocation();
  const deliveryLocationUpdate = updateLocation(baseUrl, deliveryLocation);
  flow.steps.push({
    step: 'delivery_location',
    success: deliveryLocationUpdate.success,
    location: deliveryLocation
  });
  
  // Step 6: Mark as delivered
  const deliveredResult = markOrderDelivered(baseUrl, orderId);
  flow.steps.push({
    step: 'delivered',
    success: deliveredResult.success,
    status: deliveredResult.order ? deliveredResult.order.status : null
  });
  
  flow.success = flow.steps.every(step => step.success);
  
  return flow;
} 