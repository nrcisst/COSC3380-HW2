# Campus Management System - HW2 Phase 1

Web-based campus management system for student enrollments, tuition payments, and grade management.

## Prerequisites

- **Node.js** (v14+) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12+) - [Download](https://www.postgresql.org/download/)

## Setup Instructions

### 1. Create Database User and Database

Run these commands in your terminal:

**For most systems (Linux/Windows):**
```bash
# Create the role (user)
psql -U postgres -c "CREATE ROLE campus_user WITH LOGIN PASSWORD 'campus123';"
psql -U postgres -c "ALTER ROLE campus_user CREATEDB;"

# Create the database
createdb -U campus_user campus
```

**For Mac (if "role postgres does not exist" error):**
```bash
# Use your Mac username instead of postgres
psql -d postgres -c "CREATE ROLE campus_user WITH LOGIN PASSWORD 'campus123';"
psql -d postgres -c "ALTER ROLE campus_user CREATEDB;"

# Create the database
createdb -U campus_user campus
```

**Alternative using psql shell:**
```bash
# Connect to PostgreSQL (use -U postgres on Linux/Windows, omit on Mac)
psql -d postgres

# Run these commands inside psql:
CREATE ROLE campus_user WITH LOGIN PASSWORD 'campus123';
ALTER ROLE campus_user CREATEDB;
\q

# Then create database
createdb -U campus_user campus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

Or directly:
```bash
node src/server.js
```

You should see:
```
✓ Connected to PostgreSQL database
Server running on http://localhost:3000
```

### 4. Open the Application

Open your browser and go to: **http://localhost:3000**

## First-Time Application Setup

Once the app is open in your browser:

1. **Click "Create Tables"** - Creates the database schema (required first step)
2. **Click "Initialize Data"** - Seeds lookup tables with sample data (required second step)

Now you're ready to use all features!

## How to Use

### Browse Data
Click **"Browse"** → Select a table → Click "Browse"

### Pay Tuition
Click **"Pay Tuition"** → Enter student ID, term, payment method, and amount → Submit

### View Grades
Click **"View Grades"** → Enter student ID → View grades

### Post Grade
Click **"Post Grade"** → Enter student ID, offering ID, tutor ID, and grade → Submit
*Tip: Use Browse → Enrollments to find valid IDs*

### Simulate Payments
Click **"Simulate 20 Payments"** → Generates 20 random payment transactions

### View Reports
Click **"Run Reports"** → See offering fill rates

### Clear Display
Click **"Clear"** → Reset results area

## Project Structure

```
HW2/
├── package.json           # Node dependencies
├── .env                   # Database config (DO NOT CHANGE)
├── src/
│   ├── server.js          # Express API server
│   └── db.js              # Database connection
├── sql/
│   ├── create_tables.sql  # Schema definitions
│   └── lookup_seed.sql    # Sample data
└── web/
    ├── index.html         # Main UI
    ├── css/style.css      # Styling
    └── js/app.js          # Frontend logic
```

## Database Configuration

The `.env` file contains:
```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=campus
PGUSER=campus_user
PGPASSWORD=campus123
PORT=3000
```

**No changes needed** - Just create the user and database as shown in Step 1.

## Features

- **Transaction Safety**: Payments use ACID transactions with automatic rollback
- **Audit Trail**: All grade changes are logged in the `mark_audit` table
- **Row-Level Locking**: Prevents race conditions using `FOR UPDATE`
- **Payment Processing**: Validates charges, checks balances, updates wallets atomically

## Database Schema

14 tables in the `campus` schema:
- **Lookup tables**: division, hall, term, pay_kind
- **Core entities**: unit, tutor, student
- **Course management**: offering, timeslot, enrol
- **Financial management**: charge, wallet, receipt
- **Audit**: mark_audit

## API Endpoints

- `POST /api/create-tables` - Create schema
- `POST /api/seed-lookups` - Seed data
- `GET /api/browse?table=<name>&limit=<n>` - Browse table
- `GET /api/grades/:student_id` - Get student grades
- `POST /api/txn/pay-tuition` - Process payment
- `POST /api/txn/post-grade` - Post/update grade
- `POST /api/simulate` - Simulate 20 payments
- `GET /api/report/fill` - Offering fill rate report
- `GET /api/report/billing` - Billing summary
- `GET /api/report/balances?term=<code>` - Student balances

## Troubleshooting

### "Connection refused" error
Check PostgreSQL is running:
```bash
pg_isready
```

### "Database does not exist"
Create it:
```bash
createdb -U campus_user campus
```

### "Role does not exist"
Create the user (see Step 1 above)

### "Port 3000 already in use"
Kill the process:
```bash
lsof -ti:3000 | xargs kill
```

### "Permission denied"
Make sure you created the role with the exact password:
```bash
psql -U postgres -c "DROP ROLE IF EXISTS campus_user;"
psql -U postgres -c "CREATE ROLE campus_user WITH LOGIN PASSWORD 'campus123';"
psql -U postgres -c "ALTER ROLE campus_user CREATEDB;"
```

## Team Information

Team 15 - Database Systems HW2 Phase 1
