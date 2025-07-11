import { check } from 'k6';
import { getAuthHeaders, ensureValidToken } from './auth.js';

/**
 * Base API client for making HTTP requests
 */
export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request
   */
  get(endpoint, userType = null, params = {}) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (userType) {
      ensureValidToken(this.baseUrl, userType);
      headers = { ...headers, ...getAuthHeaders(userType) };
    }

    const response = http.get(`${this.baseUrl}${endpoint}`, {
      headers,
      ...params
    });

    return this.handleResponse(response, 'GET', endpoint);
  }

  /**
   * Make a POST request
   */
  post(endpoint, payload = null, userType = null, params = {}) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (userType) {
      ensureValidToken(this.baseUrl, userType);
      headers = { ...headers, ...getAuthHeaders(userType) };
    }

    const requestParams = {
      headers,
      ...params
    };

    if (payload) {
      requestParams.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const response = http.post(`${this.baseUrl}${endpoint}`, requestParams.body, requestParams);

    return this.handleResponse(response, 'POST', endpoint);
  }

  /**
   * Make a PUT request
   */
  put(endpoint, payload = null, userType = null, params = {}) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (userType) {
      ensureValidToken(this.baseUrl, userType);
      headers = { ...headers, ...getAuthHeaders(userType) };
    }

    const requestParams = {
      headers,
      ...params
    };

    if (payload) {
      requestParams.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const response = http.put(`${this.baseUrl}${endpoint}`, requestParams.body, requestParams);

    return this.handleResponse(response, 'PUT', endpoint);
  }

  /**
   * Make a PATCH request
   */
  patch(endpoint, payload = null, userType = null, params = {}) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (userType) {
      ensureValidToken(this.baseUrl, userType);
      headers = { ...headers, ...getAuthHeaders(userType) };
    }

    const requestParams = {
      headers,
      ...params
    };

    if (payload) {
      requestParams.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const response = http.patch(`${this.baseUrl}${endpoint}`, requestParams.body, requestParams);

    return this.handleResponse(response, 'PATCH', endpoint);
  }

  /**
   * Make a DELETE request
   */
  delete(endpoint, userType = null, params = {}) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (userType) {
      ensureValidToken(this.baseUrl, userType);
      headers = { ...headers, ...getAuthHeaders(userType) };
    }

    const response = http.del(`${this.baseUrl}${endpoint}`, {
      headers,
      ...params
    });

    return this.handleResponse(response, 'DELETE', endpoint);
  }

  /**
   * Handle API response with common checks
   */
  handleResponse(response, method, endpoint) {
    const statusCheck = `${method} ${endpoint} status check`;
    const responseTimeCheck = `${method} ${endpoint} response time`;
    const bodyCheck = `${method} ${endpoint} has body`;

    check(response, {
      [statusCheck]: (r) => r.status >= 200 && r.status < 300,
      [responseTimeCheck]: (r) => r.timings.duration < 5000,
      [bodyCheck]: (r) => r.body !== undefined,
    });

    // Log errors for debugging
    if (response.status >= 400) {
      console.error(`${method} ${endpoint} failed:`, response.status, response.body);
    }

    return {
      status: response.status,
      body: response.body,
      json: response.json(),
      headers: response.headers,
      timings: response.timings,
      success: response.status >= 200 && response.status < 300
    };
  }
}

/**
 * Customer-specific API client
 */
export class CustomerApiClient extends ApiClient {
  constructor(baseUrl) {
    super(baseUrl);
  }

  /**
   * Browse available vendors
   */
  browseVendors(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/restaurants/get-restaurants${queryParams ? `?${queryParams}` : ''}`;
    return this.get(endpoint, 'customer');
  }

  /**
   * View vendor menu and details
   */
  viewMenu(vendorId) {
    return this.get(`/restaurants/details/${vendorId}`, 'customer');
  }

  /**
   * Get cart items
   */
  getCart() {
    return this.get('/customer/cart/list', 'customer');
  }

  /**
   * Add item to cart
   */
  addToCart(item) {
    return this.post('/customer/cart/add', item, 'customer');
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(itemId, quantity) {
    return this.patch(`/cart/items/${itemId}`, { quantity }, 'customer');
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId) {
    return this.delete(`/cart/items/${itemId}`, 'customer');
  }

  /**
   * Place order
   */
  placeOrder(orderData) {
    return this.post('/customer/order/place', orderData, 'customer');
  }

  /**
   * Get order history
   */
  getOrders(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/customer/order/list${queryParams ? `?${queryParams}` : ''}`;
    return this.get(endpoint, 'customer');
  }

  /**
   * Track order
   */
  trackOrder(orderId) {
    return this.get(`/customer/order/track?order_id=${orderId}`, 'customer');
  }
}

/**
 * Vendor-specific API client
 */
export class VendorApiClient extends ApiClient {
  constructor(baseUrl) {
    super(baseUrl);
  }

  /**
   * Get incoming orders
   */
  getOrders(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/vendor/orders${queryParams ? `?${queryParams}` : ''}`;
    return this.get(endpoint, 'vendor');
  }

  /**
   * Accept order
   */
  acceptOrder(orderId) {
    return this.post(`/vendor/orders/${orderId}/accept`, null, 'vendor');
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId, status) {
    return this.patch(`/vendor/orders/${orderId}/status`, { status }, 'vendor');
  }

  /**
   * Get menu items
   */
  getMenu() {
    return this.get('/vendor/menu', 'vendor');
  }

  /**
   * Add menu item
   */
  addMenuItem(item) {
    return this.post('/vendor/menu/items', item, 'vendor');
  }

  /**
   * Update menu item
   */
  updateMenuItem(itemId, item) {
    return this.put(`/vendor/menu/items/${itemId}`, item, 'vendor');
  }

  /**
   * Delete menu item
   */
  deleteMenuItem(itemId) {
    return this.delete(`/vendor/menu/items/${itemId}`, 'vendor');
  }
}

/**
 * Rider-specific API client
 */
export class RiderApiClient extends ApiClient {
  constructor(baseUrl) {
    super(baseUrl);
  }

  /**
   * Get assigned orders
   */
  getAssignments(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/rider/assignments${queryParams ? `?${queryParams}` : ''}`;
    return this.get(endpoint, 'rider');
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId, status) {
    return this.patch(`/rider/orders/${orderId}/status`, { status }, 'rider');
  }

  /**
   * Accept delivery assignment
   */
  acceptAssignment(orderId) {
    return this.post(`/rider/assignments/${orderId}/accept`, null, 'rider');
  }

  /**
   * Update location
   */
  updateLocation(location) {
    return this.post('/rider/location', location, 'rider');
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/rider/deliveries${queryParams ? `?${queryParams}` : ''}`;
    return this.get(endpoint, 'rider');
  }
} 