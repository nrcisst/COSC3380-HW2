# Team15 — University App (compact ER)

**Scope:** Grades + Payments (front desk). Terms/Billing/Posting (back office).

## Tables (keys)
- division(div_id PK)
- hall(hall_id PK, UNIQUE(bldg,room))
- term(term_id PK, code UNIQUE)
- unit(unit_id PK, div_id FK)
- tutor(tutor_id PK, div_id FK)
- student(student_id PK, div_id FK)
- pay_kind(kind_code PK)

- offering(offering_id PK, unit_id/term_id/tutor_id/hall_id FKs)
- timeslot(offering_id, dow, tstart) **PK** ← composite
- enrol(student_id, offering_id) **PK** ← composite, `grade`
- charge(student_id, term_id) **PK** ← composite, `due_amt/paid_amt/cstatus`
- wallet(wallet_id PK, UNIQUE(owner_type,owner_id))
- receipt(receipt_id PK, (student_id,term_id) FK → charge, wallet_id FK, kind_code FK)
- mark_audit(audit_id PK, (student_id,offering_id) FK → enrol, by_tutor FK)

**3NF/BCNF.** Minor cache: `charge.cstatus` (trigger keeps it right).


