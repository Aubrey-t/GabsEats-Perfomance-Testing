import { sleep } from 'k6';
import { recordRiderJourneyMetrics } from '../lib/metrics.js';
import { generateDelay } from '../lib/data-generator.js';

// Import rider scenarios
import riderLogin from '../scenarios/rider/login.js';
import { viewAssignments, viewAvailableAssignments, getAssignmentDetails } from '../scenarios/rider/view-assignments.js';
import { completeDeliveryFlow, acceptAssignment, updateLocation } from '../scenarios/rider/update-status.js';

/**
 * Complete rider journey simulation
 * Login → View assignments → Accept assignment → Complete delivery
 */
export default function riderJourney(baseUrl) {
  const journeyStartTime = Date.now();
  let journeySuccess = false;
  
  try {
    console.log('🚴 Starting rider journey...');
    
    // Step 1: Rider Login
    console.log('🔑 Step 1: Rider Login');
    const loginResult = riderLogin(baseUrl);
    if (!loginResult.success) {
      console.error('❌ Rider login failed');
      return { success: false, error: 'Login failed', step: 'login' };
    }
    console.log('✅ Rider logged in successfully');
    
    // Realistic delay after login
    sleep(generateDelay(2, 5) / 1000);
    
    // Step 2: View Available Assignments
    console.log('📋 Step 2: View Available Assignments');
    const availableAssignmentsResult = viewAvailableAssignments(baseUrl);
    if (!availableAssignmentsResult.success) {
      console.error('❌ Failed to view available assignments');
      return { success: false, error: 'View assignments failed', step: 'view_assignments' };
    }
    
    if (availableAssignmentsResult.assignments.length === 0) {
      console.log('ℹ️ No available assignments');
      // Try viewing all assignments instead
      const allAssignmentsResult = viewAssignments(baseUrl);
      if (!allAssignmentsResult.success || allAssignmentsResult.assignments.length === 0) {
        console.log('ℹ️ No assignments available at all');
        return { success: true, message: 'No assignments to process', step: 'no_assignments' };
      }
      console.log(`✅ Found ${allAssignmentsResult.assignments.length} total assignments`);
    } else {
      console.log(`✅ Found ${availableAssignmentsResult.assignments.length} available assignments`);
    }
    
    // Realistic delay after viewing assignments
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 3: Select and Process Assignment
    console.log('🔄 Step 3: Process Assignment');
    const assignmentsToProcess = availableAssignmentsResult.assignments.length > 0 ? 
      availableAssignmentsResult.assignments : viewAssignments(baseUrl).assignments;
    
    if (assignmentsToProcess.length === 0) {
      console.log('ℹ️ No assignments available to process');
      return { success: true, message: 'No assignments to process', step: 'no_assignments' };
    }
    
    // Select a random assignment to process
    const selectedAssignment = assignmentsToProcess[Math.floor(Math.random() * assignmentsToProcess.length)];
    console.log(`📦 Selected assignment ID: ${selectedAssignment.id}, Order ID: ${selectedAssignment.orderId}`);
    
    // Realistic delay before processing
    sleep(generateDelay(1, 3) / 1000);
    
    // Step 4: Get Assignment Details
    console.log('📄 Step 4: Get Assignment Details');
    const assignmentDetailsResult = getAssignmentDetails(baseUrl, selectedAssignment.id);
    if (!assignmentDetailsResult.success) {
      console.error('❌ Failed to get assignment details');
      return { success: false, error: 'Get assignment details failed', step: 'assignment_details' };
    }
    console.log(`✅ Assignment details retrieved, Pickup: ${assignmentDetailsResult.assignment.pickupLocation}`);
    
    // Realistic delay after getting details
    sleep(generateDelay(1, 2) / 1000);
    
    // Step 5: Complete Delivery Flow (if assignment is available)
    if (selectedAssignment.status === 'available') {
      console.log('✅ Step 5: Complete Delivery Flow');
      const deliveryResult = completeDeliveryFlow(baseUrl, selectedAssignment.orderId);
      if (!deliveryResult.success) {
        console.error('❌ Delivery flow failed');
        return { success: false, error: 'Delivery flow failed', step: 'delivery_flow' };
      }
      console.log(`✅ Delivery completed successfully through ${deliveryResult.steps.length} steps`);
    } else {
      console.log(`ℹ️ Assignment ${selectedAssignment.id} is already in status: ${selectedAssignment.status}`);
      // Just accept the assignment if it's not available
      const acceptResult = acceptAssignment(baseUrl, selectedAssignment.orderId);
      if (!acceptResult.success) {
        console.error('❌ Assignment acceptance failed');
        return { success: false, error: 'Assignment acceptance failed', step: 'accept_assignment' };
      }
      console.log(`✅ Assignment accepted successfully`);
    }
    
    // Realistic delay after processing
    sleep(generateDelay(2, 4) / 1000);
    
    // Step 6: Update Location
    console.log('📍 Step 6: Update Location');
    const locationUpdateResult = updateLocation(baseUrl, {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.random() * 10 + 5
    });
    if (!locationUpdateResult.success) {
      console.warn('⚠️ Failed to update location, but continuing...');
    } else {
      console.log(`✅ Location updated successfully`);
    }
    
    journeySuccess = true;
    console.log('🎉 Rider journey completed successfully!');
    
  } catch (error) {
    console.error('💥 Rider journey failed with error:', error);
    journeySuccess = false;
  }
  
  // Record journey metrics
  const journeyEndTime = Date.now();
  recordRiderJourneyMetrics(journeyStartTime, journeyEndTime, journeySuccess);
  
  return {
    success: journeySuccess,
    duration: journeyEndTime - journeyStartTime,
    timestamp: new Date().toISOString()
  };
} 