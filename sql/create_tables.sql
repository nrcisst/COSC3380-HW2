-- Placeholder for CREATE TABLE statements and index definitions.
-- Team15 / University App (alt style)
-- Schema is 'campus' 
DROP SCHEMA IF EXISTS campus CASCADE;
CREATE SCHEMA campus;
SET search_path TO campus;

-- ===== Lookups =====
CREATE TABLE division (
  div_id SERIAL PRIMARY KEY,
  title  VARCHAR(72) UNIQUE NOT NULL,
  office VARCHAR(32)
);

CREATE TABLE hall (
  hall_id SERIAL PRIMARY KEY,
  bldg    VARCHAR(48) NOT NULL,
  room    VARCHAR(16) NOT NULL,
  seats   INT NOT NULL CHECK (seats > 0),
  UNIQUE (bldg, room)
);

CREATE TABLE term (
  term_id   SERIAL PRIMARY KEY,
  code      VARCHAR(10) UNIQUE NOT NULL,   -- e.g., 2025FA
  start_on  DATE NOT NULL,
  end_on    DATE NOT NULL,
  status    VARCHAR(10) NOT NULL CHECK (status IN ('PLAN','OPEN','BILL','GRADE','CLOSE')),
  CHECK (start_on < end_on)
);

CREATE TABLE unit (                         -- course
  unit_id  SERIAL PRIMARY KEY,
  div_id   INT NOT NULL REFERENCES division(div_id),
  code     VARCHAR(14) NOT NULL,            -- e.g., COSC3380
  name     VARCHAR(120) NOT NULL,
  credits  INT NOT NULL CHECK (credits BETWEEN 1 AND 6),
  UNIQUE(div_id, code)
);

CREATE TABLE tutor (                        -- instructor info
  tutor_id SERIAL PRIMARY KEY,
  div_id   INT REFERENCES division(div_id),
  firstn   VARCHAR(48) NOT NULL,
  lastn    VARCHAR(48) NOT NULL,
  email    VARCHAR(120) UNIQUE NOT NULL,
  hired_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE student (
  student_id SERIAL PRIMARY KEY,
  div_id     INT REFERENCES division(div_id),
  firstn     VARCHAR(48) NOT NULL,
  lastn      VARCHAR(48) NOT NULL,
  email      VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE pay_kind (
  kind_code VARCHAR(10) PRIMARY KEY,        -- 'CARD','ACH','CASH'
  label     VARCHAR(64) NOT NULL
);

-- ===== Core =====
CREATE TABLE offering (                      -- section
  offering_id  SERIAL PRIMARY KEY,
  unit_id      INT NOT NULL REFERENCES unit(unit_id),
  term_id      INT NOT NULL REFERENCES term(term_id),
  tutor_id     INT NOT NULL REFERENCES tutor(tutor_id),
  hall_id      INT REFERENCES hall(hall_id),
  cap          INT NOT NULL CHECK (cap > 0),
  mode         VARCHAR(10) NOT NULL CHECK (mode IN ('ONCAMP','REMOTE','BLEND')),
  UNIQUE(unit_id, term_id, tutor_id, hall_id)
);

-- composite PK #1
CREATE TABLE timeslot (
  offering_id INT NOT NULL REFERENCES offering(offering_id) ON DELETE CASCADE,
  dow         SMALLINT NOT NULL CHECK (dow BETWEEN 1 AND 7),  -- 1=Mon
  tstart      TIME NOT NULL,
  tend        TIME NOT NULL,
  PRIMARY KEY (offering_id, dow, tstart),
  CHECK (tstart < tend)
);

-- composite PK #2
CREATE TABLE enrol (
  student_id  INT NOT NULL REFERENCES student(student_id),
  offering_id INT NOT NULL REFERENCES offering(offering_id),
  enrolled_at TIMESTAMP NOT NULL DEFAULT now(),
  estatus     VARCHAR(10) NOT NULL DEFAULT 'ENROLLED' CHECK (estatus IN ('ENROLLED','DROPPED')),
  grade       VARCHAR(2)  CHECK (grade IN ('A','A-','B+','B','B-','C+','C','C-','D','F','I','W')),
  PRIMARY KEY (student_id, offering_id)
);

-- composite PK #3
CREATE TABLE charge (                         -- tuition bill
  student_id INT NOT NULL REFERENCES student(student_id),
  term_id    INT NOT NULL REFERENCES term(term_id),
  due_amt    NUMERIC(10,2) NOT NULL CHECK (due_amt >= 0),
  paid_amt   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amt >= 0),
  cstatus    VARCHAR(10) NOT NULL DEFAULT 'UNPAID' CHECK (cstatus IN ('UNPAID','PARTIAL','PAID')),
  made_at    TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, term_id)
);

CREATE TABLE wallet (                          -- bank_account
  wallet_id  SERIAL PRIMARY KEY,
  owner_type VARCHAR(10) NOT NULL CHECK (owner_type IN ('STUDENT','COMPANY')),
  owner_id   INT,                               -- student_id when STUDENT; NULL for company
  balance    NUMERIC(12,2) NOT NULL CHECK (balance >= 0),
  UNIQUE(owner_type, owner_id)
);

CREATE TABLE receipt (                          -- payment
  receipt_id  SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES student(student_id),
  term_id     INT NOT NULL,
  wallet_id   INT NOT NULL REFERENCES wallet(wallet_id),
  kind_code   VARCHAR(10) NOT NULL REFERENCES pay_kind(kind_code),
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_at     TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY (student_id, term_id) REFERENCES charge(student_id, term_id)
);

CREATE TABLE mark_audit (                       -- grade_audit
  audit_id   SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  offering_id INT NOT NULL,
  old_grade  VARCHAR(2),
  new_grade  VARCHAR(2) NOT NULL CHECK (new_grade IN ('A','A-','B+','B','B-','C+','C','C-','D','F','I','W')),
  by_tutor   INT NOT NULL REFERENCES tutor(tutor_id),
  at_time    TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY (student_id, offering_id) REFERENCES enrol(student_id, offering_id)
);

-- ===== Indexes (different names) =====
CREATE INDEX ix_offering_term    ON offering(term_id);
CREATE INDEX ix_offering_unit    ON offering(unit_id);
CREATE INDEX ix_enrol_student    ON enrol(student_id);
CREATE INDEX ix_enrol_offering   ON enrol(offering_id);
CREATE INDEX ix_receipt_student  ON receipt(student_id, term_id);
CREATE INDEX ix_charge_status    ON charge(cstatus);

-- ===== Trigger: keep charge.cstatus aligned =====
CREATE OR REPLACE FUNCTION fx_charge_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amt >= NEW.due_amt THEN
    NEW.cstatus := 'PAID';
  ELSIF NEW.paid_amt > 0 THEN
    NEW.cstatus := 'PARTIAL';
  ELSE
    NEW.cstatus := 'UNPAID';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_charge_status ON charge;
CREATE TRIGGER tg_charge_status
BEFORE UPDATE ON charge
FOR EACH ROW EXECUTE FUNCTION fx_charge_status();

