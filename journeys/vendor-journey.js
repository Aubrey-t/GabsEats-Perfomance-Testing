import { sleep } from 'k6';
import { recordVendorJourneyMetrics } from '../lib/metrics.js';
import { generateDelay } from '../lib/data-generator.js';

// Import vendor scenarios
import vendorLogin from '../scenarios/vendor/login.js';
import { viewOrders, viewPendingOrders, getOrderDetails } from '../scenarios/vendor/view-orders.js';
import { acceptOrder, processOrderFlow } from '../scenarios/vendor/accept-order.js';

/**
 * Complete vendor journey simulation
 * Login → View incoming orders → Accept order → Process order
 */
export default function vendorJourney(baseUrl) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log('🏪 Starting vendor journey...');
    
    // Step 1: Vendor Login
    console.log('🔑 Step 1: Vendor Login');
    const loginResult = vendorLogin(baseUrl);
    if (!loginResult.success) {
      console.error('❌ Vendor login failed');
      return { success: false, error: 'Login failed', step: 'login' };
    }
    console.log('✅ Vendor logged in successfully');
    
    // Realistic delay after login
    sleep(generateDelay(2, 5) / 1000);
    
    // Step 2: View Pending Orders
    console.log('📋 Step 2: View Pending Orders');
    const pendingOrdersResult = viewPendingOrders(baseUrl);
    if (!pendingOrdersResult.success) {
      console.error('❌ Failed to view pending orders');
      return { success: false, error: 'View pending orders failed', step: 'view_orders' };
    }
    
    if (pendingOrdersResult.orders.length === 0) {
      console.log('ℹ️ No pending orders available');
      // Try viewing all orders instead
      const allOrdersResult = viewOrders(baseUrl);
      if (!allOrdersResult.success || allOrdersResult.orders.length === 0) {
        console.log('ℹ️ No orders available at all');
        return { success: true, message: 'No orders to process', step: 'no_orders' };
      }
      console.log(`✅ Found ${allOrdersResult.orders.length} total orders`);
    } else {
      console.log(`✅ Found ${pendingOrdersResult.orders.length} pending orders`);
    }
    
    // Realistic delay after viewing orders
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 3: Select and Process Order
    console.log('🔄 Step 3: Process Order');
    const ordersToProcess = pendingOrdersResult.orders.length > 0 ? 
      pendingOrdersResult.orders : viewOrders(baseUrl).orders;
    
    if (ordersToProcess.length === 0) {
      console.log('ℹ️ No orders available to process');
      return { success: true, message: 'No orders to process', step: 'no_orders' };
    }
    
    // Select a random order to process
    const selectedOrder = ordersToProcess[Math.floor(Math.random() * ordersToProcess.length)];
    console.log(`📦 Selected order ID: ${selectedOrder.id}, Status: ${selectedOrder.status}`);
    
    // Realistic delay before processing
    sleep(generateDelay(1, 3) / 1000);
    
    // Step 4: Get Order Details
    console.log('📄 Step 4: Get Order Details');
    const orderDetailsResult = getOrderDetails(baseUrl, selectedOrder.id);
    if (!orderDetailsResult.success) {
      console.error('❌ Failed to get order details');
      return { success: false, error: 'Get order details failed', step: 'order_details' };
    }
    console.log(`✅ Order details retrieved, Total: $${orderDetailsResult.order.total}`);
    
    // Realistic delay after getting details
    sleep(generateDelay(1, 2) / 1000);
    
    // Step 5: Process Order Flow (if order is pending)
    if (selectedOrder.status === 'pending') {
      console.log('✅ Step 5: Process Order Flow');
      const processResult = processOrderFlow(baseUrl, selectedOrder.id);
      if (!processResult.success) {
        console.error('❌ Order processing failed');
        return { success: false, error: 'Order processing failed', step: 'process_order' };
      }
      console.log(`✅ Order processed successfully through ${processResult.steps.length} steps`);
    } else {
      console.log(`ℹ️ Order ${selectedOrder.id} is already in status: ${selectedOrder.status}`);
      // Just accept the order if it's not pending
      const acceptResult = acceptOrder(baseUrl, selectedOrder.id);
      if (!acceptResult.success) {
        console.error('❌ Order acceptance failed');
        return { success: false, error: 'Order acceptance failed', step: 'accept_order' };
      }
      console.log(`✅ Order accepted successfully`);
    }
    
    // Realistic delay after processing
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 6: View Updated Orders
    console.log('📊 Step 6: View Updated Orders');
    const updatedOrdersResult = viewOrders(baseUrl);
    if (!updatedOrdersResult.success) {
      console.warn('⚠️ Failed to view updated orders, but continuing...');
    } else {
      console.log(`✅ Updated orders view successful, Total orders: ${updatedOrdersResult.totalCount}`);
    }
    
    journeySuccess = true;
    console.log('🎉 Vendor journey completed successfully!');
    
  } catch (error) {
    console.error('💥 Vendor journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordVendorJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    timestamp: new Date().toISOString()
  };
}

/**
 * Vendor journey with specific order
 */
export function vendorJourneyWithOrder(baseUrl, orderId) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log(`🏪 Starting vendor journey with order: ${orderId}`);
    
    // Step 1: Vendor Login
    const loginResult = vendorLogin(baseUrl);
    if (!loginResult.success) {
      return { success: false, error: 'Login failed', step: 'login' };
    }
    
    // Step 2: Get Order Details
    const orderDetailsResult = getOrderDetails(baseUrl, orderId);
    if (!orderDetailsResult.success) {
      return { success: false, error: 'Get order details failed', step: 'order_details' };
    }
    
    // Step 3: Process Order Flow
    const processResult = processOrderFlow(baseUrl, orderId);
    if (!processResult.success) {
      return { success: false, error: 'Order processing failed', step: 'process_order' };
    }
    
    journeySuccess = true;
    console.log(`🎉 Vendor journey with order ${orderId} completed successfully!`);
    
  } catch (error) {
    console.error('💥 Vendor journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordVendorJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    orderId: orderId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Vendor journey for batch order processing
 */
export function vendorBatchJourney(baseUrl, orderIds) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log(`🏪 Starting vendor batch journey with ${orderIds.length} orders`);
    
    // Step 1: Vendor Login
    const loginResult = vendorLogin(baseUrl);
    if (!loginResult.success) {
      return { success: false, error: 'Login failed', step: 'login' };
    }
    
    // Step 2: View All Orders
    const allOrdersResult = viewOrders(baseUrl);
    if (!allOrdersResult.success) {
      return { success: false, error: 'View orders failed', step: 'view_orders' };
    }
    
    // Step 3: Process Each Order
    const processedOrders = [];
    for (const orderId of orderIds) {
      console.log(`📦 Processing order: ${orderId}`);
      
      // Check if order exists and is pending
      const orderDetails = getOrderDetails(baseUrl, orderId);
      if (!orderDetails.success) {
        console.warn(`⚠️ Order ${orderId} not found or inaccessible`);
        continue;
      }
      
      if (orderDetails.order.status === 'pending') {
        const processResult = processOrderFlow(baseUrl, orderId);
        if (processResult.success) {
          processedOrders.push({ orderId, success: true, steps: processResult.steps.length });
        } else {
          processedOrders.push({ orderId, success: false, error: 'Processing failed' });
        }
      } else {
        console.log(`ℹ️ Order ${orderId} is already in status: ${orderDetails.order.status}`);
        processedOrders.push({ orderId, success: true, status: orderDetails.order.status });
      }
      
      // Small delay between processing orders
      sleep(1);
    }
    
    journeySuccess = processedOrders.some(order => order.success);
    console.log(`🎉 Vendor batch journey completed! Processed ${processedOrders.filter(o => o.success).length}/${orderIds.length} orders`);
    
  } catch (error) {
    console.error('💥 Vendor batch journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordVendorJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    orderIds: orderIds,
    processedOrders: processedOrders || [],
    timestamp: new Date().toISOString()
  };
} 