-- Placeholder for analytical query scripts and reports.
SET search_path TO campus;

-- Q1: offering fill (enrolments vs cap)
SELECT o.offering_id, u.code AS unit_code, t.code AS term_code,
       COUNT(e.student_id) AS enrolled, o.cap,
       FLOOR(100.0 * COUNT(e.student_id) / o.cap) AS pct_full
FROM offering o
JOIN unit u ON u.unit_id = o.unit_id
JOIN term t ON t.term_id = o.term_id
LEFT JOIN enrol e ON e.offering_id = o.offering_id AND e.estatus='ENROLLED'
GROUP BY o.offering_id, u.code, t.code, o.cap
ORDER BY pct_full DESC, o.offering_id;

-- Q2: term billing summary
SELECT t.code,
       COUNT(c.student_id) AS billed,
       SUM(c.due_amt) AS total_due,
       SUM(c.paid_amt) AS total_paid,
       SUM(c.due_amt - c.paid_amt) AS outstanding
FROM charge c
JOIN term t ON t.term_id = c.term_id
GROUP BY t.code
ORDER BY t.code;

-- Q3: student balances for a term (provide :p_term)
SELECT s.student_id, s.firstn, s.lastn,
       c.due_amt, c.paid_amt, (c.due_amt - c.paid_amt) AS balance
FROM charge c
JOIN student s ON s.student_id = c.student_id
JOIN term t ON t.term_id = c.term_id
WHERE t.code = :p_term
ORDER BY balance DESC, s.lastn;

