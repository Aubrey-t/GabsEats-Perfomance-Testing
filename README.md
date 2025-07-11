# GabsEats Performance Testing Framework

This repository contains comprehensive performance testing scripts for the GabsEats food delivery platform using K6.

## Architecture Overview

GabsEats consists of three main applications:
- Customer App: Browse restaurants, place orders, track delivery
- Vendor App: Receive orders, manage menus, update order status
- Rider App: Accept deliveries, update delivery status

## Project Structure

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

## Running Tests

| Scenario ID | Test Type     | Description                                         | Command                                 |
|-------------|--------------|-----------------------------------------------------|-----------------------------------------|
| T01         | Load Test    | 500 users login and browse restaurants              | k6 run load-tests/load-test.js          |
| T02         | Load Test    | 1000 users place orders within 2 minutes            | k6 run load-tests/load-test.js          |
| T03         | Stress Test  | 2000 homepage requests in 30 seconds                | k6 run load-tests/stress-test.js        |
| T04         | Spike Test   | Sudden burst of 1500 concurrent users               | k6 run load-tests/spike-test.js         |
| T05         | Soak Test    | 200 users continuously active for 2 hours           | k6 run load-tests/soak-test.js          |
| T06         | API Latency  | Measure order creation API under peak load          | k6 run load-tests/latency-test.js       |

> Update the relevant test script parameters in `config/environment.json` and `config/test-data.json` as needed for each scenario.

## Key Metrics Monitored

- Response Time: P95, P99 latencies
- Error Rate: HTTP error percentages
- Throughput: Requests per second
- User Experience: Time to complete journeys
- Authentication: Login success rates
- Business Metrics: Order placement success, delivery tracking

## Configuration

Update `config/environment.json` to set your API endpoints and test parameters.

## Reporting

Test results and CSV reports are saved in the `results/` directory after each run. Review these files for detailed metrics and scenario outcomes. 