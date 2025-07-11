import { check } from 'k6';
import { getThresholds } from '../lib/metrics.js';

// Import journeys
import customerJourney from '../journeys/customer-journey.js';
import vendorJourney from '../journeys/vendor-journey.js';
import riderJourney from '../journeys/rider-journey.js';

// Load configuration
const config = JSON.parse(open('../config/environment.json'));
const baseUrl = config.environments.uat.baseUrl;
const loadConfig = config.load.load;

// Test configuration
export const options = {
  stages: [
    // Ramp up phase - gradually increase load
    { duration: '2m', target: 150 },   // Ramp up to 150 users
    { duration: '3m', target: 500 },   // Ramp up to 500 users
    { duration: '3m', target: 1000 },  // Ramp up to 1000 users
    { duration: '2m', target: 1500 },  // Ramp up to 1500 users (target load)
    
    // Sustained load phase
    { duration: '10m', target: 1500 }, // Maintain target load
    
    // Ramp down phase
    { duration: '2m', target: 1000 },  // Ramp down to 1000 users
    { duration: '2m', target: 500 },   // Ramp down to 500 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: getThresholds('load'),
};

// User distribution weights (based on target load)
const CUSTOMER_WEIGHT = 1000 / 1500; // 66.7%
const VENDOR_WEIGHT = 200 / 1500;     // 13.3%
const RIDER_WEIGHT = 300 / 1500;      // 20%

/**
 * Load test with realistic user distribution
 */
export default function() {
  const random = Math.random();
  let result;
  
  try {
    // Distribute users based on weights
    if (random < CUSTOMER_WEIGHT) {
      // Customer journey
      console.log(`👤 Load Test - Customer ${__VU}`);
      result = customerJourney(baseUrl);
    } else if (random < CUSTOMER_WEIGHT + VENDOR_WEIGHT) {
      // Vendor journey
      console.log(`🏪 Load Test - Vendor ${__VU}`);
      result = vendorJourney(baseUrl);
    } else {
      // Rider journey
      console.log(`🚴 Load Test - Rider ${__VU}`);
      result = riderJourney(baseUrl);
    }
    
    // Verify journey completion
    check(result, {
      'journey completed successfully': (r) => r.success === true,
      'journey duration is reasonable': (r) => r.duration < 120000, // Less than 2 minutes
      'journey has valid timestamp': (r) => r.timestamp !== undefined,
    });
    
    if (!result.success) {
      console.error(`❌ Journey failed: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`💥 Load test failed for user ${__VU}:`, error);
  }
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('🚀 Starting GabsEats Load Test');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👥 Target Load: ${loadConfig.customers} customers, ${loadConfig.vendors} vendors, ${loadConfig.riders} riders`);
  console.log(`⏱️ Test Duration: ${loadConfig.duration}`);
  console.log(`📊 User Distribution: ${(CUSTOMER_WEIGHT * 100).toFixed(1)}% customers, ${(VENDOR_WEIGHT * 100).toFixed(1)}% vendors, ${(RIDER_WEIGHT * 100).toFixed(1)}% riders`);
  
  // Verify API connectivity
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'API is accessible': (r) => r.status === 200,
    'health check response time < 2000ms': (r) => r.timings.duration < 2000,
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
  console.log('🏁 GabsEats Load Test completed');
  console.log('📊 Check the results above for performance metrics');
  console.log('📈 Key metrics to review:');
  console.log('   - Response times (P95, P99)');
  console.log('   - Error rates');
  console.log('   - Throughput (requests/second)');
  console.log('   - Business metrics (order success rate, login success rate)');
} 