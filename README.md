# Campus Management System - HW2 Phase 2

Web-based campus management system for student enrollments, tuition payments, grade management, and transaction concurrency testing.

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

The interface is organized into two sections:

### Front Desk (Student Operations)

**Pay Tuition**
- Click **"Pay Tuition"** → Enter student ID, term code (e.g., "2025FA"), payment method, and amount → Submit
- Payment methods: CASH, CARD, ACH
- Uses ACID transactions with automatic rollback on failure

**View Grades**
- Click **"View Grades"** → Enter student ID → View all grades with course details

**Browse Tables**
- Click **"Browse Tables"** → Select a table from dropdown → View data
- Available tables: All 14 campus database tables

### Back Office (Admin Operations)

**Create Tables**
- Click **"Create Tables"** → Creates complete database schema
- Required as the first setup step

**Initialize Lookups**
- Click **"Initialize Lookups"** → Seeds database with sample data
- Creates students, courses, enrollments, charges, and initial wallets
- Required as the second setup step

**Simulation (Auto-populate)**
- Click **"Simulation"** → Generates 20 random payment transactions
- Tests individual transaction processing
- Shows timing and success rate

**Concurrent Test**
- Click **"Concurrent Test"** → Runs 2 payment simulations simultaneously
- Tests transaction isolation and race condition handling
- Demonstrates ACID properties under concurrent load
- **NEW in Phase 2**

**Post Grades (Instructor)**
- Click **"Post Grades"** → Enter student ID, offering ID, tutor ID, and grade → Submit
- Creates audit trail in mark_audit table
- *Tip: Use Browse → enrol to find valid enrollment IDs*

**Reports**
- Click **"Reports"** → View multiple reports:
  - Offering Fill Rate: Course enrollment percentages
  - Term Billing Summary: Financial overview by term
  - Student Balances: Outstanding balances for current term

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

### Phase 2 Enhancements
- **Concurrent Transaction Testing**: Run multiple simulations simultaneously to test isolation
- **Enhanced UI**: Organized into Front Desk and Back Office sections
- **Multiple Reports**: Offering fill rates, billing summaries, and student balances
- **Dynamic Table Rendering**: Browse any table with automatic column detection

### Core Features (Phase 1)
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

### Setup & Data Management
- `POST /api/create-tables` - Create complete database schema
- `POST /api/seed-lookups` - Seed lookup tables and sample data
- `GET /api/browse?table=<name>&limit=<n>` - Browse any table with limit

### Transactions (ACID-compliant)
- `POST /api/txn/pay-tuition` - Process tuition payment with wallet transfers
- `POST /api/txn/post-grade` - Post or update student grade with audit logging
- `POST /api/simulate` - Simulate 20 random payment transactions

### Query & Reporting
- `GET /api/grades/:student_id` - Get all grades for a student
- `GET /api/report/fill` - Offering fill rate analysis
- `GET /api/report/billing` - Term-by-term billing summary
- `GET /api/report/balances?term=<code>` - Student balance report for specific term

### Health Check
- `GET /api/health` - Server status check

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

## Implementation Notes

### Transaction Isolation
The application implements proper transaction isolation using:
- PostgreSQL transactions with `BEGIN`/`COMMIT`/`ROLLBACK`
- Row-level locking with `FOR UPDATE` to prevent race conditions
- Atomic operations ensuring data consistency
- Automatic rollback on errors

### Concurrency Testing
The concurrent test feature demonstrates:
- Multiple transactions executing simultaneously
- Proper wallet balance updates without race conditions
- Transaction isolation preventing dirty reads
- Serializable execution despite parallel processing

### Payment Flow
1. Validates student, term, and charge existence
2. Locks relevant rows with `FOR UPDATE`
3. Inserts receipt record
4. Updates charge paid amount
5. For non-cash: Debits student wallet, credits company wallet
6. Commits all changes atomically or rolls back on error

### Grade Posting Flow
1. Locks enrollment record with `FOR UPDATE`
2. Retrieves old grade value
3. Updates grade in enrollment table
4. Creates audit record with old/new values and timestamp
5. Commits transaction

## Team Information

Team 15 - Database Systems HW2 Phase 2
