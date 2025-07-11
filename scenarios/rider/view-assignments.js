import { check } from 'k6';
import { RiderApiClient } from '../../lib/api-client.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * View assigned orders scenario
 */
export default function viewAssignments(baseUrl, params = {}) {
  const apiClient = new RiderApiClient(baseUrl);
  
  // Get assigned orders
  const response = apiClient.getAssignments(params);
  
  // Verify response
  check(response, {
    'assignments retrieved successfully': (r) => r.success && r.json && r.json.assignments,
    'assignments have required fields': (r) => {
      if (!r.success || !r.json || !r.json.assignments) return false;
      return r.json.assignments.every(assignment => 
        assignment.id && assignment.orderId && assignment.status && 
        assignment.pickupLocation && assignment.deliveryLocation
      );
    },
    'assignments response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  // Add realistic delay after viewing assignments
  const delay = generateDelay(2, 5);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    assignments: response.json ? response.json.assignments : [],
    totalCount: response.json ? response.json.totalCount : 0
  };
}

/**
 * View assignments by status
 */
export function viewAssignmentsByStatus(baseUrl, status) {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.getAssignments({ status });
  
  check(response, {
    'assignments filtered by status': (r) => r.success && r.json && r.json.assignments,
    'all assignments match status': (r) => {
      if (!r.success || !r.json || !r.json.assignments) return false;
      return r.json.assignments.every(assignment => assignment.status === status);
    },
  });
  
  return {
    success: response.success,
    assignments: response.json ? response.json.assignments : [],
    status: status
  };
}

/**
 * View available assignments
 */
export function viewAvailableAssignments(baseUrl) {
  return viewAssignmentsByStatus(baseUrl, 'available');
}

/**
 * View active assignments
 */
export function viewActiveAssignments(baseUrl) {
  return viewAssignmentsByStatus(baseUrl, 'active');
}

/**
 * View completed assignments
 */
export function viewCompletedAssignments(baseUrl) {
  return viewAssignmentsByStatus(baseUrl, 'completed');
}

/**
 * Get assignment details
 */
export function getAssignmentDetails(baseUrl, assignmentId) {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.get(`/rider/assignments/${assignmentId}`);
  
  check(response, {
    'assignment details retrieved': (r) => r.success && r.json && r.json.assignment,
    'assignment has complete details': (r) => {
      if (!r.success || !r.json || !r.json.assignment) return false;
      const assignment = r.json.assignment;
      return assignment.id && assignment.orderId && assignment.status && 
             assignment.pickupLocation && assignment.deliveryLocation &&
             assignment.estimatedPickupTime && assignment.estimatedDeliveryTime;
    },
  });
  
  return {
    success: response.success,
    assignment: response.json ? response.json.assignment : null
  };
}

/**
 * Get nearby assignments
 */
export function getNearbyAssignments(baseUrl, latitude, longitude, radius = 5) {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.getAssignments({
    latitude,
    longitude,
    radius
  });
  
  check(response, {
    'nearby assignments retrieved': (r) => r.success && r.json && r.json.assignments,
    'assignments within radius': (r) => {
      if (!r.success || !r.json || !r.json.assignments) return false;
      return r.json.assignments.every(assignment => assignment.distance <= radius);
    },
  });
  
  return {
    success: response.success,
    assignments: response.json ? response.json.assignments : [],
    location: { latitude, longitude, radius }
  };
}

/**
 * Get assignment statistics
 */
export function getAssignmentStatistics(baseUrl, timeRange = 'today') {
  const apiClient = new RiderApiClient(baseUrl);
  
  const response = apiClient.get(`/rider/assignments/statistics?timeRange=${timeRange}`);
  
  check(response, {
    'assignment statistics retrieved': (r) => r.success && r.json && r.json.statistics,
    'statistics have required fields': (r) => {
      if (!r.success || !r.json || !r.json.statistics) return false;
      const stats = r.json.statistics;
      return stats.totalAssignments !== undefined && stats.completedAssignments !== undefined &&
             stats.activeAssignments !== undefined && stats.earnings !== undefined;
    },
  });
  
  return {
    success: response.success,
    statistics: response.json ? response.json.statistics : null,
    timeRange: timeRange
  };
} 