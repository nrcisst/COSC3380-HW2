const API = 'http://localhost:3000/api';

const App = {
  init() {
    const actions = {
      btnCreate: () => this.apiCall('Creating tables...', '/create-tables', 'POST'),
      btnInit: () => this.apiCall('Seeding lookup tables...', '/seed-lookups', 'POST'),
      btnSimulate: () => this.apiCall('Running simulation (adding 20 payments)...', '/simulate', 'POST'),
      btnBrowse: () => this.browse(),
      btnPayTuition: () => this.showPaymentForm(),
      btnViewGrades: () => this.viewGrades(),
      btnPostGrades: () => this.showGradeForm(),
      btnReports: () => this.runReports(),
      clearResults: () => {
        document.getElementById('results').innerHTML = '';
        document.getElementById('inputForm').innerHTML = '';
        document.getElementById('app').classList.remove('show');
      }
    };
    Object.entries(actions).forEach(([id, handler]) =>
      document.getElementById(id).addEventListener('click', handler)
    );
  },

  async apiCall(statusMsg, endpoint, method = 'GET', body = null) {
    setStatus(statusMsg, 'orange');
    try {
      const options = { method };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const res = await fetch(`${API}${endpoint}`, options);
      const data = await res.json();
      setStatus(data.success ? data.message : 'Error: ' + data.error, data.success ? 'green' : 'red');
      return data;
    } catch (err) {
      setStatus('Error: ' + err.message, 'red');
      return { success: false };
    }
  },

  browse() {
    this.showForm('Browse Tables', `
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
    `);
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

  showPaymentForm() {
    this.showForm('Pay Tuition', `
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
    `);
  },

  async submitPayment() {
    const body = {
      student_id: document.getElementById('payStudentId').value,
      term_code: document.getElementById('payTerm').value,
      kind_code: document.getElementById('payKind').value,
      amount: document.getElementById('payAmount').value
    };
    const data = await this.apiCall('Processing payment...', '/txn/pay-tuition', 'POST', body);
    if (data.success) document.getElementById('inputForm').innerHTML = '';
  },

  viewGrades() {
    this.showForm('View Student Grades', `
      <label>Student ID: <input type="number" id="viewStudentId" value="1" /></label>
      <button onclick="App.executeViewGrades()">View My Grades</button>
    `);
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
    this.showForm('Post Grade (Instructor)', `
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
    `);
  },

  async submitGrade() {
    const body = {
      student_id: document.getElementById('gradeStudentId').value,
      offering_id: document.getElementById('gradeOfferingId').value,
      tutor_id: document.getElementById('gradeTutorId').value,
      grade: document.getElementById('gradeValue').value
    };
    const data = await this.apiCall('Posting grade...', '/txn/post-grade', 'POST', body);
    if (data.success) document.getElementById('inputForm').innerHTML = '';
  },

  showForm(title, content) {
    document.getElementById('inputForm').innerHTML = `<h3>${title}</h3>${content}`;
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
  document.getElementById('app').classList.add('show');
}

function renderTable(data) {
  const results = document.getElementById('results');
  if (!data?.length) {
    results.textContent = 'No results to display.';
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => `<tr>${headers.map(key => `<td>${row[key]}</td>`).join('')}</tr>`).join('');
  results.innerHTML = `<table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows}</table>`;
}

window.addEventListener('DOMContentLoaded', () => App.init());
