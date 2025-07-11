import { check } from 'k6';
import { getThresholds } from '../lib/metrics.js';

// Import journeys
import customerJourney from '../journeys/customer-journey.js';
import vendorJourney from '../journeys/vendor-journey.js';
import riderJourney from '../journeys/rider-journey.js';

// Load configuration
const config = JSON.parse(open('../config/environment.json'));
const baseUrl = config.environments.uat.baseUrl;
const stressConfig = config.load.stress;

// Test configuration
export const options = {
  stages: [
    // Normal load phase
    { duration: '2m', target: 1000 },  // Start with normal load
    
    // Stress phase - gradually increase beyond capacity
    { duration: '3m', target: 2000 },  // 2x normal load
    { duration: '3m', target: 3000 },  // 3x normal load
    { duration: '3m', target: 4000 },  // 4x normal load
    { duration: '2m', target: 5000 },  // 5x normal load (stress point)
    
    // Peak stress phase
    { duration: '5m', target: 5000 },  // Maintain peak stress
    
    // Recovery phase
    { duration: '3m', target: 2000 },  // Reduce to 2x load
    { duration: '2m', target: 1000 },  // Return to normal load
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: getThresholds('stress'),
};

// User distribution weights (same as load test)
const CUSTOMER_WEIGHT = 1000 / 1500; // 66.7%
const VENDOR_WEIGHT = 200 / 1500;     // 13.3%
const RIDER_WEIGHT = 300 / 1500;      // 20%

/**
 * Stress test to find system breaking points
 */
export default function() {
  const random = Math.random();
  let result;
  
  try {
    // Distribute users based on weights
    if (random < CUSTOMER_WEIGHT) {
      // Customer journey
      console.log(`🔥 Stress Test - Customer ${__VU}`);
      result = customerJourney(baseUrl);
    } else if (random < CUSTOMER_WEIGHT + VENDOR_WEIGHT) {
      // Vendor journey
      console.log(`🔥 Stress Test - Vendor ${__VU}`);
      result = vendorJourney(baseUrl);
    } else {
      // Rider journey
      console.log(`🔥 Stress Test - Rider ${__VU}`);
      result = riderJourney(baseUrl);
    }
    
    // Verify journey completion (more lenient thresholds for stress test)
    check(result, {
      'journey completed successfully': (r) => r.success === true,
      'journey duration is acceptable under stress': (r) => r.duration < 300000, // Less than 5 minutes
      'journey has valid timestamp': (r) => r.timestamp !== undefined,
    });
    
    if (!result.success) {
      console.error(`❌ Journey failed under stress: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`💥 Stress test failed for user ${__VU}:`, error);
  }
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('🔥 Starting GabsEats Stress Test');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👥 Target Load: ${stressConfig.customers} customers, ${stressConfig.vendors} vendors, ${stressConfig.riders} riders`);
  console.log(`⏱️ Test Duration: ${stressConfig.duration}`);
  console.log(`📊 User Distribution: ${(CUSTOMER_WEIGHT * 100).toFixed(1)}% customers, ${(VENDOR_WEIGHT * 100).toFixed(1)}% vendors, ${(RIDER_WEIGHT * 100).toFixed(1)}% riders`);
  console.log('⚠️ This test will push the system beyond normal capacity to find breaking points');
  
  // Verify API connectivity
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'API is accessible': (r) => r.status === 200,
    'health check response time < 5000ms': (r) => r.timings.duration < 5000,
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
  console.log('🏁 GabsEats Stress Test completed');
  console.log('📊 Check the results above for performance metrics');
  console.log('📈 Stress test analysis:');
  console.log('   - Look for the point where error rates spike');
  console.log('   - Identify when response times become unacceptable');
  console.log('   - Note the maximum throughput before degradation');
  console.log('   - Check if the system recovers when load decreases');
} 