
if (!localStorage.getItem("user")) {
    window.location.href = "login.html";
}


let gespeicherteDaten = JSON.parse(localStorage.getItem("eingaben")) || {};
let kundenRaw = [];

fetch('kundendaten.json')
  .then(res => res.json())
  .then(data => {
    kundenRaw = data;
    renderAdminView();
    generateCharts();
  });

function renderAdminView() {
  const container = document.getElementById('adminKundenliste');
  container.innerHTML = '';
  Object.entries(gespeicherteDaten).forEach(([kdnr, daten]) => {
    const kunde = kundenRaw.find(k => k.Kundennummer === kdnr);
    if (!kunde) return;

    const div = document.createElement('div');
    div.className = 'kunde';
    div.innerHTML = `<strong>${kunde.Kundenname}</strong> (${kdnr})<br>
                     Außendienst: ${kunde.Außendienst}<br>
                     Preisgruppe alt: ${kunde.Preisgruppe_alt}<br>
                     Preisgruppe neu: ${daten.preisgruppeNeu || "-"}<br>
                     Verkaufschancen: ${(daten.verkaufschancen || []).join(', ') || "-"}<br>
                     Kommentar: ${daten.kommentar || "-"}<br>
                     Bearbeitet am: ${new Date(daten.zeitstempel).toLocaleString()}<br>
                     <button onclick="archivieren('${kdnr}')">Archivieren</button>`;
    container.appendChild(div);
  });
}

function archivieren(kdnr) {
  gespeicherteDaten[kdnr].archiviert = true;
  localStorage.setItem("eingaben", JSON.stringify(gespeicherteDaten));
  renderAdminView();
}

function generateCharts() {
  const preisgruppen = {};
  const artikelCounter = {};

  Object.values(gespeicherteDaten).forEach(d => {
    if (d.preisgruppeNeu) {
      preisgruppen[d.preisgruppeNeu] = (preisgruppen[d.preisgruppeNeu] || 0) + 1;
    }
    (d.verkaufschancen || []).forEach(a => {
      artikelCounter[a] = (artikelCounter[a] || 0) + 1;
    });
  });

  new Chart(document.getElementById("chartPreisgruppen"), {
    type: 'bar',
    data: {
      labels: Object.keys(preisgruppen),
      datasets: [{
        label: 'Preisgruppenverteilung',
        data: Object.values(preisgruppen),
        borderWidth: 1
      }]
    }
  });

  new Chart(document.getElementById("chartVerkaufschancen"), {
    type: 'bar',
    data: {
      labels: Object.keys(artikelCounter),
      datasets: [{
        label: 'Verkaufschancen (Topartikel)',
        data: Object.values(artikelCounter),
        borderWidth: 1
      }]
    }
  });
}

function exportCSV() {
  let csv = "Kundennummer,Kundenname,Außendienst,Preisgruppe alt,Preisgruppe neu,Verkaufschancen,Zeitstempel\n";
  Object.entries(gespeicherteDaten).forEach(([kdnr, daten]) => {
    const kunde = kundenRaw.find(k => k.Kundennummer === kdnr);
    if (!kunde) return;
    csv += [
      kdnr,
      kunde.Kundenname,
      kunde.Außendienst,
      kunde.Preisgruppe_alt,
      daten.preisgruppeNeu || "-",
      (daten.verkaufschancen || []).join(" | "),
      daten.zeitstempel
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], {type: 'text/csv'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'export.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
