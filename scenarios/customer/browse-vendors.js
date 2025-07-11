import { check } from 'k6';
import { CustomerApiClient } from '../../lib/api-client.js';
import { recordBrowsingMetrics } from '../../lib/metrics.js';
import { generateSearchParams, generateDelay } from '../../lib/data-generator.js';

/**
 * Browse vendors scenario
 */
export default function browseVendors(baseUrl) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  // Generate random search parameters
  const searchParams = generateSearchParams();
  
  // Browse vendors with filters
  const response = apiClient.browseVendors(searchParams);
  
  // Record browsing metrics
  recordBrowsingMetrics(response, 'vendors');
  
  // Verify response
  check(response, {
    'vendors returned': (r) => r.success && r.json && Array.isArray(r.json.vendors),
    'vendors have required fields': (r) => {
      if (!r.success || !r.json || !r.json.vendors) return false;
      return r.json.vendors.every(vendor => 
        vendor.id && vendor.name && vendor.cuisine && vendor.rating !== undefined
      );
    },
    'vendor browse response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  // Add realistic delay after browsing
  const delay = generateDelay(3, 8);
  sleep(delay / 1000);
  
  return {
    success: response.success,
    vendors: response.json ? response.json.vendors : [],
    totalCount: response.json ? response.json.totalCount : 0
  };
}

/**
 * Browse vendors by cuisine
 */
export function browseVendorsByCuisine(baseUrl, cuisine) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.browseVendors({ cuisine });
  
  recordBrowsingMetrics(response, 'vendors');
  
  check(response, {
    'vendors filtered by cuisine': (r) => r.success && r.json && r.json.vendors,
    'all vendors match cuisine': (r) => {
      if (!r.success || !r.json || !r.json.vendors) return false;
      return r.json.vendors.every(vendor => vendor.cuisine === cuisine);
    },
  });
  
  return {
    success: response.success,
    vendors: response.json ? response.json.vendors : [],
    cuisine: cuisine
  };
}

/**
 * Browse vendors by location
 */
export function browseVendorsByLocation(baseUrl, latitude, longitude, maxDistance = 10) {
  const apiClient = new CustomerApiClient(baseUrl);
  
  const response = apiClient.browseVendors({
    latitude,
    longitude,
    maxDistance
  });
  
  recordBrowsingMetrics(response, 'vendors');
  
  check(response, {
    'vendors filtered by location': (r) => r.success && r.json && r.json.vendors,
    'vendors within distance': (r) => {
      if (!r.success || !r.json || !r.json.vendors) return false;
      return r.json.vendors.every(vendor => vendor.distance <= maxDistance);
    },
  });
  
  return {
    success: response.success,
    vendors: response.json ? response.json.vendors : [],
    location: { latitude, longitude, maxDistance }
  };
} 