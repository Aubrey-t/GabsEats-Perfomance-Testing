import http from 'k6/http';
import { check, sleep } from 'k6';

// Store results for CSV report
let results = [];

export let options = {
  scenarios: {
    T01_load_browse: {
      executor: 'constant-vus',
      vus: 500,
      duration: '2m',
      exec: 'test_browse',
      tags: { scenario: 'T01' },
    },
    T02_load_order: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '2m',
      exec: 'test_order',
      tags: { scenario: 'T02' },
    },
    T03_stress_homepage: {
      executor: 'constant-vus',
      vus: 2000,
      duration: '30s',
      exec: 'test_homepage',
      tags: { scenario: 'T03' },
    },
    T04_spike: {
      executor: 'constant-vus',
      vus: 1500,
      duration: '1m',
      exec: 'test_spike',
      tags: { scenario: 'T04' },
    },
    T05_soak: {
      executor: 'constant-vus',
      vus: 200,
      duration: '2h',
      exec: 'test_soak',
      tags: { scenario: 'T05' },
    },
    T06_latency: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '2m',
      exec: 'test_latency',
      tags: { scenario: 'T06' },
    },
  },
};

const BASE_URL = 'http://13.244.62.202/api/v1';

// T01: 500 users login and browse restaurants
export function test_browse() {
  let res = http.get(`${BASE_URL}/restaurants/get-restaurants`);
  let pass = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  results.push({
    scenario: 'T01',
    expected: '200 OK for 500 users browsing',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// T02: 1000 users place orders within 2 minutes
export function test_order() {
  // Simulate order placement (no real auth, just endpoint check)
  let payload = JSON.stringify({
    // Add realistic order data as needed
    items: [{ id: 1, quantity: 1 }],
    address: 'Test Address',
    payment_method: 'card',
  });
  let res = http.post(`${BASE_URL}/customer/order/place`, payload, { headers: { 'Content-Type': 'application/json' } });
  let pass = check(res, {
    'status is 200/201/202': (r) => [200, 201, 202].includes(r.status),
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  results.push({
    scenario: 'T02',
    expected: '200/201/202 for 1000 users placing orders',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// T03: 2000 homepage requests in 30 seconds
export function test_homepage() {
  let res = http.get(`${BASE_URL}/restaurants/get-restaurants`);
  let pass = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  results.push({
    scenario: 'T03',
    expected: '200 OK for 2000 homepage requests',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// T04: Sudden burst of 1500 concurrent users
export function test_spike() {
  let res = http.get(`${BASE_URL}/restaurants/get-restaurants`);
  let pass = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  results.push({
    scenario: 'T04',
    expected: '200 OK for 1500 users in spike',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// T05: 200 users continuously active for 2 hours
export function test_soak() {
  let res = http.get(`${BASE_URL}/restaurants/get-restaurants`);
  let pass = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  results.push({
    scenario: 'T05',
    expected: '200 OK for 200 users over 2 hours',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// T06: Measure order creation API under peak load
export function test_latency() {
  let payload = JSON.stringify({
    items: [{ id: 1, quantity: 1 }],
    address: 'Test Address',
    payment_method: 'card',
  });
  let res = http.post(`${BASE_URL}/customer/order/place`, payload, { headers: { 'Content-Type': 'application/json' } });
  let pass = check(res, {
    'status is 200/201/202': (r) => [200, 201, 202].includes(r.status),
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  results.push({
    scenario: 'T06',
    expected: '200/201/202 for order creation under peak load',
    actual: `Status: ${res.status}, Time: ${res.timings.duration}ms`,
    pass,
  });
  sleep(1);
}

// Generate CSV report at the end
export function handleSummary(data) {
  let csv = 'Scenario,Expected,Actual,Pass\n';
  for (let r of results) {
    csv += `${r.scenario},"${r.expected}","${r.actual}",${r.pass ? 'PASS' : 'FAIL'}\n`;
  }
  return {
    'results/test-case-log.csv': csv,
    stdout: csv,
  };
} 