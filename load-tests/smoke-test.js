import { check } from 'k6';
import { getThresholds } from '../lib/metrics.js';

// Import journeys
import customerJourney from '../journeys/customer-journey.js';
import vendorJourney from '../journeys/vendor-journey.js';
import riderJourney from '../journeys/rider-journey.js';

// Load configuration
const config = JSON.parse(open('../config/environment.json'));
const baseUrl = config.environments.uat.baseUrl;
const smokeConfig = config.load.smoke;

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: getThresholds('smoke'),
};

// Shared data
const testData = JSON.parse(open('../config/test-data.json'));

/**
 * Smoke test for basic functionality
 */
export default function() {
  const userType = __VU % 3; // Distribute users across 3 types
  
  try {
    let result;
    
    switch (userType) {
      case 0: // Customer
        console.log(`🧪 Smoke Test - Customer ${__VU}`);
        result = customerJourney(baseUrl);
        break;
        
      case 1: // Vendor
        console.log(`🧪 Smoke Test - Vendor ${__VU}`);
        result = vendorJourney(baseUrl);
        break;
        
      case 2: // Rider
        console.log(`🧪 Smoke Test - Rider ${__VU}`);
        result = riderJourney(baseUrl);
        break;
    }
    
    // Verify journey completion
    check(result, {
      'journey completed successfully': (r) => r.success === true,
      'journey duration is reasonable': (r) => r.duration < 60000, // Less than 1 minute
    });
    
    if (!result.success) {
      console.error(`❌ Journey failed: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`💥 Smoke test failed for user ${__VU}:`, error);
  }
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('🚀 Starting GabsEats Smoke Test');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👥 Target Users: ${smokeConfig.customers + smokeConfig.vendors + smokeConfig.riders}`);
  console.log(`⏱️ Test Duration: ${smokeConfig.duration}`);
  
  // Verify API connectivity
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'API is accessible': (r) => r.status === 200,
    'health check response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (response.status !== 200) {
    throw new Error(`API health check failed: ${response.status}`);
  }
  
  console.log('✅ API health check passed');
  return { baseUrl };
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('🏁 GabsEats Smoke Test completed');
  console.log('📊 Check the results above for performance metrics');
} 