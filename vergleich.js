
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
    Object.entries(kundenabsatz).forEach(([kdnr, info]) => {
        const opt = document.createElement("option");
        opt.value = kdnr;
        opt.textContent = info.kundenname;
        select.appendChild(opt);
    });

    select.addEventListener("change", updateView);
    document.getElementById("preisgruppeNeu").addEventListener("change", updateView);
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
        const umsatzAlt = preisAlt * menge;
        const umsatzNeu = preisNeu * menge;
        const diff = umsatzNeu - umsatzAlt;
        const diffProzent = ((diff / umsatzAlt) * 100).toFixed(1);

        sumAlt += umsatzAlt;
        sumNeu += umsatzNeu;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td>${menge}</td>
            <td>${preisAlt.toFixed(2)} €</td>
            <td>${umsatzAlt.toFixed(2)} €</td>
            <td>${preisNeu.toFixed(2)} €</td>
            <td>${umsatzNeu.toFixed(2)} €</td>
            <td>${diff.toFixed(2)} €</td>
            <td>${diffProzent} %</td>
        `;
        tbody.appendChild(row);
    });

    const foot = document.createElement("tr");
    const diffGesamt = sumNeu - sumAlt;
    const diffGesamtProzent = ((diffGesamt / sumAlt) * 100).toFixed(1);
    foot.innerHTML = `
        <td colspan="3">Gesamt</td>
        <td>${sumAlt.toFixed(2)} €</td>
        <td></td>
        <td>${sumNeu.toFixed(2)} €</td>
        <td>${diffGesamt.toFixed(2)} €</td>
        <td>${diffGesamtProzent} %</td>
    `;
    tfoot.appendChild(foot);
}
