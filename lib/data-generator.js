import { SharedArray } from 'k6/data';

// Load test data
const testData = new SharedArray('test-data', function() {
  return JSON.parse(open('../config/test-data.json'));
});

/**
 * Generate random customer data
 */
export function generateCustomerData() {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Emma', 'Chris', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    password: 'TestPass123!',
    name: `${firstName} ${lastName}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    address: generateAddress()
  };
}

/**
 * Generate random vendor data
 */
export function generateVendorData() {
  const restaurantNames = [
    'Pizza Palace', 'Burger House', 'Sushi Express', 'Taco Town', 'Pasta Paradise',
    'Chicken Corner', 'Steak House', 'Veggie Delight', 'Seafood Spot', 'Dessert Dream'
  ];
  const cuisines = ['Italian', 'American', 'Japanese', 'Mexican', 'Chinese', 'Indian', 'Thai', 'Mediterranean'];
  
  const name = restaurantNames[Math.floor(Math.random() * restaurantNames.length)];
  const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
  
  return {
    email: `${name.toLowerCase().replace(/\s+/g, '')}@restaurant.com`,
    password: 'VendorPass123!',
    name: name,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    address: generateAddress(),
    cuisine: cuisine
  };
}

/**
 * Generate random rider data
 */
export function generateRiderData() {
  const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake', 'Cameron'];
  const lastNames = ['Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia'];
  const vehicles = ['Motorcycle', 'Bicycle', 'Scooter', 'Car'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
  
  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@rider.com`,
    password: 'RiderPass123!',
    name: `${firstName} ${lastName}`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    vehicle: vehicle,
    license: `${vehicle.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900000) + 100000}`
  };
}

/**
 * Generate random address
 */
export function generateAddress() {
  const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr', 'Cedar Ln', 'Birch Way', 'Willow Ct'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH'];
  
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  
  return `${Math.floor(Math.random() * 9999) + 1} ${street}, ${city}, ${state} ${zipCode}`;
}

/**
 * Generate random menu item
 */
export function generateMenuItem(cuisine = null) {
  const menuItems = {
    'Italian': [
      { name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 15.99 },
      { name: 'Spaghetti Carbonara', description: 'Pasta with eggs and bacon', price: 18.99 },
      { name: 'Lasagna', description: 'Layered pasta with meat sauce', price: 22.99 }
    ],
    'American': [
      { name: 'Classic Burger', description: 'Beef burger with lettuce and tomato', price: 12.99 },
      { name: 'Chicken Wings', description: 'Crispy wings with hot sauce', price: 14.99 },
      { name: 'BBQ Ribs', description: 'Slow-cooked ribs with BBQ sauce', price: 24.99 }
    ],
    'Japanese': [
      { name: 'California Roll', description: 'Crab, avocado, and cucumber', price: 8.99 },
      { name: 'Teriyaki Chicken', description: 'Grilled chicken with teriyaki sauce', price: 16.99 },
      { name: 'Miso Soup', description: 'Traditional Japanese soup', price: 4.99 }
    ],
    'Mexican': [
      { name: 'Tacos al Pastor', description: 'Pork tacos with pineapple', price: 11.99 },
      { name: 'Enchiladas', description: 'Corn tortillas with cheese and sauce', price: 13.99 },
      { name: 'Guacamole', description: 'Fresh avocado dip', price: 6.99 }
    ]
  };
  
  const cuisines = cuisine ? [cuisine] : Object.keys(menuItems);
  const selectedCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
  const items = menuItems[selectedCuisine];
  const item = items[Math.floor(Math.random() * items.length)];
  
  return {
    ...item,
    category: selectedCuisine,
    preparationTime: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
    available: Math.random() > 0.1 // 90% chance of being available
  };
}

/**
 * Generate random order data
 */
export function generateOrderData(vendorId, customerId) {
  const items = [];
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  
  for (let i = 0; i < numItems; i++) {
    const menuItem = generateMenuItem();
    items.push({
      menuItemId: `item_${Math.floor(Math.random() * 1000)}`,
      name: menuItem.name,
      price: menuItem.price,
      quantity: Math.floor(Math.random() * 3) + 1,
      specialInstructions: Math.random() > 0.7 ? 'Extra cheese please' : null
    });
  }
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = 3.99;
  const total = subtotal + tax + deliveryFee;
  
  return {
    vendorId: vendorId,
    customerId: customerId,
    items: items,
    subtotal: subtotal,
    tax: tax,
    deliveryFee: deliveryFee,
    total: total,
    deliveryAddress: generateAddress(),
    specialInstructions: Math.random() > 0.8 ? 'Please ring doorbell' : null,
    paymentMethod: 'credit_card'
  };
}

/**
 * Generate random location coordinates
 */
export function generateLocation() {
  // Generate coordinates within a reasonable city area
  const baseLat = 40.7128; // New York City latitude
  const baseLng = -74.0060; // New York City longitude
  const latOffset = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
  const lngOffset = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
  
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
    accuracy: Math.random() * 10 + 5 // 5-15 meters accuracy
  };
}

/**
 * Generate random order status update
 */
export function generateStatusUpdate(currentStatus) {
  const statusFlow = {
    'pending': ['accepted', 'cancelled'],
    'accepted': ['preparing'],
    'preparing': ['ready_for_pickup'],
    'ready_for_pickup': ['picked_up'],
    'picked_up': ['in_transit'],
    'in_transit': ['delivered'],
    'delivered': [],
    'cancelled': []
  };
  
  const possibleStatuses = statusFlow[currentStatus] || [];
  if (possibleStatuses.length === 0) return currentStatus;
  
  return possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
}

/**
 * Get random test data from loaded data
 */
export function getRandomTestData(type) {
  switch (type) {
    case 'customer':
      return testData.customers[Math.floor(Math.random() * testData.customers.length)];
    case 'vendor':
      return testData.vendors[Math.floor(Math.random() * testData.vendors.length)];
    case 'rider':
      return testData.riders[Math.floor(Math.random() * testData.riders.length)];
    case 'menuItem':
      return testData.menuItems[Math.floor(Math.random() * testData.menuItems.length)];
    default:
      throw new Error(`Unknown test data type: ${type}`);
  }
}

/**
 * Generate realistic delays between actions
 */
export function generateDelay(minSeconds = 1, maxSeconds = 5) {
  return (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
}

/**
 * Generate random search parameters
 */
export function generateSearchParams() {
  const params = {};
  
  // Random cuisine filter
  const cuisines = ['Italian', 'American', 'Japanese', 'Mexican', 'Chinese', 'Indian'];
  if (Math.random() > 0.5) {
    params.cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
  }
  
  // Random price range
  if (Math.random() > 0.5) {
    params.maxPrice = Math.floor(Math.random() * 50) + 10;
  }
  
  // Random rating filter
  if (Math.random() > 0.5) {
    params.minRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
  }
  
  // Random distance
  if (Math.random() > 0.5) {
    params.maxDistance = Math.floor(Math.random() * 10) + 5; // 5-15 km
  }
  
  return params;
} 