import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for business KPIs
export const orderSuccessRate = new Rate('order_success_rate');
export const loginSuccessRate = new Rate('login_success_rate');
export const deliveryCompletionRate = new Rate('delivery_completion_rate');

// Custom metrics for response times
export const customerJourneyTime = new Trend('customer_journey_time');
export const vendorJourneyTime = new Trend('vendor_journey_time');
export const riderJourneyTime = new Trend('rider_journey_time');

// Custom metrics for API performance
export const authResponseTime = new Trend('auth_response_time');
export const vendorBrowseTime = new Trend('vendor_browse_time');
export const menuLoadTime = new Trend('menu_load_time');
export const orderPlacementTime = new Trend('order_placement_time');
export const orderTrackingTime = new Trend('order_tracking_time');

// Custom counters for business events
export const ordersPlaced = new Counter('orders_placed');
export const ordersAccepted = new Counter('orders_accepted');
export const deliveriesCompleted = new Counter('deliveries_completed');
export const menuViews = new Counter('menu_views');
export const vendorBrowses = new Counter('vendor_browses');

/**
 * Record authentication metrics
 */
export function recordAuthMetrics(response, userType, success) {
  loginSuccessRate.add(success);
  authResponseTime.add(response.timings.duration);
  
  if (!success) {
    console.error(`${userType} login failed:`, response.status, response.body);
  }
}

/**
 * Record customer journey metrics
 */
export function recordCustomerJourneyMetrics(startTime, endTime, success) {
  const duration = endTime - startTime;
  customerJourneyTime.add(duration);
  
  if (success) {
    console.log(`Customer journey completed in ${duration}ms`);
  } else {
    console.error(`Customer journey failed after ${duration}ms`);
  }
}

/**
 * Record vendor journey metrics
 */
export function recordVendorJourneyMetrics(startTime, endTime, success) {
  const duration = endTime - startTime;
  vendorJourneyTime.add(duration);
  
  if (success) {
    console.log(`Vendor journey completed in ${duration}ms`);
  } else {
    console.error(`Vendor journey failed after ${duration}ms`);
  }
}

/**
 * Record rider journey metrics
 */
export function recordRiderJourneyMetrics(startTime, endTime, success) {
  const duration = endTime - startTime;
  riderJourneyTime.add(duration);
  
  if (success) {
    console.log(`Rider journey completed in ${duration}ms`);
  } else {
    console.error(`Rider journey failed after ${duration}ms`);
  }
}

/**
 * Record order-related metrics
 */
export function recordOrderMetrics(response, action, success) {
  switch (action) {
    case 'place':
      orderSuccessRate.add(success);
      orderPlacementTime.add(response.timings.duration);
      if (success) ordersPlaced.add(1);
      break;
    case 'accept':
      ordersAccepted.add(1);
      break;
    case 'track':
      orderTrackingTime.add(response.timings.duration);
      break;
    case 'deliver':
      deliveryCompletionRate.add(success);
      if (success) deliveriesCompleted.add(1);
      break;
  }
}

/**
 * Record browsing metrics
 */
export function recordBrowsingMetrics(response, action) {
  switch (action) {
    case 'vendors':
      vendorBrowseTime.add(response.timings.duration);
      vendorBrowses.add(1);
      break;
    case 'menu':
      menuLoadTime.add(response.timings.duration);
      menuViews.add(1);
      break;
  }
}

/**
 * Get performance thresholds based on test type
 */
export function getThresholds(testType = 'load') {
  const baseThresholds = {
    // HTTP response time thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'], // Less than 5% error rate
    
    // Custom business metrics
    'order_success_rate': ['rate>0.95'], // 95% order success rate
    'login_success_rate': ['rate>0.98'], // 98% login success rate
    'delivery_completion_rate': ['rate>0.90'], // 90% delivery completion rate
    
    // Journey completion times
    'customer_journey_time': ['p(95)<30000'], // 30 seconds for customer journey
    'vendor_journey_time': ['p(95)<15000'],   // 15 seconds for vendor journey
    'rider_journey_time': ['p(95)<20000'],    // 20 seconds for rider journey
    
    // API response times
    'auth_response_time': ['p(95)<2000'],
    'vendor_browse_time': ['p(95)<3000'],
    'menu_load_time': ['p(95)<2000'],
    'order_placement_time': ['p(95)<5000'],
    'order_tracking_time': ['p(95)<2000'],
  };

  // Adjust thresholds based on test type
  switch (testType) {
    case 'smoke':
      return {
        ...baseThresholds,
        'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
        'customer_journey_time': ['p(95)<15000'],
        'vendor_journey_time': ['p(95)<10000'],
        'rider_journey_time': ['p(95)<12000'],
      };
    
    case 'stress':
      return {
        ...baseThresholds,
        'http_req_duration': ['p(95)<5000', 'p(99)<10000'],
        'http_req_failed': ['rate<0.10'], // Allow up to 10% error rate under stress
        'order_success_rate': ['rate>0.85'], // Lower success rate under stress
        'customer_journey_time': ['p(95)<60000'], // 1 minute under stress
        'vendor_journey_time': ['p(95)<30000'],
        'rider_journey_time': ['p(95)<40000'],
      };
    
    case 'spike':
      return {
        ...baseThresholds,
        'http_req_duration': ['p(95)<3000', 'p(99)<8000'],
        'http_req_failed': ['rate<0.08'],
        'customer_journey_time': ['p(95)<45000'],
        'vendor_journey_time': ['p(95)<20000'],
        'rider_journey_time': ['p(95)<25000'],
      };
    
    default: // load test
      return baseThresholds;
  }
}

/**
 * Generate performance report summary
 */
export function generatePerformanceReport(data) {
  const report = {
    timestamp: new Date().toISOString(),
    testDuration: data.state.testRunDuration,
    totalRequests: data.metrics.http_reqs.values.count,
    totalErrors: data.metrics.http_req_failed.values.rate * data.metrics.http_reqs.values.count,
    errorRate: data.metrics.http_req_failed.values.rate * 100,
    avgResponseTime: data.metrics.http_req_duration.values.avg,
    p95ResponseTime: data.metrics.http_req_duration.values['p(95)'],
    p99ResponseTime: data.metrics.http_req_duration.values['p(99)'],
    requestsPerSecond: data.metrics.http_reqs.values.rate,
    
    // Business metrics
    orderSuccessRate: data.metrics.order_success_rate ? data.metrics.order_success_rate.values.rate * 100 : 0,
    loginSuccessRate: data.metrics.login_success_rate ? data.metrics.login_success_rate.values.rate * 100 : 0,
    deliveryCompletionRate: data.metrics.delivery_completion_rate ? data.metrics.delivery_completion_rate.values.rate * 100 : 0,
    
    // Journey times
    avgCustomerJourneyTime: data.metrics.customer_journey_time ? data.metrics.customer_journey_time.values.avg : 0,
    avgVendorJourneyTime: data.metrics.vendor_journey_time ? data.metrics.vendor_journey_time.values.avg : 0,
    avgRiderJourneyTime: data.metrics.rider_journey_time ? data.metrics.rider_journey_time.values.avg : 0,
    
    // Business events
    ordersPlaced: data.metrics.orders_placed ? data.metrics.orders_placed.values.count : 0,
    ordersAccepted: data.metrics.orders_accepted ? data.metrics.orders_accepted.values.count : 0,
    deliveriesCompleted: data.metrics.deliveries_completed ? data.metrics.deliveries_completed.values.count : 0,
    menuViews: data.metrics.menu_views ? data.metrics.menu_views.values.count : 0,
    vendorBrowses: data.metrics.vendor_browses ? data.metrics.vendor_browses.values.count : 0,
  };

  // Performance assessment
  report.performanceGrade = assessPerformance(report);
  report.recommendations = generateRecommendations(report);

  return report;
}

/**
 * Assess overall performance grade
 */
function assessPerformance(report) {
  let score = 100;
  
  // Deduct points for high error rates
  if (report.errorRate > 5) score -= 20;
  else if (report.errorRate > 2) score -= 10;
  
  // Deduct points for slow response times
  if (report.p95ResponseTime > 5000) score -= 20;
  else if (report.p95ResponseTime > 3000) score -= 10;
  
  // Deduct points for low business success rates
  if (report.orderSuccessRate < 90) score -= 15;
  if (report.loginSuccessRate < 95) score -= 10;
  if (report.deliveryCompletionRate < 85) score -= 10;
  
  // Deduct points for slow journey times
  if (report.avgCustomerJourneyTime > 45000) score -= 10;
  if (report.avgVendorJourneyTime > 20000) score -= 5;
  if (report.avgRiderJourneyTime > 25000) score -= 5;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(report) {
  const recommendations = [];
  
  if (report.errorRate > 5) {
    recommendations.push('High error rate detected. Investigate server errors and API failures.');
  }
  
  if (report.p95ResponseTime > 5000) {
    recommendations.push('Slow response times detected. Consider database optimization and caching.');
  }
  
  if (report.orderSuccessRate < 90) {
    recommendations.push('Low order success rate. Review order placement flow and payment processing.');
  }
  
  if (report.loginSuccessRate < 95) {
    recommendations.push('Authentication issues detected. Review login flow and token management.');
  }
  
  if (report.avgCustomerJourneyTime > 45000) {
    recommendations.push('Customer journey is too slow. Optimize UI/UX and reduce API calls.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance is within acceptable limits. Continue monitoring.');
  }
  
  return recommendations;
} 