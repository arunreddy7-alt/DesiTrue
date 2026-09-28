⚡ DesiTrue

AI-powered food ordering, customer intelligence, and automation platform

DesiTrue is a food-commerce prototype designed to go beyond traditional ordering. It combines ordering, payments, order tracking, WhatsApp communication, feedback intelligence, customer segmentation, coupons, and a roadmap of AI-driven automation features.

🧭 Current System

The current prototype focuses on the complete customer journey — from browsing the menu to ordering, delivery, WhatsApp communication, and feedback analysis.

🔄 Core Workflow

CUSTOMER
   │
   ▼
MENU
   │
   ▼
CART
   │
   ▼
ORDER
   │
   ▼
COUPON VALIDATION
   │
   ▼
SIMULATED PAYMENT
   │
   ▼
ORDER CONFIRMED
   │
   ▼
ORDER TRACKING
   │
   ▼
DELIVERY
   │
   ├───────────────┐
   ▼               ▼
WHATSAPP       FEEDBACK
   │               │
   │               ▼
   │          AI ANALYSIS
   │               │
   └───────┬───────┘
           ▼
     CUSTOMER DATA

✅ What Works Right Now

🛒 Food Ordering

Customers can:

Browse the food menu

View products and prices

Add items to the cart

Change quantities

Checkout

Provide customer information

Place orders

Track their orders

The backend also revalidates product prices when an order is created.

💳 Payment Flow

A simulated payment system is currently implemented so the complete order lifecycle can be demonstrated without requiring a production payment gateway.

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

📦 Order Tracking

Customers can follow their order through:

🟡 Order Placed
       ↓
🟠 Preparing
       ↓
🔵 Ready
       ↓
🟢 Delivered

The admin interface controls the order status, while the customer application reflects the current state.

📱 WhatsApp Automation

A WhatsApp simulator is included to demonstrate how the platform can communicate with customers without requiring the production WhatsApp Business API.

Automated Updates

Customers can receive simulated messages for:

✅ Order confirmation

🍳 Order preparation

📦 Order ready

🛵 Order delivered

⭐ Feedback requests

Two-Way Messaging

Customers can also reply through the WhatsApp simulator.

Incoming messages can be processed through:

Customer Message
      ↓
Message Processing
      ↓
Rating / Feedback Detection
      ↓
Feedback Creation
      ↓
AI Analysis

⭐ AI Feedback Intelligence

One of the first AI capabilities implemented in the platform is AI-powered feedback analysis.

The system analyzes customer feedback and extracts:

😊 Sentiment

🔎 Customer issue / problem

Example

Customer

"The burger was great but the fries were cold."

AI Analysis

Sentiment → Neutral
Issue     → Fries were cold

Feedback can come from:

The customer application

WhatsApp

Both channels connect to the same backend feedback system.

🎟️ Smart Coupon System

The admin dashboard includes a coupon management system.

Administrators can:

Create coupons

View coupons

Activate coupons

Deactivate coupons

Delete coupons

Set expiry dates

Set usage limits

Set minimum order values

Set maximum discounts

Target specific customer segments

Supported Discounts

Percentage discounts

Fixed discounts

🔐 Server-Side Coupon Validation

Coupons are not trusted purely from the frontend.

The backend validates:

Coupon existence

Active / inactive state

Expiration

Usage limit

Minimum order amount

Customer segment eligibility

Maximum discount

The final discount is recalculated during order creation.

Customer enters coupon
        ↓
Frontend validation
        ↓
Backend validation
        ↓
Discount calculated
        ↓
Order created
        ↓
Payment
        ↓
Coupon usage updated

👥 Customer Intelligence

Every customer can be associated with:

Name

Phone number

WhatsApp opt-in

Orders

Feedback

Customer segment

The current prototype uses basic rule-based segmentation.

Current Segments

Segment

Description

🆕 new_customer

New or low-order customer

🔄 returning_customer

Customer with multiple purchases

💎 high_value_customer

High-spending / frequent customer

The segmentation layer will later become part of the larger AI customer intelligence system.

🛠️ Admin Dashboard

The admin side currently provides operational controls for:

📦 Orders

🔄 Order status

🎟️ Coupons

📱 WhatsApp simulation

👥 Customer operations

The goal is to eventually evolve this into an AI-powered business control center.

🧠 Where We're Taking It

The current system is only the foundation.

The next phase transforms DesiTrue from a normal food ordering system into an AI-powered customer intelligence and automation platform.

🚀 AI Roadmap

1. 🍔 AI Food Recommendation Engine

The system will recommend food based on customer behavior and context.

Potential Signals

Previous orders

Product preferences

Ratings

Feedback

Popular items

Current order context

Example

Customer

"I want something similar to what I ordered last time."

AI

"You previously enjoyed the Chicken Burger. Try the Peri-Peri Chicken Wrap."

2. ⏱️ Smart ETA Engine

Instead of showing a fixed delivery estimate, DesiTrue will calculate a dynamic ETA using:

Order items

Quantity

Preparation time

Current order queue

Historical preparation data

Time of day

Example

Estimated Delivery
28 – 34 minutes

3. 🌎 Multilingual AI

Customers will be able to interact with the system naturally across multiple languages.

Planned Support

🇬🇧 English

🇮🇳 Hindi

🇮🇳 Telugu

🗣️ Hinglish

Example

Customer

"Bhai ₹300 ke andar kuch spicy suggest kar."

Customer message
      ↓
AI understands intent
      ↓
Finds suitable food
      ↓
Recommends an option

This will work across:

Ordering

Recommendations

Feedback

Customer support

WhatsApp conversations

4. 📢 AI Campaign Management

The campaign system will allow the platform to create and automate customer campaigns.

Planned Capabilities

Campaign creation

Audience selection

Customer segmentation

AI campaign strategy

AI-generated copy

Personalized campaigns

Campaign scheduling

WhatsApp campaigns

Campaign response analysis

Campaign performance tracking

The goal is to move from:

"Admin creates every campaign manually."

to:

"AI identifies an opportunity and prepares the campaign."

5. 🧠 AI Churn Prediction

The system will identify customers who may be becoming inactive.

Potential Signals

Last Order
    +
Order Frequency
    +
Spending
    +
Feedback
    +
Engagement

Planned Workflow

Customer Behavior
       ↓
AI Analysis
       ↓
Churn Risk
       ↓
Recommended Retention Action

6. 🎁 Dynamic Personalized Offers

Instead of giving everyone the same coupon, the system will recommend offers based on customer behavior.

Possible Offers

Percentage discounts

Fixed discounts

Free-item offers

Comeback offers

Loyalty offers

The AI recommends the offer.

Business rules remain responsible for validating and enforcing the actual discount.

7. 🍟 AI Upselling & Cross-Selling

The system will recommend complementary items during the ordering process.

Example

Customer adds:

🍔 Chicken Burger
       ↓

AI:

"Customers who order this often add Peri-Peri Fries."

This can be used for:

Add-ons

Combos

Complementary items

Frequently purchased combinations

8. 🗣️ Conversational AI Ordering

Customers will eventually be able to order naturally using conversation.

Example

Customer

"I'm hungry. Give me something spicy under ₹300."

AI

"I'd recommend the Spicy Chicken Burger for ₹249. Would you like fries?"

Customer

"Yeah."

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

The admin dashboard will eventually include an AI assistant capable of answering questions using real application data.

Example Questions

"Which customers haven't ordered recently?"

"What are the biggest customer complaints?"

"Which products should we promote?"

"Who should I target for a campaign?"

"Why did sales change this week?"

Instead of manually searching through dashboards, the admin can ask questions naturally.

10. 🔄 AI Automation & Decision Engine

This will become the central intelligence layer connecting the different AI modules.

Example

Customer gives 2⭐
      ↓
AI analyzes feedback
      ↓
Issue detected
      ↓
Customer intelligence checked
      ↓
Decision Engine
      ↓
Recovery offer recommended
      ↓
Personalized WhatsApp message
      ↓
Customer responds
      ↓
AI analyzes response
      ↓
Next action

Continuous Automation Loop

EVENT
  ↓
UNDERSTAND
  ↓
DECIDE
  ↓
ACT
  ↓
MEASURE
  ↓
LEARN
  ↓
NEXT ACTION

AI will recommend or determine the appropriate action, while deterministic business rules remain responsible for validation and execution.

🎨 AI Campaign Creative Generation

The campaign system will also generate promotional creatives.

A campaign can eventually contain:

✍️ Campaign headline

📝 Promotional copy

🎟️ Offer

🔘 CTA

📱 WhatsApp-ready message

🖼️ AI-generated promotional image

🎯 Target audience

Planned Workflow

Customer Data
      ↓
Audience Selection
      ↓
Campaign Strategy
      ↓
Offer
      ↓
AI Copy
      ↓
AI Image
      ↓
Schedule
      ↓
WhatsApp Campaign
      ↓
Response Analysis

📈 AI Analytics

The future analytics layer will bring together:

Revenue

Orders

Products

Customers

Coupons

Feedback

Campaigns

Customer segments

Churn

AI-generated insights

Example

📊 AI BUSINESS INSIGHT

Delivery-related complaints have increased
among recent orders.

💡 Recommended Action

Consider targeting affected customers
with a recovery campaign.

🔗 The Bigger Vision

The final system is designed around a continuous customer intelligence loop.

                         CUSTOMER
                            │
              ┌─────────────┴─────────────┐
              │                           │
          ORDERING                  CONVERSATION
              │                           │
              ▼                           ▼
      AI RECOMMENDATION            MULTILINGUAL AI
              │                           │
              └─────────────┬─────────────┘
                            ▼
                           ORDER
                            │
                            ▼
                         SMART ETA
                            │
                            ▼
                         PAYMENT
                            │
                            ▼
                         DELIVERY
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
          FEEDBACK                    WHATSAPP
              │                           │
              ▼                           ▼
        AI ANALYSIS                  RESPONSE
              │                           │
              └─────────────┬─────────────┘
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
                      ┌─────┴─────┐
                      ▼           ▼
                   AI COPY     AI IMAGE
                      │           │
                      └─────┬─────┘
                            ▼
                         WHATSAPP
                            │
                            ▼
                         CUSTOMER
                            │
                            ▼
                       AI RESPONSE
                            │
                            ▼
                      NEXT AUTOMATION

🏗️ Tech Stack

Frontend

⚛️ React

▲ Next.js

📘 TypeScript

🎨 Tailwind CSS

Backend

🐍 Python

⚡ FastAPI

🗃️ SQLAlchemy

📋 Pydantic

Database

🐘 PostgreSQL

Database Migrations

🔄 Alembic

AI

✨ Gemini API

AI feedback analysis

Planned recommendation systems

Planned conversational AI

Planned AI analytics

Planned automation engine

Communication

📱 WhatsApp simulator

🔗 Webhook-ready architecture

📁 Project Structure

DesiTrue/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │
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

⚙️ Getting Started

1. Clone the Repository

git clone <repository-url>
cd DesiTrue

2. Start the Backend

cd backend

Create a Virtual Environment

python -m venv venv

Windows

venv\Scripts\activate

Install Dependencies

pip install -r requirements.txt

Start the API

uvicorn app.main:app --reload

3. Start the Frontend

Open another terminal:

cd frontend

Install Dependencies

npm install

Start Next.js

npm run dev

🔐 Environment Variables

Create a .env file for local development.

Example:

DATABASE_URL=your_database_url
GEMINI_API_KEY=your_gemini_api_key

⚠️ Never commit API keys, database credentials, or other secrets to Git.

🧪 Project Status

✅ Completed

Food menu

Product management

Customer ordering

Shopping cart

Checkout

Simulated payment

Payment tracking

Order management

Order status tracking

Customer management

Customer segmentation

WhatsApp simulator

Two-way WhatsApp messaging

WhatsApp order notifications

Feedback collection

WhatsApp feedback

AI sentiment analysis

AI issue extraction

Coupon creation

Coupon activation / deactivation

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

🚧 Coming Next

Campaign management

🍔 AI food recommendations

⏱️ Smart ETA prediction

🌎 Multilingual AI

🧠 AI churn prediction

🎁 Dynamic personalized offers

🍟 AI upselling & cross-selling

🗣️ Conversational AI ordering

📢 AI campaign generation

🎨 AI-generated promotional creatives

📅 Scheduled campaign automation

📈 Campaign response analytics

📊 AI Business Copilot

🔄 AI Automation / Decision Engine

📉 Advanced analytics

💡 AI-generated business insights

🎯 Project Vision

DesiTrue is being built to move beyond a traditional food ordering application.

The long-term goal is to create a system where every customer interaction can contribute to customer intelligence and trigger useful automated actions.

Customer Interaction
        ↓
Order
        ↓
Customer Intelligence
        ↓
AI Decision
        ↓
Personalized Action
        ↓
Campaign
        ↓
WhatsApp Engagement
        ↓
Customer Response
        ↓
AI Analysis
        ↓
Next Action

The idea is simple:

Don't just process the order. Understand the customer, learn from every interaction, and automate what happens next.

👨‍💻 Developer

Arun

Built as an AI-focused prototype for exploring intelligent food commerce, customer engagement, and automation.