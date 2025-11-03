-- Placeholder for transactional SQL scripts (e.g., tuition payment processing).
SET search_path TO campus;

-- T1: Pay Charge (receipt + charge + wallet move)
-- params: :p_student_id, :p_term_code, :p_kind ('CARD'|'ACH'|'CASH'), :p_amount
BEGIN;

WITH sel_term AS (
  SELECT term_id FROM term WHERE code = :p_term_code FOR UPDATE
), lock_charge AS (
  SELECT c.* FROM charge c
  JOIN sel_term st ON st.term_id = c.term_id
  WHERE c.student_id = :p_student_id FOR UPDATE
)
INSERT INTO receipt(student_id, term_id, wallet_id, kind_code, amount)
SELECT :p_student_id,
       (SELECT term_id FROM term WHERE code=:p_term_code),
       (SELECT wallet_id FROM wallet
         WHERE owner_type = CASE WHEN :p_kind='CASH' THEN 'COMPANY' ELSE 'STUDENT' END
           AND (owner_id = :p_student_id OR owner_id IS NULL)),
       :p_kind,
       :p_amount;

UPDATE charge c
SET paid_amt = paid_amt + :p_amount
FROM term t
WHERE c.student_id = :p_student_id
  AND c.term_id = t.term_id
  AND t.code = :p_term_code;

DO $$
DECLARE ws INT; wc INT;
BEGIN
  IF :p_kind <> 'CASH' THEN
    SELECT wallet_id INTO ws FROM wallet WHERE owner_type='STUDENT' AND owner_id=:p_student_id;
    SELECT wallet_id INTO wc FROM wallet WHERE owner_type='COMPANY' AND owner_id IS NULL;

    UPDATE wallet SET balance = balance - :p_amount
    WHERE wallet_id = ws AND balance >= :p_amount;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient funds for student %', :p_student_id; END IF;

    UPDATE wallet SET balance = balance + :p_amount WHERE wallet_id = wc;
  END IF;
END $$;

COMMIT;

-- T2: Post Grade (enrol + mark_audit)
-- params: :p_student_id, :p_offering_id, :p_tutor_id, :p_grade
BEGIN;

-- lock row, pull old grade
WITH prior AS (
  SELECT grade FROM enrol WHERE student_id=:p_student_id AND offering_id=:p_offering_id FOR UPDATE
)
UPDATE enrol
SET grade = :p_grade
WHERE student_id=:p_student_id AND offering_id=:p_offering_id;

INSERT INTO mark_audit(student_id, offering_id, old_grade, new_grade, by_tutor)
VALUES (
  :p_student_id, :p_offering_id,
  (SELECT grade FROM enrol WHERE student_id=:p_student_id AND offering_id=:p_offering_id),
  :p_grade, :p_tutor_id
);

COMMIT;

-- T3: Open Term (admin)
-- param: :p_term_code
UPDATE term SET status='OPEN' WHERE code=:p_term_code AND status='PLAN';

