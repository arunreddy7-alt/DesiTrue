# DesiTrue

DesiTrue is an AI-ready food ordering and customer engagement platform prototype that combines food ordering, simulated payments, order tracking, WhatsApp automation, customer intelligence, feedback analysis, coupons, and a foundation for advanced AI-driven customer engagement and marketing automation.

The current prototype focuses on building a complete customer-to-feedback workflow while establishing the backend architecture required for upcoming AI and automation modules.

---

## 🚀 Current Workflow

```text
Customer
   ↓
Menu
   ↓
Cart
   ↓
Order
   ↓
Coupon Validation
   ↓
Simulated Payment
   ↓
Order Confirmation
   ↓
Order Tracking
   ↓
WhatsApp Updates
   ↓
Delivery
   ↓
Feedback
   ↓
AI Feedback Analysis
   ↓
Customer Intelligence
✅ Features Implemented
🛒 Customer Ordering System
Digital food menu
Product categories
Product details and pricing
Add to cart
Quantity management
Checkout
Customer information collection
Phone-based customer identification
Server-side product price validation
Order creation and persistence
💳 Simulated Payment System

The prototype includes a simulated payment workflow to demonstrate the complete order lifecycle without requiring a production payment gateway.

Payment Flow
Order Created
     ↓
Payment Pending
     ↓
Simulated Payment
     ↓
Payment Successful
     ↓
Order Confirmed

The system tracks:

Payment status
Order status
Coupon usage
Customer segment updates
📦 Order Management & Tracking

Customers can track their order through the following states:

Order Placed
     ↓
Preparing
     ↓
Ready
     ↓
Delivered

The admin interface can update order status, while the customer application reflects the current order state.

Current Order Features
Order creation
Order status management
Order item management
Payment status tracking
Customer association
Order history
Customer-side order tracking
WhatsApp order status notifications
📱 WhatsApp Automation

A WhatsApp simulator has been implemented to demonstrate customer communication without requiring the production WhatsApp Business API.

Automated Order Updates

The system can send simulated WhatsApp messages for:

Order confirmation
Order preparation
Order ready
Order delivered
Feedback requests
Two-Way WhatsApp Messaging

Customers can send messages through the WhatsApp simulator.

Incoming messages can be processed for:

Feedback detection
Rating extraction
Feedback creation
AI feedback analysis
⭐ AI Feedback Intelligence

Customer feedback can be analyzed using AI.

The current system extracts:

Sentiment
Customer issue/problem
Example

Customer feedback:

"The burger was great but the fries were cold."

AI analysis:

Sentiment: Neutral
Issue: Fries were cold

Feedback can originate from:

Customer application
WhatsApp simulator

Both channels use the same backend feedback system.

🎟️ Coupon Management

The admin dashboard includes coupon management.

Administrators can:

Create coupons
View coupons
Activate coupons
Deactivate coupons
Delete coupons
Configure expiration
Configure usage limits
Configure minimum order values
Configure maximum discounts
Configure customer segment targeting
Supported Discount Types
Percentage discount
Fixed discount
🔐 Coupon Validation

Coupons are validated on the backend before being applied to an order.

Validation includes:

Coupon existence
Active/inactive status
Expiration
Usage limits
Minimum order amount
Customer segment eligibility
Maximum discount limits

The backend recalculates the discount during order creation rather than relying only on frontend calculations.

👥 Customer Management

The system maintains customer records using phone numbers.

Customer information includes:

Name
Phone number
WhatsApp opt-in
Customer segment
Order history
Feedback history

Customers do not need a traditional account/login flow for the current prototype.

🧠 Customer Segmentation

The current prototype includes rule-based customer segmentation.

Current Segments
new_customer
returning_customer
high_value_customer

Segmentation currently considers:

Number of paid orders
Total spending

The segmentation system is designed to become more intelligent as additional customer behavior and AI modules are introduced.

🛠️ Admin Dashboard

The prototype includes administrative functionality for:

Order management
Order status updates
Coupon management
WhatsApp simulation
Customer-related operations

The admin interface acts as the operational layer of the prototype.

🔌 Backend API

The backend is built using:

Python
FastAPI
SQLAlchemy
Pydantic
Alembic
Current API Modules
/api/products
/api/customers
/api/orders
/api/payments
/api/feedback
/api/coupons
/api/whatsapp
🗄️ Database

The project uses PostgreSQL with SQLAlchemy for database interaction.

Main Entities
Customer
   │
   ├── Orders
   │      ├── Order Items
   │      └── Coupon
   │
   ├── Feedback
   │
   └── WhatsApp Messages

Product
Coupon
Order
OrderItem
Feedback
WhatsAppMessage
🧬 Database Migrations

Alembic is used for database schema versioning.

Current migrations include functionality for:

Initial menu schema
Customer and order tables
Feedback
Customer segmentation
WhatsApp messages
Coupons
Coupon integration with orders
💻 Frontend

The frontend is built using:

Next.js
React
TypeScript
Tailwind CSS
Frontend Structure
frontend/
├── app/
│   ├── admin/
│   │   ├── coupons/
│   │   └── page.tsx
│   │
│   ├── whatsapp/
│   │   └── page.tsx
│   │
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── public/
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
└── tsconfig.json
🏗️ Backend Structure
backend/
├── alembic/
│   ├── versions/
│   ├── README
│   ├── env.py
│   └── script.py.mako
│
├── app/
│   ├── core/
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── coupon.py
│   │   ├── feedback.py
│   │   ├── menu.py
│   │   ├── order.py
│   │   └── whatsapp_message.py
│   │
│   ├── routers/
│   │   ├── coupons.py
│   │   ├── customers.py
│   │   ├── feedback.py
│   │   ├── orders.py
│   │   ├── payments.py
│   │   ├── products.py
│   │   └── whatsapp.py
│   │
│   ├── schemas/
│   │   ├── coupon.py
│   │   ├── feedback.py
│   │   └── order.py
│   │
│   ├── services/
│   │   ├── customer_segmentation.py
│   │   ├── feedback_ai.py
│   │   ├── feedback_fallback.py
│   │   └── whatsapp_service.py
│   │
│   ├── main.py
│   └── seed.py
│
├── alembic.ini
└── requirements.txt
🤖 AI & Automation Roadmap

The current prototype provides the foundation for a larger AI-powered food commerce and customer engagement platform.

The following capabilities are planned for the next development phase.

1. 🍔 AI Food Recommendation Engine

Personalized food recommendations based on customer behavior and context.

Potential signals include:

Previous orders
Product preferences
Ratings
Feedback
Popular products
Order context

Example:

Customer:
"You liked the Chicken Burger previously."

AI:
"You may also like the Peri-Peri Chicken Wrap."
2. ⏱️ Smart ETA Prediction Engine

An intelligent ETA system that can estimate preparation and delivery time using factors such as:

Order items
Quantity
Preparation time
Current order queue
Historical preparation data
Time of day

Example:

Estimated delivery time:
28–34 minutes
3. 🌎 Multilingual AI

Multilingual customer interaction for:

Ordering
Recommendations
Feedback
Customer support
WhatsApp conversations

The system is planned to support languages such as:

English
Hindi
Telugu
Hinglish

Example:

Customer:
"Bhai ₹300 ke andar kuch spicy suggest kar."

AI:
Understands the request and recommends suitable food.
4. 📢 AI Campaign Management

An AI-powered campaign system for customer engagement.

Planned capabilities include:

Campaign creation
Audience selection
Customer segmentation
AI-generated campaign strategy
AI-generated campaign messages
Personalized campaigns
Scheduled campaigns
WhatsApp campaign automation
Campaign response analysis
Campaign performance tracking

The planned system can generate campaigns based on customer behavior rather than relying only on manually created campaigns.

5. 🧠 AI Customer Churn Prediction

Identify customers who may be becoming inactive.

Potential signals:

Last order date
Order frequency
Spending behavior
Feedback
Engagement
Previous purchasing behavior

Example:

Customer
   ↓
Behavior Analysis
   ↓
Churn Risk Detection
   ↓
Recommended Retention Action
6. 🎁 Dynamic Personalized Offers

Personalized offer recommendations based on customer behavior.

Possible offers include:

Percentage discounts
Fixed discounts
Free-item offers
Comeback offers
Loyalty offers

AI recommends an appropriate offer while predefined business rules validate and enforce the actual discount.

7. 🍟 AI Upselling & Cross-selling

Recommend complementary products during the ordering process.

Examples:

Add-ons
Combos
Frequently purchased combinations
Complementary products

Example:

Customer adds:
Chicken Burger

AI:
"Customers who order this often add
Peri-Peri Fries."
8. 🗣️ Conversational AI Ordering

Allow customers to interact with the ordering system using natural language.

Example:

Customer:
"I'm hungry. Give me something spicy under ₹300."

AI:
"I'd recommend the Spicy Chicken Burger for ₹249.
Would you like me to add fries?"

Customer:
"Yeah."

AI:
Updates the customer's cart.

This feature is planned to connect:

Natural Language
      ↓
Intent Detection
      ↓
Product Search
      ↓
Recommendation
      ↓
Cart Action
9. 📊 AI Business Copilot

An AI assistant for administrators.

The Business Copilot will be designed to answer questions using application data.

Example queries:

"Which customers haven't ordered recently?"

"What are the biggest customer complaints?"

"Which products should we promote?"

"Who should I target for a campaign?"

"Why did sales change this week?"

The goal is to make business data accessible through natural language.

10. 🔄 AI Automation / Decision Engine

A central automation layer connecting customer intelligence, feedback, offers, campaigns, and communication.

Example workflow:

Customer gives 2★ rating
        ↓
AI Feedback Analysis
        ↓
Issue Detection
        ↓
Customer Intelligence
        ↓
Decision Engine
        ↓
Recovery Offer
        ↓
Personalized WhatsApp Message
        ↓
Customer Response
        ↓
AI Response Analysis
        ↓
Next Action

The Decision Engine will connect multiple AI capabilities into automated business workflows.

🎨 AI Promotional Creative Generation

As part of the campaign system, the platform is planned to generate complete promotional campaigns including:

Campaign headline
Promotional copy
Offer description
Call-to-action
WhatsApp-ready message
Promotional image
Personalized campaign content

Planned campaign workflow:

Customer Data
      ↓
Audience Selection
      ↓
Campaign Strategy
      ↓
Offer
      ↓
AI Message
      ↓
AI Promotional Image
      ↓
Schedule
      ↓
WhatsApp Campaign
      ↓
Response Analysis
📈 Future Analytics & AI Insights

The platform is planned to provide deeper business analytics including:

Revenue trends
Order trends
Product performance
Customer behavior
Coupon performance
Feedback trends
Campaign performance
Customer segmentation
Churn risk
AI-generated business insights

Example:

AI Business Insight:

"Delivery-related complaints have increased
among recent orders."

Recommended Action:

"Consider targeting affected customers
with a recovery campaign."
🔗 Planned End-to-End Architecture
                         CUSTOMER
                            │
               ┌────────────┴────────────┐
               │                         │
           ORDERING                CONVERSATION
               │                         │
               ▼                         ▼
       AI RECOMMENDATION          MULTILINGUAL AI
               │                         │
               └────────────┬────────────┘
                            ▼
                          ORDER
                            │
                            ▼
                     SMART ETA ENGINE
                            │
                            ▼
                         PAYMENT
                            │
                            ▼
                     ORDER TRACKING
                            │
                            ▼
                        DELIVERY
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
               FEEDBACK            WHATSAPP
                  │                   │
                  ▼                   ▼
            AI ANALYSIS         CUSTOMER RESPONSE
                  │                   │
                  └─────────┬─────────┘
                            ▼
                   CUSTOMER INTELLIGENCE
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
            CHURN         OFFERS       SEGMENTS
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    DECISION ENGINE
                            │
                            ▼
                    CAMPAIGN ENGINE
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
              AI MESSAGE           AI IMAGE
                  │                   │
                  └─────────┬─────────┘
                            ▼
                         WHATSAPP
                            │
                            ▼
                    CUSTOMER RESPONSE
                            │
                            ▼
                       AI ANALYSIS
                            │
                            ▼
                    NEXT AUTOMATION
🧪 Project Status
Completed
 Food menu
 Product management
 Customer ordering
 Shopping cart
 Checkout
 Simulated payment
 Payment status tracking
 Order management
 Order status tracking
 Customer management
 Customer segmentation
 WhatsApp simulator
 Two-way WhatsApp messaging
 WhatsApp order notifications
 Feedback collection
 WhatsApp feedback
 AI feedback sentiment analysis
 AI issue extraction
 Coupon creation
 Coupon activation/deactivation
 Coupon deletion
 Coupon validation
 Coupon expiry validation
 Coupon usage limits
 Minimum order validation
 Maximum discount validation
 Segment-based coupon targeting
 Coupon integration with orders
 Coupon usage tracking
 Database migrations
🚧 Planned
 Campaign management
 AI food recommendations
 Smart ETA prediction
 Multilingual AI
 AI customer churn prediction
 Dynamic personalized offers
 AI upselling and cross-selling
 Conversational AI ordering
 AI campaign generation
 AI-generated promotional images
 Scheduled campaign automation
 Campaign response analysis
 AI Business Copilot
 AI Automation / Decision Engine
 Advanced analytics
 AI-generated business insights
🧰 Technology Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Backend
Python
FastAPI
SQLAlchemy
Pydantic
Database
PostgreSQL
Database Migration
Alembic
AI
Gemini API
AI-powered feedback analysis
Planned AI recommendation systems
Planned conversational AI
Planned AI analytics
Planned AI automation
Communication
WhatsApp simulator
Webhook-ready architecture
⚙️ Local Development
1. Clone the Repository
git clone <repository-url>
cd DesiTrue
2. Backend Setup

Navigate to the backend:

cd backend

Create a virtual environment:

python -m venv venv
Windows
venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run the backend:

uvicorn app.main:app --reload
3. Frontend Setup

Open another terminal and navigate to the frontend:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev
🔐 Environment Variables

Environment variables should be stored in .env files and should never be committed to Git.

Example:

DATABASE_URL=your_database_url
GEMINI_API_KEY=your_gemini_api_key

Make sure sensitive credentials are excluded from version control.

📁 Project Structure
DesiTrue/
│
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── seed.py
│   │
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── whatsapp/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
🎯 Project Vision

The long-term goal of DesiTrue is to evolve from a traditional food ordering application into an AI-powered customer engagement and commerce automation platform.

The platform is designed to connect:

Customer Interaction
        ↓
Orders
        ↓
Customer Intelligence
        ↓
AI Decisions
        ↓
Personalized Actions
        ↓
Campaigns
        ↓
WhatsApp Engagement
        ↓
Response Analysis
        ↓
Continuous Automation

Instead of treating ordering, feedback, marketing, and analytics as separate systems, the platform aims to create a connected feedback loop where customer interactions continuously improve personalization, engagement, and business decisions.

📌 Current Status

Project Stage: Working Prototype

The core:

Customer
   ↓
Order
   ↓
Payment
   ↓
WhatsApp Updates
   ↓
Delivery
   ↓
Feedback
   ↓
AI Feedback Analysis

workflow is currently implemented.

The next development phase focuses on adding advanced AI capabilities and connecting them through a centralized automation and decision-making layer.

👨‍💻 Developer

Arun