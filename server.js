const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('web'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/create-tables', async (req, res) => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'create_tables.sql'), 'utf8');
    await db.queryFile(sql);
    res.json({ success: true, message: 'Tables created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/seed-lookups', async (req, res) => {
  try {
    await db.query('TRUNCATE campus.mark_audit, campus.receipt, campus.charge, campus.enrol, campus.timeslot, campus.offering, campus.student, campus.tutor, campus.unit, campus.wallet, campus.term, campus.hall, campus.division, campus.pay_kind RESTART IDENTITY CASCADE');
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'lookup_seed.sql'), 'utf8');
    await db.queryFile(sql);
    res.json({ success: true, message: 'Lookup tables seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/simulate', async (req, res) => {
  try {
    let paymentCount = 0;
    for (let i = 1; i <= 20; i++) {
      const student_id = Math.floor(Math.random() * 120) + 1;
      const amount = 325 + Math.floor(Math.random() * 300);
      const kind_code = ['CARD', 'ACH'][Math.floor(Math.random() * 2)];

      try {
        await db.transaction(async (client) => {
          const termResult = await client.query('SELECT term_id FROM campus.term WHERE code = $1', ['2025FA']);
          if (termResult.rows.length === 0) return;
          const term_id = termResult.rows[0].term_id;

          const walletQuery = 'SELECT wallet_id FROM campus.wallet WHERE owner_type = $1 AND owner_id = $2';
          const walletResult = await client.query(walletQuery, ['STUDENT', student_id]);
          if (walletResult.rows.length === 0) return;
          const wallet_id = walletResult.rows[0].wallet_id;

          await client.query('INSERT INTO campus.receipt(student_id, term_id, wallet_id, kind_code, amount) VALUES ($1, $2, $3, $4, $5)',
            [student_id, term_id, wallet_id, kind_code, amount]);
          await client.query('UPDATE campus.charge SET paid_amt = paid_amt + $1 WHERE student_id = $2 AND term_id = $3',
            [amount, student_id, term_id]);
          await client.query('UPDATE campus.wallet SET balance = balance - $1 WHERE owner_type = $2 AND owner_id = $3 AND balance >= $1',
            [amount, 'STUDENT', student_id]);
          await client.query('UPDATE campus.wallet SET balance = balance + $1 WHERE owner_type = $2 AND owner_id IS NULL',
            [amount, 'COMPANY']);
        });
        paymentCount++;
      } catch (err) {
        console.log(`Payment ${i} failed:`, err.message);
      }
    }
    res.json({ success: true, message: `Simulation complete: ${paymentCount} payments processed` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/browse', async (req, res) => {
  try {
    const { table, limit = 10 } = req.query;
    const allowedTables = ['division', 'hall', 'term', 'unit', 'tutor', 'student', 'pay_kind', 'offering', 'timeslot', 'enrol', 'charge', 'wallet', 'receipt', 'mark_audit'];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ success: false, error: 'Invalid table name' });
    }

    const result = await db.query(`SELECT * FROM campus.${table} LIMIT $1`, [parseInt(limit)]);
    res.json({ success: true, table, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/grades/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await db.query(`
      SELECT e.student_id, e.offering_id, u.code AS course_code, u.name AS course_name,
             t.code AS term, e.grade, e.estatus AS status
      FROM campus.enrol e
      JOIN campus.offering o ON o.offering_id = e.offering_id
      JOIN campus.unit u ON u.unit_id = o.unit_id
      JOIN campus.term t ON t.term_id = o.term_id
      WHERE e.student_id = $1
      ORDER BY t.code DESC, u.code
    `, [student_id]);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/txn/pay-tuition', async (req, res) => {
  try {
    const { student_id, term_code, kind_code, amount } = req.body;

    if (!student_id || !term_code || !kind_code || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await db.transaction(async (client) => {
      const termResult = await client.query('SELECT term_id FROM campus.term WHERE code = $1 FOR UPDATE', [term_code]);
      if (termResult.rows.length === 0) throw new Error(`Term ${term_code} not found`);
      const term_id = termResult.rows[0].term_id;

      const chargeResult = await client.query('SELECT * FROM campus.charge WHERE student_id = $1 AND term_id = $2 FOR UPDATE', [student_id, term_id]);
      if (chargeResult.rows.length === 0) throw new Error(`No charge found for student ${student_id}`);

      const walletQuery = kind_code === 'CASH'
        ? 'SELECT wallet_id FROM campus.wallet WHERE owner_type = $1 AND owner_id IS NULL'
        : 'SELECT wallet_id FROM campus.wallet WHERE owner_type = $1 AND owner_id = $2';
      const walletParams = kind_code === 'CASH' ? ['COMPANY'] : ['STUDENT', student_id];
      const walletResult = await client.query(walletQuery, walletParams);
      if (walletResult.rows.length === 0) throw new Error('Wallet not found');
      const wallet_id = walletResult.rows[0].wallet_id;

      await client.query('INSERT INTO campus.receipt(student_id, term_id, wallet_id, kind_code, amount) VALUES ($1, $2, $3, $4, $5)', [student_id, term_id, wallet_id, kind_code, parseFloat(amount)]);
      await client.query('UPDATE campus.charge SET paid_amt = paid_amt + $1 WHERE student_id = $2 AND term_id = $3', [parseFloat(amount), student_id, term_id]);

      if (kind_code !== 'CASH') {
        const updateResult = await client.query('UPDATE campus.wallet SET balance = balance - $1 WHERE owner_type = $2 AND owner_id = $3 AND balance >= $1', [parseFloat(amount), 'STUDENT', student_id]);
        if (updateResult.rowCount === 0) throw new Error(`Insufficient funds for student ${student_id}`);
        await client.query('UPDATE campus.wallet SET balance = balance + $1 WHERE owner_type = $2 AND owner_id IS NULL', [parseFloat(amount), 'COMPANY']);
      }
    });

    res.json({ success: true, message: `Payment of $${amount} processed` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/txn/post-grade', async (req, res) => {
  try {
    const { student_id, offering_id, tutor_id, grade } = req.body;

    if (!student_id || !offering_id || !tutor_id || !grade) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await db.transaction(async (client) => {
      const enrolResult = await client.query('SELECT grade FROM campus.enrol WHERE student_id = $1 AND offering_id = $2 FOR UPDATE', [student_id, offering_id]);
      if (enrolResult.rows.length === 0) throw new Error(`Enrollment not found for student ${student_id} in offering ${offering_id}`);
      const old_grade = enrolResult.rows[0].grade;

      await client.query('UPDATE campus.enrol SET grade = $1 WHERE student_id = $2 AND offering_id = $3', [grade, student_id, offering_id]);
      await client.query('INSERT INTO campus.mark_audit(student_id, offering_id, old_grade, new_grade, by_tutor) VALUES ($1, $2, $3, $4, $5)', [student_id, offering_id, old_grade, grade, tutor_id]);
    });

    res.json({ success: true, message: `Grade updated to ${grade}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/report/fill', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.offering_id, u.code AS unit_code, t.code AS term_code,
             COUNT(e.student_id) AS enrolled, o.cap,
             FLOOR(100.0 * COUNT(e.student_id) / o.cap) AS pct_full
      FROM campus.offering o
      JOIN campus.unit u ON u.unit_id = o.unit_id
      JOIN campus.term t ON t.term_id = o.term_id
      LEFT JOIN campus.enrol e ON e.offering_id = o.offering_id AND e.estatus='ENROLLED'
      GROUP BY o.offering_id, u.code, t.code, o.cap
      ORDER BY pct_full DESC, o.offering_id
    `);
    res.json({ success: true, report: 'Offering Fill Rate', count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/report/billing', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.code,
             COUNT(c.student_id) AS billed,
             SUM(c.due_amt) AS total_due,
             SUM(c.paid_amt) AS total_paid,
             SUM(c.due_amt - c.paid_amt) AS outstanding
      FROM campus.charge c
      JOIN campus.term t ON t.term_id = c.term_id
      GROUP BY t.code
      ORDER BY t.code
    `);
    res.json({ success: true, report: 'Term Billing Summary', count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/report/balances', async (req, res) => {
  try {
    const { term = '2025FA' } = req.query;
    const result = await db.query(`
      SELECT s.student_id, s.firstn, s.lastn,
             c.due_amt, c.paid_amt, (c.due_amt - c.paid_amt) AS balance
      FROM campus.charge c
      JOIN campus.student s ON s.student_id = c.student_id
      JOIN campus.term t ON t.term_id = c.term_id
      WHERE t.code = $1
      ORDER BY balance DESC, s.lastn
    `, [term]);
    res.json({ success: true, report: `Student Balances (${term})`, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
