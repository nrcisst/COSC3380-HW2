const App = {
  init() {
    const status = document.getElementById("status");
    const browseBtn = document.getElementById("btnBrowse");

    browseBtn.addEventListener("click", () => {
      status.textContent = "Loading...";
      status.style.color = "orange";

      const mockRows = [
        { id: 1, name: "Alice", major: "CS" },
        { id: 2, name: "Bob", major: "EE" },
        { id: 3, name: "Cara", major: "Math" },
      ];

      setTimeout(() => {
        renderTable(mockRows);
        status.textContent = "Done!";
        status.style.color = "green";
      }, 500);
    });

    document.getElementById("clearResults")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("results").innerHTML = "";
    });


  },
};

// Simple helper to render any array of objects as a table inside #results
function renderTable(data) {
  const results = document.getElementById("results");
  results.innerHTML = ""; // clear previous results

  if (!data || data.length === 0) {
    results.textContent = "No results to display.";
    return;
  }

  // create table + header
  const table = document.createElement("table");
  const headers = Object.keys(data[0]);
  const thead = document.createElement("tr");
  headers.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    thead.appendChild(th);
  });
  table.appendChild(thead);

  // rows
  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(key => {
      const td = document.createElement("td");
      td.textContent = row[key];
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  results.appendChild(table);
}

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

