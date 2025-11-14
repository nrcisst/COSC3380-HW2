-- Placeholder for lookup table seed data inserts.
SET search_path TO campus;

-- 12 divisions
INSERT INTO division(title, office) VALUES
 ('Computing','PGH-301'),('Math','PGH-210'),('Econ','MH-120'),('Physics','SR-101'),
 ('Chem','SR-210'),('Bio','SR-310'),('English','AH-220'),('History','AH-240'),
 ('Business','BA-101'),('Philosophy','AH-260'),('Sociology','MH-230'),('Art','FA-110');

-- 12 halls
INSERT INTO hall(bldg,room,seats) VALUES
 ('PGH','101',60),('PGH','102',38),('PGH','201',45),('PGH','202',35),
 ('SR','110',52),('SR','210',40),('SR','310',30),('MH','120',84),
 ('AH','220',36),('BA','101',118),('FA','110',40),('FA','210',28);

-- pay kinds
INSERT INTO pay_kind(kind_code,label) VALUES
 ('CARD','Card'),('ACH','Bank'),('CASH','Cash');

-- two terms
INSERT INTO term(code,start_on,end_on,status) VALUES
 ('2025SP','2025-01-13','2025-05-10','PLAN'),
 ('2025FA','2025-08-25','2025-12-10','PLAN');

-- units (courses)
INSERT INTO unit(div_id,code,name,credits) VALUES
 ((SELECT div_id FROM division WHERE title='Computing'),'COSC3380','Databases',3),
 ((SELECT div_id FROM division WHERE title='Computing'),'COSC2436','Data Structures',3),
 ((SELECT div_id FROM division WHERE title='Math'),'MATH2413','Calculus I',4),
 ((SELECT div_id FROM division WHERE title='Math'),'MATH2414','Calculus II',4),
 ((SELECT div_id FROM division WHERE title='Econ'),'ECON2301','Macro',3),
 ((SELECT div_id FROM division WHERE title='Econ'),'ECON2302','Micro',3),
 ((SELECT div_id FROM division WHERE title='Physics'),'PHYS2325','Physics I',4),
 ((SELECT div_id FROM division WHERE title='Chem'),'CHEM1311','General Chemistry',4),
 ((SELECT div_id FROM division WHERE title='English'),'ENGL1302','Composition II',3),
 ((SELECT div_id FROM division WHERE title='Business'),'ACCT2301','Financial Accounting',3),
 ((SELECT div_id FROM division WHERE title='Sociology'),'SOCI1301','Intro Sociology',3),
 ((SELECT div_id FROM division WHERE title='Art'),'ART1301','Foundations of Art',3);

-- tutors (12)
INSERT INTO tutor(div_id, firstn, lastn, email)
SELECT d.div_id, 'Prof'||i, 'Ln'||i, lower('prof'||i||'@campus.test')
FROM (SELECT generate_series(1,12) i) g
JOIN division d ON d.div_id = ((g.i - 1) % 12) + 1;

-- students (120)
INSERT INTO student(div_id, firstn, lastn, email)
SELECT d.div_id, 'Stu'||i, 'L'||i, lower('u'||i||'@campus.test')
FROM (SELECT generate_series(1,120) i) g
JOIN division d ON d.div_id = ((g.i - 1) % 12) + 1;

-- wallets
INSERT INTO wallet(owner_type, owner_id, balance) VALUES ('COMPANY', NULL, 150000.00);
INSERT INTO wallet(owner_type, owner_id, balance)
SELECT 'STUDENT', student_id, 1800 + (random()*1400)::int FROM student;

-- open FA
UPDATE term SET status='OPEN' WHERE code='2025FA';

-- offerings for FA: 1 per unit
INSERT INTO offering(unit_id, term_id, tutor_id, hall_id, cap, mode)
SELECT u.unit_id,
       (SELECT term_id FROM term WHERE code='2025FA'),
       ((row_number() OVER()) % 12) + 1,
       ((row_number() OVER()) % 12) + 1,
       32,
       CASE ((row_number() OVER()) % 3) WHEN 0 THEN 'REMOTE' WHEN 1 THEN 'ONCAMP' ELSE 'BLEND' END
FROM unit u;

-- timeslots: Tue/Thu 09:30–10:45
INSERT INTO timeslot(offering_id, dow, tstart, tend)
SELECT o.offering_id, d, '09:30'::time, '10:45'::time
FROM offering o
CROSS JOIN (VALUES (2),(4)) AS days(d);

-- each student → 2 random offerings (distributed more evenly)
INSERT INTO enrol(student_id, offering_id)
SELECT s.student_id, o.offering_id
FROM student s
CROSS JOIN LATERAL (
  SELECT offering_id
  FROM offering
  ORDER BY md5(s.student_id::text || offering_id::text || random()::text)
  LIMIT 2
) o
ON CONFLICT DO NOTHING;

-- charges for FA (credits * $325)
WITH per_stu AS (
  SELECT e.student_id, o.term_id, SUM(u.credits) credits
  FROM enrol e
  JOIN offering o ON o.offering_id = e.offering_id
  JOIN unit u     ON u.unit_id     = o.unit_id
  JOIN term t     ON t.term_id     = o.term_id AND t.code='2025FA'
  GROUP BY e.student_id, o.term_id
)
INSERT INTO charge(student_id, term_id, due_amt, paid_amt, cstatus)
SELECT s.student_id, s.term_id, (s.credits * 325)::numeric(10,2), 0, 'UNPAID'
FROM per_stu s;

