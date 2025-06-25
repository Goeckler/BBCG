
if (!localStorage.getItem("user")) {
    window.location.href = "login.html";
}


let daten = [];
let gefiltert = false;
let gespeicherteDaten = {};

fetch('kundendaten.json')
  .then(res => res.json())
  .then(data => {
    daten = data;
    populateDropdown(data);
    loadVerkaufschancen(data);
  });

function populateDropdown(data) {
  const select = document.getElementById('kundenauswahl');
  select.innerHTML = '<option value="">Bitte wählen</option>';
  data.filter(k => !gefiltert || k.Status === 'aktiv')
      .forEach(kunde => {
        const opt = document.createElement('option');
        opt.value = kunde.Kundennummer;
        opt.textContent = kunde.Kundenname;
        select.appendChild(opt);
      });
}

function loadVerkaufschancen(data) {
  const dropdown = document.getElementById('verkaufschance');
  const artikelSet = new Set();
  data.forEach(k => k.Top_Artikel.forEach(a => artikelSet.add(a)));
  [...artikelSet].forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = "Artikel " + a;
    dropdown.appendChild(opt);
  });
}

document.getElementById('kundenauswahl').addEventListener('change', e => {
  const kunde = daten.find(k => k.Kundennummer === e.target.value);
  if (!kunde) return;
  document.getElementById('kundendetails').style.display = 'block';
  document.getElementById('kundenname').textContent = kunde.Kundenname;
  document.getElementById('kundennummer').textContent = kunde.Kundennummer;
  document.getElementById('kundenstatus').textContent = kunde.Status;
  document.getElementById('preisgruppe_alt').textContent = kunde.Preisgruppe_alt;

  const list = document.getElementById('topArtikel');
  list.innerHTML = '';
  kunde.Top_Artikel.forEach((artikel, i) => {
    const li = document.createElement('li');
    li.textContent = `Artikel ${artikel} - Absatz: ${kunde.Absatz_menge[i]}`;
    list.appendChild(li);
  });

  document.getElementById('preisgruppeNeu').value = "";
  document.getElementById('verkaufschance').value = null;
  document.getElementById('kommentar').value = gespeicherteDaten[kunde.Kundennummer]?.kommentar || "";
});

document.getElementById('filterInaktive').addEventListener('click', () => {
  gefiltert = !gefiltert;
  populateDropdown(daten);
});

document.getElementById('speichern').addEventListener('click', () => {
  const kunde = document.getElementById('kundennummer').textContent;
  gespeicherteDaten[kunde] = {
    preisgruppeNeu: document.getElementById('preisgruppeNeu').value,
    verkaufschancen: Array.from(document.getElementById('verkaufschance').selectedOptions).map(o => o.value),
    kommentar: document.getElementById('kommentar').value,
    zeitstempel: new Date().toISOString()
  };
  localStorage.setItem("eingaben", JSON.stringify(gespeicherteDaten));
  alert("Daten gespeichert.");
});

document.getElementById('pdfExport').addEventListener('click', () => {
  alert("PDF-Export wird hier simuliert. Diese Funktion kann mit einer PDF-Library ergänzt werden.");
});

window.onload = () => {
  const gespeicherte = localStorage.getItem("eingaben");
  if (gespeicherte) {
    gespeicherteDaten = JSON.parse(gespeicherte);
  }
};
