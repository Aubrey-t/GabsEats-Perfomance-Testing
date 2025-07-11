import { check } from 'k6';
import { getThresholds } from '../lib/metrics.js';

// Import journeys
import customerJourney from '../journeys/customer-journey.js';
import vendorJourney from '../journeys/vendor-journey.js';
import riderJourney from '../journeys/rider-journey.js';

// Load configuration
const config = JSON.parse(open('../config/environment.json'));
const baseUrl = config.environments.uat.baseUrl;
const spikeConfig = config.load.spike;

// Test configuration
export const options = {
  stages: [
    // Baseline phase
    { duration: '1m', target: 500 },   // Normal load
    
    // Spike phase 1
    { duration: '30s', target: 2000 }, // Sudden spike to 4x load
    { duration: '1m', target: 2000 },  // Maintain spike
    { duration: '30s', target: 500 },  // Return to normal
    
    // Recovery period
    { duration: '1m', target: 500 },   // Normal load
    
    // Spike phase 2
    { duration: '30s', target: 3000 }, // Larger spike to 6x load
    { duration: '1m', target: 3000 },  // Maintain spike
    { duration: '30s', target: 500 },  // Return to normal
    
    // Final recovery
    { duration: '1m', target: 500 },   // Normal load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: getThresholds('spike'),
};

// User distribution weights (same as other tests)
const CUSTOMER_WEIGHT = 1000 / 1500; // 66.7%
const VENDOR_WEIGHT = 200 / 1500;     // 13.3%
const RIDER_WEIGHT = 300 / 1500;      // 20%

/**
 * Spike test to simulate sudden traffic surges
 */
export default function() {
  const random = Math.random();
  let result;
  
  try {
    // Distribute users based on weights
    if (random < CUSTOMER_WEIGHT) {
      // Customer journey
      console.log(`⚡ Spike Test - Customer ${__VU}`);
      result = customerJourney(baseUrl);
    } else if (random < CUSTOMER_WEIGHT + VENDOR_WEIGHT) {
      // Vendor journey
      console.log(`⚡ Spike Test - Vendor ${__VU}`);
      result = vendorJourney(baseUrl);
    } else {
      // Rider journey
      console.log(`⚡ Spike Test - Rider ${__VU}`);
      result = riderJourney(baseUrl);
    }
    
    // Verify journey completion
    check(result, {
      'journey completed successfully': (r) => r.success === true,
      'journey duration is acceptable during spike': (r) => r.duration < 180000, // Less than 3 minutes
      'journey has valid timestamp': (r) => r.timestamp !== undefined,
    });
    
    if (!result.success) {
      console.error(`❌ Journey failed during spike: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`💥 Spike test failed for user ${__VU}:`, error);
  }
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('⚡ Starting GabsEats Spike Test');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👥 Target Load: ${spikeConfig.customers} customers, ${spikeConfig.vendors} vendors, ${spikeConfig.riders} riders`);
  console.log(`⏱️ Test Duration: ${spikeConfig.duration}`);
  console.log(`📊 User Distribution: ${(CUSTOMER_WEIGHT * 100).toFixed(1)}% customers, ${(VENDOR_WEIGHT * 100).toFixed(1)}% vendors, ${(RIDER_WEIGHT * 100).toFixed(1)}% riders`);
  console.log('⚠️ This test will simulate sudden traffic spikes to test system resilience');
  
  // Verify API connectivity
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'API is accessible': (r) => r.status === 200,
    'health check response time < 3000ms': (r) => r.timings.duration < 3000,
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
  console.log('🏁 GabsEats Spike Test completed');
  console.log('📊 Check the results above for performance metrics');
  console.log('📈 Spike test analysis:');
  console.log('   - How quickly does the system respond to sudden load increases?');
  console.log('   - Does the system recover when load returns to normal?');
  console.log('   - Are there any cascading failures during spikes?');
  console.log('   - How does error handling work under sudden stress?');
} 