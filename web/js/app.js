// Placeholder for JavaScript application logic.

const App = {
  init() {
    const status = document.getElementById("status");
    const browseBtn = document.getElementById("btnBrowse");

    browseBtn.addEventListener("click", () => {
      status.textContent = "Loading...";
      status.style.color = "orange";

      setTimeout(() => {
        status.textContent = "Done!";
        status.style.color = "green";

        // Fake result table
        const mock = [
          { id: 1, name: "Alice", major: "CS" },
          { id: 2, name: "Bob", major: "EE" },
          { id: 3, name: "Cara", major: "Math" },
        ];
        const table = document.createElement("table");
        const head = document.createElement("tr");
        head.innerHTML = "<th>ID</th><th>Name</th><th>Major</th>";
        table.appendChild(head);

        mock.forEach(r => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${r.id}</td><td>${r.name}</td><td>${r.major}</td>`;
          table.appendChild(row);
        });

        document.getElementById("results").innerHTML = ""; // clear previous
        document.getElementById("results").appendChild(table);
      }, 800);
    });
  },
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});