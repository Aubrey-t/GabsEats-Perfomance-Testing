import { check } from 'k6';
import { loginRider } from '../../lib/auth.js';
import { recordAuthMetrics } from '../../lib/metrics.js';
import { generateDelay } from '../../lib/data-generator.js';

/**
 * Rider login scenario
 */
export default function riderLogin(baseUrl) {
  const startTime = Date.now();
  
  // Login with random rider credentials
  const loginResult = loginRider(baseUrl);
  
  // Record authentication metrics
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'rider',
    loginResult.success
  );
  
  // Add realistic delay after login
  const delay = generateDelay(2, 4);
  sleep(delay / 1000);
  
  return loginResult;
}

/**
 * Rider login with specific credentials
 */
export function riderLoginWithCredentials(baseUrl, email, password) {
  const startTime = Date.now();
  
  const loginResult = loginRider(baseUrl, email, password);
  
  recordAuthMetrics(
    { status: loginResult.success ? 200 : 401, timings: { duration: Date.now() - startTime } },
    'rider',
    loginResult.success
  );
  
  return loginResult;
} 