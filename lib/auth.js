import { check } from 'k6';
import { SharedArray } from 'k6/data';

// Load test data
const testData = new SharedArray('test-data', function() {
  return JSON.parse(open('../config/test-data.json'));
});

// JWT token storage
const tokens = {
  customer: null,
  vendor: null,
  rider: null
};

/**
 * Login function for customers
 */
export function loginCustomer(baseUrl, email = null, password = null) {
  const credentials = email && password 
    ? { email, password }
    : testData.customers[Math.floor(Math.random() * testData.customers.length)];

  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/auth/customer/login`, payload, params);

  check(response, {
    'customer login successful': (r) => r.status === 200,
    'customer login has token': (r) => r.json('token') !== undefined,
    'customer login response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (response.status === 200) {
    tokens.customer = response.json('token');
    return {
      token: tokens.customer,
      user: response.json('user'),
      success: true
    };
  }

  return {
    success: false,
    error: response.body
  };
}

/**
 * Login function for vendors
 */
export function loginVendor(baseUrl, email = null, password = null) {
  const credentials = email && password 
    ? { email, password }
    : testData.vendors[Math.floor(Math.random() * testData.vendors.length)];

  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/auth/vendor/login`, payload, params);

  check(response, {
    'vendor login successful': (r) => r.status === 200,
    'vendor login has token': (r) => r.json('token') !== undefined,
    'vendor login response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (response.status === 200) {
    tokens.vendor = response.json('token');
    return {
      token: tokens.vendor,
      user: response.json('user'),
      success: true
    };
  }

  return {
    success: false,
    error: response.body
  };
}

/**
 * Login function for riders
 */
export function loginRider(baseUrl, email = null, password = null) {
  const credentials = email && password 
    ? { email, password }
    : testData.riders[Math.floor(Math.random() * testData.riders.length)];

  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/auth/rider/login`, payload, params);

  check(response, {
    'rider login successful': (r) => r.status === 200,
    'rider login has token': (r) => r.json('token') !== undefined,
    'rider login response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (response.status === 200) {
    tokens.rider = response.json('token');
    return {
      token: tokens.rider,
      user: response.json('user'),
      success: true
    };
  }

  return {
    success: false,
    error: response.body
  };
}

/**
 * Refresh JWT token
 */
export function refreshToken(baseUrl, userType) {
  const token = tokens[userType];
  if (!token) {
    console.error(`No token found for ${userType}`);
    return false;
  }

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${baseUrl}/auth/refresh`, null, params);

  check(response, {
    'token refresh successful': (r) => r.status === 200,
    'token refresh has new token': (r) => r.json('token') !== undefined,
  });

  if (response.status === 200) {
    tokens[userType] = response.json('token');
    return true;
  }

  return false;
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(userType) {
  const token = tokens[userType];
  if (!token) {
    console.error(`No token found for ${userType}`);
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Check if token is valid and refresh if needed
 */
export function ensureValidToken(baseUrl, userType) {
  const token = tokens[userType];
  if (!token) {
    return false;
  }

  // Simple token validation - in real scenarios, you might want to decode JWT
  // For now, we'll assume token is valid and refresh periodically
  const shouldRefresh = Math.random() < 0.1; // 10% chance to refresh
  
  if (shouldRefresh) {
    return refreshToken(baseUrl, userType);
  }

  return true;
}

/**
 * Logout function (clear tokens)
 */
export function logout(userType) {
  tokens[userType] = null;
  return true;
} 