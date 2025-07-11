import { check } from 'k6';
import { loginCustomer } from '../../lib/auth.js';
import { recordAuthMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Customer login scenario
 */
export default function customerLogin(baseUrl) {
  const startTime = Date.now();
  
  // Login with random customer credentials
  const loginResult = loginCustomer(baseUrl);
  
  // Record authentication metrics
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'customer',
    loginResult.success
  );
  
  // Add realistic delay after login
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return loginResult;
}

/**
 * Customer login with specific credentials
 */
export function customerLoginWithCredentials(baseUrl, email, password) {
  const startTime = Date.now();
  
  const loginResult = loginCustomer(baseUrl, email, password);
  
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'customer',
    loginResult.success
  );
  
  return loginResult;
} 