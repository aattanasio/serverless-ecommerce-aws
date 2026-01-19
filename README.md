# Serverless ecommerce order processing system

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)

A production-ready, event-driven e-commerce order processing system built entirely with AWS serverless technologies. This project demonstrates microservices architecture, asynchronous event processing, and cloud-native design patterns.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Serverless E-Commerce Architecture            │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────┐
                          │  Client  │
                          └─────┬────┘
                                │ HTTPS + API Key
                                ▼
                      ┌───────────────────┐
                      │   API Gateway     │
                      │   (REST API)      │
                      └─────────┬─────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │   OrderProcessor        │
                   │   Lambda                │
                   └──────┬─────────┬────────┘
                          │         │
                 Publish  │         │ Save
                 Event    │         │
                          │         ▼
                          │   ┌──────────────┐
                          │   │  DynamoDB    │
                          │   │  Orders      │
                          │   └──────────────┘
                          │
                          ▼
                   ┌──────────────────┐
                   │   EventBridge    │
                   │  (ecommerce-bus) │
                   └─────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ Inventory  │    │  Payment   │    │Notification│
    │  Service   │    │  Service   │    │  Service   │
    └──────┬─────┘    └──────┬─────┘    └──────┬─────┘
           │                 │                 │
           ▼                 │                 ▼
    ┌────────────┐           │          ┌────────────┐
    │ DynamoDB   │           │          │    SNS     │
    │ Inventory  │           │          │  (Email)   │
    └────────────┘           │          └────────────┘
           │                 │                 │
        (DLQ)             (DLQ)             (DLQ)
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ SQS Queue  │    │ SQS Queue  │    │ SQS Queue  │
    └────────────┘    └────────────┘    └────────────┘

                   ┌──────────────────┐
                   │   CloudWatch     │
                   │  Logs & Metrics  │
                   └──────────────────┘
```

## 🎯 Project Overview

This system processes e-commerce orders through a fully serverless, event-driven architecture that automatically scales from zero to thousands of requests without managing servers. When a customer places an order, the system:

1. Validates and stores the order in DynamoDB
2. Publishes an event to EventBridge
3. Triggers three independent microservices in parallel:
   - **Inventory Service**: Updates stock levels
   - **Payment Service**: Processes payment
   - **Notification Service**: Sends email confirmation

## 🏗️ Architecture

### System Components

- **API Gateway**: REST API with API key authentication
- **Lambda Functions**: 4 Node.js microservices
- **EventBridge**: Custom event bus for service orchestration
- **DynamoDB**: NoSQL tables for orders and inventory
- **SNS**: Email notifications via Simple Notification Service
- **SQS**: Dead Letter Queues for failed events
- **CloudWatch**: Comprehensive logging and monitoring dashboard

### Key Features

- **Event-Driven Architecture**: Services are loosely coupled and can fail independently  
- **API Key Authentication**: Secured API Gateway endpoint  
- **Error Handling**: Dead Letter Queues capture failed events for retry  
- **Monitoring**: CloudWatch dashboard with real-time metrics  
- **Integration Tests**: Automated testing of complete order flow  
- **Cost-Optimized**: Runs entirely on AWS Free Tier  
- **Auto-Scaling**: Handles traffic spikes without configuration  

## 🚀 Technologies

- **AWS Lambda** (Node.js 20.x) - Serverless compute
- **AWS API Gateway** - REST API management
- **AWS EventBridge** - Event-driven orchestration
- **AWS DynamoDB** - NoSQL database
- **AWS SNS** - Pub/Sub messaging
- **AWS SQS** - Message queueing (DLQ)
- **AWS CloudWatch** - Monitoring and logging
- **AWS SDK v3** - JavaScript client libraries

## 📁 Project Structure

```
├── lambda-functions/        # Lambda function source code
├── infrastructure/          # Infrastructure setup scripts
├── scripts/                 # Deployment and testing scripts
└── eventbridge/            # EventBridge configuration files
```

## 👤 Author

**Asja Attanasio**

- Portfolio: [asjaattanasio.it](https://asjaattanasio.it)
- GitHub: [@aattanasio](https://github.com/aattanasio)
- LinkedIn: [asjaattanasio](https://linkedin.com/in/asjaattanasio)
