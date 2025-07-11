import { check } from 'k6';
import { loginVendor } from '../../lib/auth.js';
import { recordAuthMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Vendor login scenario
 */
export default function vendorLogin(baseUrl) {
  const startTime = Date.now();
  
  // Login with random vendor credentials
  const loginResult = loginVendor(baseUrl);
  
  // Record authentication metrics
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'vendor',
    loginResult.success
  );
  
  // Add realistic delay after login
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return loginResult;
}

/**
 * Vendor login with specific credentials
 */
export function vendorLoginWithCredentials(baseUrl, email, password) {
  const startTime = Date.now();
  
  const loginResult = loginVendor(baseUrl, email, password);
  
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'vendor',
    loginResult.success
  );
  
  return loginResult;
} 