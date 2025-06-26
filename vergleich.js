
let artikelpreise = {};
let kundenabsatz = {};

fetch('artikelpreise.json')
  .then(res => res.json())
  .then(data => {
    artikelpreise = data;
    return fetch('kundenabsatz.json');
  })
  .then(res => res.json())
  .then(data => {
    kundenabsatz = data;
    initDropdown();
  });

function initDropdown() {
    const select = document.getElementById("kundenauswahl");
    select.innerHTML = '<option value="">Bitte wählen</option>';
    Object.entries(kundenabsatz).forEach(([kdnr, info]) => {
        const opt = document.createElement("option");
        opt.value = kdnr;
        opt.textContent = info.kundenname;
        select.appendChild(opt);
    });

    select.addEventListener("change", updateView);
    document.getElementById("preisgruppeNeu").addEventListener("change", updateView);
    document.getElementById("pdfExport").addEventListener("click", exportPDF);
}

function updateView() {
    const kdnr = document.getElementById("kundenauswahl").value;
    const neueGruppe = document.getElementById("preisgruppeNeu").value;
    if (!kdnr || !neueGruppe) return;

    const kunde = kundenabsatz[kdnr];
    const gruppeAlt = kunde.preisgruppe_alt;

    document.getElementById("vergleichsbereich").style.display = "block";
    document.getElementById("kundenkopf").textContent = `${kunde.kundenname} (aktuell: ${gruppeAlt}, Ziel: ${neueGruppe})`;

    const tbody = document.getElementById("vergleichstabelle");
    const tfoot = document.getElementById("summenbereich");
    tbody.innerHTML = "";
    tfoot.innerHTML = "";

    let sumAlt = 0;
    let sumNeu = 0;

    Object.entries(kunde.artikel).sort((a,b)=>b[1]-a[1]).forEach(([artnr, menge]) => {
        const daten = artikelpreise[artnr];
        const name = daten.name;
        const preisAlt = daten.preise[gruppeAlt];
        const preisNeu = daten.preise[neueGruppe];

        const eingabeId = `prognose-${artnr}`;
        const prognoseInput = `<input type='number' id='${eingabeId}' value='${menge}' min='0' style='width:60px;'>`;

        const umsatzAlt = preisAlt * menge;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td>${menge}</td>
            <td>${prognoseInput}</td>
            <td>${preisAlt.toFixed(2)} €</td>
            <td>${preisNeu.toFixed(2)} €</td>
            <td id="ua-${artnr}"></td>
            <td id="un-${artnr}"></td>
            <td id="d-${artnr}"></td>
            <td id="p-${artnr}"></td>
        `;
        tbody.appendChild(row);

        document.getElementById(eingabeId).addEventListener("input", () => updateView());
    });

    // Rechnen mit aktualisierten Werten
    Object.entries(kunde.artikel).forEach(([artnr, menge]) => {
        const daten = artikelpreise[artnr];
        const gruppeAlt = kunde.preisgruppe_alt;
        const gruppeNeu = document.getElementById("preisgruppeNeu").value;
        const preisAlt = daten.preise[gruppeAlt];
        const preisNeu = daten.preise[gruppeNeu];
        const inputVal = parseFloat(document.getElementById(`prognose-${artnr}`).value) || 0;

        const umsatzAlt = preisAlt * menge;
        const umsatzNeu = preisNeu * inputVal;
        const diff = umsatzNeu - umsatzAlt;
        const diffProzent = umsatzAlt > 0 ? ((diff / umsatzAlt) * 100).toFixed(1) : "–";

        sumAlt += umsatzAlt;
        sumNeu += umsatzNeu;

        document.getElementById(`ua-${artnr}`).textContent = umsatzAlt.toFixed(2) + " €";
        document.getElementById(`un-${artnr}`).textContent = umsatzNeu.toFixed(2) + " €";
        document.getElementById(`d-${artnr}`).textContent = diff.toFixed(2) + " €";
        document.getElementById(`p-${artnr}`).textContent = diffProzent + " %";
    });

    const foot = document.createElement("tr");
    const diffGesamt = sumNeu - sumAlt;
    const diffGesamtProzent = sumAlt > 0 ? ((diffGesamt / sumAlt) * 100).toFixed(1) : "–";
    foot.innerHTML = `
        <td colspan="3">Gesamt</td>
        <td colspan="1">${sumAlt.toFixed(2)} €</td>
        <td></td>
        <td>${sumNeu.toFixed(2)} €</td>
        <td>${diffGesamt.toFixed(2)} €</td>
        <td>${diffGesamtProzent} %</td>
    `;
    tfoot.appendChild(foot);
}

function exportPDF() {
    const element = document.getElementById("vergleichsbereich");
    const opt = {
        margin: 0.5,
        filename: 'kundenvergleich.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
