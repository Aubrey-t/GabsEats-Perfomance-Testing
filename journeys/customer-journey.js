import { sleep } from 'k6';
import { recordCustomerJourneyMetrics } from '../lib/metrics.js';
import { generateDelay, generateAddress } from '../lib/data-generator.js';

// Import customer scenarios
import customerLogin from '../scenarios/customer/login.js';
import browseVendors from '../scenarios/customer/browse-vendors.js';
import viewMenu from '../scenarios/customer/view-menu.js';
import { buildRealisticCart, getCart } from '../scenarios/customer/cart-operations.js';
import { placeOrder, completeCheckoutFlow } from '../scenarios/customer/checkout.js';
import { trackOrder, completeOrderTrackingExperience } from '../scenarios/customer/track-order.js';

/**
 * Complete customer journey simulation
 * Login → Browse vendors → View menu → Add items to cart → Checkout → Track order
 */
export default function customerJourney(baseUrl) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log('🚀 Starting customer journey...');
    
    // Step 1: Customer Login
    console.log('📱 Step 1: Customer Login');
    const loginResult = customerLogin(baseUrl);
    if (!loginResult.success) {
      console.error('❌ Customer login failed');
      return { success: false, error: 'Login failed', step: 'login' };
    }
    console.log('✅ Customer logged in successfully');
    
    // Realistic delay after login
    sleep(generateDelay(3, 8) / 1000);
    
    // Step 2: Browse Vendors
    console.log('🏪 Step 2: Browse Vendors');
    const browseResult = browseVendors(baseUrl);
    if (!browseResult.success || browseResult.vendors.length === 0) {
      console.error('❌ Vendor browsing failed or no vendors found');
      return { success: false, error: 'Vendor browsing failed', step: 'browse' };
    }
    
    // Select a random vendor
    const selectedVendor = browseResult.vendors[Math.floor(Math.random() * browseResult.vendors.length)];
    console.log(`✅ Found ${browseResult.vendors.length} vendors, selected: ${selectedVendor.name}`);
    
    // Realistic delay after browsing
    sleep(generateDelay(2, 5) / 1000);
    
    // Step 3: View Menu
    console.log('🍕 Step 3: View Menu');
    const menuResult = viewMenu(baseUrl, selectedVendor.id);
    if (!menuResult.success || menuResult.menu.length === 0) {
      console.error('❌ Menu viewing failed or no menu items found');
      return { success: false, error: 'Menu viewing failed', step: 'menu' };
    }
    console.log(`✅ Menu loaded with ${menuResult.menu.length} items`);
    
    // Realistic delay after viewing menu
    sleep(generateDelay(3, 8) / 1000);
    
    // Step 4: Build Cart
    console.log('🛒 Step 4: Build Cart');
    const cartResult = buildRealisticCart(baseUrl, selectedVendor.id, menuResult.menu);
    if (!cartResult.success || cartResult.cartItems.length === 0) {
      console.error('❌ Cart building failed');
      return { success: false, error: 'Cart building failed', step: 'cart' };
    }
    console.log(`✅ Cart built with ${cartResult.cartItems.length} items`);
    
    // Realistic delay after building cart
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 5: Review Cart
    console.log('📋 Step 5: Review Cart');
    const cartReview = getCart(baseUrl);
    if (!cartReview.success) {
      console.error('❌ Cart review failed');
      return { success: false, error: 'Cart review failed', step: 'cart_review' };
    }
    console.log(`✅ Cart reviewed, total: $${cartReview.cart.total}`);
    
    // Realistic delay after cart review
    sleep(generateDelay(2, 5) / 1000);
    
    // Step 6: Place Order
    console.log('💳 Step 6: Place Order');
    const orderResult = placeOrder(baseUrl, selectedVendor.id, loginResult.user.id);
    if (!orderResult.success) {
      console.error('❌ Order placement failed');
      return { success: false, error: 'Order placement failed', step: 'order' };
    }
    console.log(`✅ Order placed successfully, ID: ${orderResult.order.id}`);
    
    // Realistic delay after placing order
    sleep(generateDelay(3, 6) / 1000);
    
    // Step 7: Track Order
    console.log('📍 Step 7: Track Order');
    const trackingResult = trackOrder(baseUrl, orderResult.order.id);
    if (!trackingResult.success) {
      console.error('❌ Order tracking failed');
      return { success: false, error: 'Order tracking failed', step: 'tracking' };
    }
    console.log(`✅ Order tracking successful, status: ${trackingResult.tracking.status}`);
    
    // Realistic delay after tracking
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 8: Complete Order Tracking Experience
    console.log('📱 Step 8: Complete Order Tracking Experience');
    const trackingExperience = completeOrderTrackingExperience(baseUrl, orderResult.order.id);
    if (!trackingExperience.success) {
      console.warn('⚠️ Some tracking experience steps failed, but continuing...');
    }
    console.log(`✅ Order tracking experience completed with ${trackingExperience.steps.length} steps`);
    
    journeySuccess = true;
    console.log('🎉 Customer journey completed successfully!');
    
  } catch (error) {
    console.error('💥 Customer journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordCustomerJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    timestamp: new Date().toISOString()
  };
}

/**
 * Customer journey with specific vendor
 */
export function customerJourneyWithVendor(baseUrl, vendorId, vendorName) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log(`🚀 Starting customer journey with vendor: ${vendorName}`);
    
    // Step 1: Customer Login
    const loginResult = customerLogin(baseUrl);
    if (!loginResult.success) {
      return { success: false, error: 'Login failed', step: 'login' };
    }
    
    // Step 2: View Menu (skip browsing since we have specific vendor)
    const menuResult = viewMenu(baseUrl, vendorId);
    if (!menuResult.success || menuResult.menu.length === 0) {
      return { success: false, error: 'Menu viewing failed', step: 'menu' };
    }
    
    // Step 3: Build Cart
    const cartResult = buildRealisticCart(baseUrl, vendorId, menuResult.menu);
    if (!cartResult.success || cartResult.cartItems.length === 0) {
      return { success: false, error: 'Cart building failed', step: 'cart' };
    }
    
    // Step 4: Complete Checkout Flow
    const checkoutResult = completeCheckoutFlow(baseUrl, vendorId, loginResult.user.id, cartResult.cartItems);
    if (!checkoutResult.success) {
      return { success: false, error: 'Checkout failed', step: 'checkout' };
    }
    
    // Step 5: Track Order
    const trackingResult = trackOrder(baseUrl, checkoutResult.order.id);
    if (!trackingResult.success) {
      return { success: false, error: 'Order tracking failed', step: 'tracking' };
    }
    
    journeySuccess = true;
    console.log(`🎉 Customer journey with ${vendorName} completed successfully!`);
    
  } catch (error) {
    console.error('💥 Customer journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordCustomerJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    vendorId: vendorId,
    vendorName: vendorName,
    timestamp: new Date().toISOString()
  };
}

/**
 * Customer journey with specific items
 */
export function customerJourneyWithItems(baseUrl, vendorId, items) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log(`🚀 Starting customer journey with specific items`);
    
    // Step 1: Customer Login
    const loginResult = customerLogin(baseUrl);
    if (!loginResult.success) {
      return { success: false, error: 'Login failed', step: 'login' };
    }
    
    // Step 2: Add specific items to cart
    const cartResult = buildRealisticCart(baseUrl, vendorId, items);
    if (!cartResult.success || cartResult.cartItems.length === 0) {
      return { success: false, error: 'Cart building failed', step: 'cart' };
    }
    
    // Step 3: Complete Checkout Flow
    const checkoutResult = completeCheckoutFlow(baseUrl, vendorId, loginResult.user.id, cartResult.cartItems);
    if (!checkoutResult.success) {
      return { success: false, error: 'Checkout failed', step: 'checkout' };
    }
    
    // Step 4: Track Order
    const trackingResult = trackOrder(baseUrl, checkoutResult.order.id);
    if (!trackingResult.success) {
      return { success: false, error: 'Order tracking failed', step: 'tracking' };
    }
    
    journeySuccess = true;
    console.log(`🎉 Customer journey with specific items completed successfully!`);
    
  } catch (error) {
    console.error('💥 Customer journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordCustomerJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    vendorId: vendorId,
    items: items,
    timestamp: new Date().toISOString()
  };
} 