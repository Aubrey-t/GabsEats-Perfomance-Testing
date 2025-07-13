import { check } from 'k6';
import http from 'k6/http';
import { open } from 'k6/fs';

// Load environment config
const config = JSON.parse(open('config/environment.json'));
const baseUrl = config.environments.uat.baseUrl;

// Test configuration
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  console.log('🔍 Testing UAT API connectivity...');
  
  // Test 1: Health check or basic endpoint
  const healthResponse = http.get(`${baseUrl}/health`);
  console.log(`Health check status: ${healthResponse.status}`);
  
  // Test 2: Try to get restaurants (should work without auth)
  const restaurantsResponse = http.get(`${baseUrl}/restaurants/get-restaurants`);
  console.log(`Restaurants endpoint status: ${restaurantsResponse.status}`);
  
  // Test 3: Try customer login endpoint (will fail without credentials, but should return 401/422, not 404)
  const loginResponse = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpass'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`Login endpoint status: ${loginResponse.status}`);
  
  // Verify responses
  check(healthResponse, {
    'health endpoint accessible': (r) => r.status >= 200 && r.status < 500,
  });
  
  check(restaurantsResponse, {
    'restaurants endpoint accessible': (r) => r.status >= 200 && r.status < 500,
  });
  
  check(loginResponse, {
    'login endpoint accessible': (r) => r.status >= 200 && r.status < 500,
  });
  
  // Log response details for debugging
  if (restaurantsResponse.status === 200) {
    console.log('✅ Restaurants endpoint working!');
    try {
      const data = restaurantsResponse.json();
      console.log(`📊 Found ${data.restaurants ? data.restaurants.length : 'unknown'} restaurants`);
    } catch (e) {
      console.log('📄 Response is not JSON or empty');
    }
  } else {
    console.log(`❌ Restaurants endpoint returned ${restaurantsResponse.status}`);
    console.log(`Response body: ${restaurantsResponse.body.substring(0, 200)}...`);
  }
  
  // Wait between requests
  sleep(1);
}

export function setup() {
  console.log('🚀 Starting UAT API Connection Test');
  console.log(`📍 Testing against: ${baseUrl}`);
  console.log('⏱️ Test duration: 30 seconds');
}

export function teardown(data) {
  console.log('🏁 UAT API Connection Test completed');
  console.log('📊 Check the results above for connectivity status');
} 