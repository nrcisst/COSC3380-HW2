# Team 15 - University Database Web Application

## Overview
A web-based database application for managing university operations including student enrollment, course offerings, tuition payments, and academic reporting. Built with Express.js backend, PostgreSQL database, and vanilla JavaScript frontend.

## Phase 1 Features
- Database schema with 13 normalized tables (3NF/BCNF)
- ACID-compliant tuition payment transactions
- Student enrollment management
- Analytical reporting (course fill rates, billing summaries, student balances)
- RESTful API with Express.js
- Interactive web interface

## Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL (v12+)
- macOS, Linux, or Windows with bash

## Setup Instructions

### 1. Database Setup
Create a PostgreSQL database:
```bash
createdb postgres
```

Or connect to existing PostgreSQL instance and note credentials.

### 2. Environment Configuration
Copy the example environment file and configure your database credentials:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection details:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=postgres
PGUSER=your_username
PGPASSWORD=your_password
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Server
```bash
npm start
```

Server will start at `http://localhost:3000`

## Demo Workflow

Follow this sequence for a complete demonstration:

### Step 1: Initialize Database (Back Office)
1. Open browser to `http://localhost:3000`
2. Click **"Create Tables"** - Creates 13 tables in campus schema
3. Click **"Init Lookups"** - Seeds initial data:
   - 12 academic divisions
   - 12 classrooms
   - 12 courses (COSC3380, MATH2413, etc.)
   - 12 instructors
   - 120 students
   - 12 course offerings for Fall 2025
   - Student enrollments (2 courses per student)
   - Tuition charges
   - Student wallets with initial balances

### Step 2: Browse Data (Front Desk)
4. Click **"Browse 10 Rows"** - Displays first 10 students with IDs, names, emails

### Step 3: Process Transaction (Front Desk)
5. Click **"Pay Tuition (Txn)"** - Executes ACID transaction:
   - Student #1 pays $325 via credit card
   - Updates receipt, charge, and two wallet balances
   - Demonstrates all-or-nothing transaction integrity

### Step 4: Generate Reports (Front Desk)
6. Click **"Run Reports"** - Shows offering fill rate analysis:
   - Course code and term
   - Enrolled count vs capacity
   - Fill percentage
   - Sorted by utilization

## Repository Structure
```
.
├── server.js           # Express API server
├── db.js              # PostgreSQL connection pool
├── package.json       # Node.js dependencies
├── .env               # Database credentials (gitignored)
├── sql/
│   ├── create_tables.sql    # DDL for 13 tables
│   ├── lookup_seed.sql      # Initial data (120 students, 12 courses)
│   ├── transaction.sql      # Transaction scripts (pay tuition, post grades)
│   └── query.sql           # Analytical queries (3 reports)
├── docs/
│   └── team15-ER.md        # ER diagram (Mermaid format)
└── web/
    ├── index.html          # Frontend UI
    ├── css/styles.css      # Styling
    └── js/app.js           # Frontend logic
```

## API Endpoints

### Setup
- `POST /api/create-tables` - Execute DDL
- `POST /api/seed-lookups` - Load initial data

### Data Access
- `GET /api/browse?table=X&limit=N` - Browse table rows

### Transactions
- `POST /api/txn/pay-tuition` - Process tuition payment (ACID)

### Reports
- `GET /api/report/fill` - Offering fill rates
- `GET /api/report/billing` - Term billing summary
- `GET /api/report/balances?term=CODE` - Student balances by term

## Database Schema
13 tables in `campus` schema:
- **Lookups**: division, hall, term, unit (course), pay_kind
- **People**: student, tutor (instructor)
- **Core**: offering (section), timeslot, enrol, charge
- **Financial**: wallet, receipt
- **Audit**: mark_audit (grade changes)

See `docs/team15-ER.md` for complete ER diagram.

## Key Transactions
1. **Pay Tuition** - Updates 4 entities atomically:
   - Inserts receipt
   - Updates charge.paid_amt
   - Debits student wallet
   - Credits university wallet

2. **Post Grade** - Updates enrollment and creates audit trail

## Technologies
- Backend: Node.js, Express.js
- Database: PostgreSQL with pg driver
- Frontend: Vanilla JavaScript (ES6+)
- Styling: Custom CSS

