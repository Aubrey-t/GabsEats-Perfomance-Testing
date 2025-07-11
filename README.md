# GabsEats Performance Testing Framework

This repository contains comprehensive performance testing scripts for the GabsEats food delivery platform using K6.

## 🏗️ Architecture Overview

GabsEats consists of three main applications:
- **Customer App**: Browse restaurants, place orders, track delivery
- **Vendor App**: Receive orders, manage menus, update order status
- **Rider App**: Accept deliveries, update delivery status

## 📁 Project Structure

```
├── config/
│   ├── environment.json          # Environment configurations
│   └── test-data.json           # Test data for different user types
├── lib/
│   ├── auth.js                  # Authentication utilities
│   ├── api-client.js            # API client with common functions
│   ├── data-generator.js        # Test data generation utilities
│   └── metrics.js               # Custom metrics and thresholds
├── scenarios/
│   ├── customer/
│   │   ├── login.js
│   │   ├── browse-vendors.js
│   │   ├── view-menu.js
│   │   ├── cart-operations.js
│   │   ├── checkout.js
│   │   └── track-order.js
│   ├── vendor/
│   │   ├── login.js
│   │   ├── view-orders.js
│   │   └── accept-order.js
│   └── rider/
│       ├── login.js
│       ├── view-assignments.js
│       └── update-status.js
├── journeys/
│   ├── customer-journey.js      # Complete customer workflow
│   ├── vendor-journey.js        # Complete vendor workflow
│   └── rider-journey.js         # Complete rider workflow
├── load-tests/
│   ├── smoke-test.js           # Basic functionality test
│   ├── load-test.js            # Normal load testing
│   ├── stress-test.js          # High load testing
│   └── spike-test.js           # Sudden traffic spikes
└── results/                    # Test results and reports
```

## 🚀 Quick Start

### Prerequisites
- K6 installed (https://k6.io/docs/getting-started/installation/)
- Node.js (for data generation utilities)

### Running Tests

1. **Smoke Test** (Basic functionality):
```bash
k6 run load-tests/smoke-test.js
```

2. **Load Test** (1000 customers, 200 vendors, 300 riders):
```bash
k6 run load-tests/load-test.js
```

3. **Stress Test** (High load):
```bash
k6 run load-tests/stress-test.js
```

## 📊 Key Metrics Monitored

- **Response Time**: P95, P99 latencies
- **Error Rate**: HTTP error percentages
- **Throughput**: Requests per second
- **User Experience**: Time to complete journeys
- **Authentication**: Login success rates
- **Business Metrics**: Order placement success, delivery tracking

## 🔧 Configuration

Update `config/environment.json` to set your API endpoints and test parameters.

## 📈 Interpreting Results

- **Green**: All metrics within acceptable thresholds
- **Yellow**: Some metrics approaching limits
- **Red**: Performance issues detected

## 🛠️ Best Practices

1. **Modular Design**: Reusable components in `lib/`
2. **Environment Config**: Separate configs for different environments
3. **Data Management**: Realistic test data generation
4. **Authentication**: Proper JWT token handling
5. **Monitoring**: Comprehensive metrics collection 