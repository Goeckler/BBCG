
let artikelpreise = {};
let kundenabsatz = {};

fetch("artikelpreise.json").then(r => r.json()).then(d => {
  artikelpreise = d;
  return fetch("kundenabsatz.json");
}).then(r => r.json()).then(d => {
  kundenabsatz = d;
  init();
});

function init() {
  const auswahl = document.getElementById("kundenauswahl");
  for (const [kdnr, kdata] of Object.entries(kundenabsatz)) {
    const opt = document.createElement("option");
    opt.value = kdnr;
    opt.textContent = kdata.kundenname;
    auswahl.appendChild(opt);
  }
  auswahl.addEventListener("change", render);
  document.getElementById("preisgruppeNeu").addEventListener("change", render);
  document.getElementById("pdfExport").addEventListener("click", exportPDF);
}

function render() {
  const kdnr = document.getElementById("kundenauswahl").value;
  const pgNeu = document.getElementById("preisgruppeNeu").value;
  if (!kdnr || !pgNeu) return;

  const k = kundenabsatz[kdnr];
  const pgAlt = k.preisgruppe_alt;
  document.getElementById("vergleich").style.display = "block";
  document.getElementById("kundenkopf").textContent = `${k.kundenname} (aktuell: ${pgAlt}, Ziel: ${pgNeu})`;

  const tbody = document.getElementById("tabelle");
  tbody.innerHTML = "";
  const chartLabels = [];
  const chartDeltas = [];
  let sumAlt = 0, sumNeu = 0;

  Object.entries(k.artikel).sort((a,b)=>b[1]-a[1]).forEach(([aid, menge]) => {
    const p = artikelpreise[aid];
    const preisAlt = p.preise[pgAlt];
    const preisNeu = p.preise[pgNeu];
    const prognoseId = `prog-${aid}`;
    const prognoseMenge = parseFloat(document.getElementById(prognoseId)?.value || menge);
    const ua = preisAlt * menge;
    const un = preisNeu * prognoseMenge;
    const delta = un - ua;
    const dp = ua > 0 ? ((delta / ua) * 100).toFixed(1) : "–";

    sumAlt += ua;
    sumNeu += un;
    chartLabels.push(p.name);
    chartDeltas.push(delta.toFixed(2));

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.name}</td>
      <td>${menge}</td>
      <td><input type='number' id='${prognoseId}' value='${prognoseMenge}' min='0'></td>
      <td>${preisAlt.toFixed(2)} €</td>
      <td>${preisNeu.toFixed(2)} €</td>
      <td>${ua.toFixed(2)} €</td>
      <td>${un.toFixed(2)} €</td>
      <td>${delta.toFixed(2)} €</td>
      <td>${dp} %</td>`;
    tbody.appendChild(row);
    row.querySelector("input").addEventListener("input", render);
  });

  const tf = document.getElementById("summenzeile");
  const diff = sumNeu - sumAlt;
  const diffp = sumAlt > 0 ? ((diff / sumAlt) * 100).toFixed(1) : "–";
  tf.innerHTML = `<tr><td colspan="5">Gesamt</td><td>${sumAlt.toFixed(2)} €</td><td>${sumNeu.toFixed(2)} €</td><td>${diff.toFixed(2)} €</td><td>${diffp} %</td></tr>`;

  new Chart(document.getElementById("chart"), {
    type: 'bar',
    data: {
      labels: chartLabels.slice(0, 10),
      datasets: [{
        label: 'Umsatzdifferenz (€)',
        data: chartDeltas.slice(0, 10),
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function exportPDF() {
  html2pdf().from(document.getElementById("vergleich")).save("kundenanalyse.pdf");
}
