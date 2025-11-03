const API = 'http://localhost:3000/api';

const App = {
  init() {
    document.getElementById('btnCreate').addEventListener('click', () => this.createTables());
    document.getElementById('btnInit').addEventListener('click', () => this.seedLookups());
    document.getElementById('btnSimulate').addEventListener('click', () => this.simulate());
    document.getElementById('btnBrowse').addEventListener('click', () => this.browse());
    document.getElementById('btnPayTuition').addEventListener('click', () => this.showPaymentForm());
    document.getElementById('btnViewGrades').addEventListener('click', () => this.viewGrades());
    document.getElementById('btnPostGrades').addEventListener('click', () => this.showGradeForm());
    document.getElementById('btnReports').addEventListener('click', () => this.runReports());
    document.getElementById('clearResults').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('results').innerHTML = '';
      document.getElementById('inputForm').innerHTML = '';
    });
  },

  async createTables() {
    setStatus('Creating tables...', 'orange');
    try {
      const res = await fetch(`${API}/create-tables`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'green');
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  async seedLookups() {
    setStatus('Seeding lookup tables...', 'orange');
    try {
      const res = await fetch(`${API}/seed-lookups`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'green');
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  async browse() {
    document.getElementById('inputForm').innerHTML = `
      <h3>Browse Tables</h3>
      <label>Select Table:
        <select id="browseTable">
          <option value="student">Students</option>
          <option value="offering">Course Offerings</option>
          <option value="enrol">Enrollments</option>
          <option value="charge">Tuition Charges</option>
          <option value="receipt">Payments</option>
          <option value="wallet">Wallets</option>
        </select>
      </label>
      <button onclick="App.executeBrowse()">Browse</button>
    `;
  },

  async executeBrowse() {
    const table = document.getElementById('browseTable').value;
    setStatus(`Loading ${table}...`, 'orange');
    try {
      const res = await fetch(`${API}/browse?table=${table}&limit=10`);
      const data = await res.json();
      if (data.success) {
        renderTable(data.data);
        setStatus(`Showing ${data.count} rows from ${data.table}`, 'green');
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  async simulate() {
    setStatus('Running simulation (adding 20 payments)...', 'orange');
    try {
      const res = await fetch(`${API}/simulate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'green');
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  showPaymentForm() {
    document.getElementById('inputForm').innerHTML = `
      <h3>Pay Tuition</h3>
      <label>Student ID: <input type="number" id="payStudentId" value="1" /></label><br>
      <label>Term: <input type="text" id="payTerm" value="2025FA" /></label><br>
      <label>Payment Method:
        <select id="payKind">
          <option value="CARD">Credit Card</option>
          <option value="ACH">Bank Transfer</option>
          <option value="CASH">Cash</option>
        </select>
      </label><br>
      <label>Amount: <input type="number" id="payAmount" value="325" /></label><br>
      <button onclick="App.submitPayment()">Submit Payment</button>
    `;
  },

  async submitPayment() {
    const student_id = document.getElementById('payStudentId').value;
    const term_code = document.getElementById('payTerm').value;
    const kind_code = document.getElementById('payKind').value;
    const amount = document.getElementById('payAmount').value;

    setStatus('Processing payment...', 'orange');
    try {
      const res = await fetch(`${API}/txn/pay-tuition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, term_code, kind_code, amount })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'green');
        document.getElementById('inputForm').innerHTML = '';
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  async viewGrades() {
    document.getElementById('inputForm').innerHTML = `
      <h3>View Student Grades</h3>
      <label>Student ID: <input type="number" id="viewStudentId" value="1" /></label>
      <button onclick="App.executeViewGrades()">View My Grades</button>
    `;
  },

  async executeViewGrades() {
    const student_id = document.getElementById('viewStudentId').value;
    setStatus('Loading grades...', 'orange');
    try {
      const res = await fetch(`${API}/grades/${student_id}`);
      const data = await res.json();
      if (data.success) {
        renderTable(data.data);
        setStatus(`Showing grades for student ${student_id}`, 'green');
        document.getElementById('inputForm').innerHTML = '';
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  showGradeForm() {
    document.getElementById('inputForm').innerHTML = `
      <h3>Post Grade (Instructor)</h3>
      <p><em>Tip: First browse "Enrollments" table to see student_id and offering_id</em></p>
      <label>Student ID: <input type="number" id="gradeStudentId" value="1" /></label><br>
      <label>Offering ID: <input type="number" id="gradeOfferingId" value="1" /></label><br>
      <label>Your Tutor ID: <input type="number" id="gradeTutorId" value="1" placeholder="Your instructor ID" /></label><br>
      <label>Grade:
        <select id="gradeValue">
          <option value="A">A</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="F">F</option>
        </select>
      </label><br>
      <button onclick="App.submitGrade()">Post Grade</button>
    `;
  },

  async submitGrade() {
    const student_id = document.getElementById('gradeStudentId').value;
    const offering_id = document.getElementById('gradeOfferingId').value;
    const tutor_id = document.getElementById('gradeTutorId').value;
    const grade = document.getElementById('gradeValue').value;

    setStatus('Posting grade...', 'orange');
    try {
      const res = await fetch(`${API}/txn/post-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, offering_id, tutor_id, grade })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.message, 'green');
        document.getElementById('inputForm').innerHTML = '';
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  },

  async runReports() {
    setStatus('Running reports...', 'orange');
    try {
      const res = await fetch(`${API}/report/fill`);
      const data = await res.json();
      if (data.success) {
        renderTable(data.data);
        setStatus(`Report: ${data.report} (${data.count} rows)`, 'green');
      } else {
        setStatus('Error: ' + data.error, 'red');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
    }
  }
};

function setStatus(msg, color) {
  const status = document.getElementById('status');
  status.textContent = msg;
  status.style.color = color;
}

function renderTable(data) {
  const results = document.getElementById('results');
  results.innerHTML = '';

  if (!data || data.length === 0) {
    results.textContent = 'No results to display.';
    return;
  }

  const table = document.createElement('table');
  const headers = Object.keys(data[0]);
  const thead = document.createElement('tr');
  headers.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    thead.appendChild(th);
  });
  table.appendChild(thead);

  data.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(key => {
      const td = document.createElement('td');
      td.textContent = row[key];
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  results.appendChild(table);
}

window.addEventListener('DOMContentLoaded', () => App.init());
