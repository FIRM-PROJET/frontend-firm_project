import ExcelJS from "exceljs";
import html2pdf from "html2pdf.js";

const logo = "/img/logo_firm.jpg";

export const exportToExcel = async (
  nomDevis,
  travaux,
  total,
  maitreOuvrage,
  codeFiche,
  version,
  typeSurface,
  surfaceTotale,
  coursAriary,
  projetReferrent
) => {
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Devis");

  // Conversion du cours Ariary en nombre
  const tauxAriary = parseFloat(coursAriary) || 1;

  // Définition des styles réutilisables
  const headerStyle = {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF514f84" },
    },
    font: {
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
    alignment: { horizontal: "center", vertical: "middle" },
  };

  const totalStyle = {
    ...headerStyle,
    font: { ...headerStyle.font, size: 14 },
  };

  const numberStyle = {
    numFmt: "#,##0.00", // Format numérique avec séparateurs de milliers
  };

  const currencyEurStyle = {
    numFmt: '#,##0.00 "€"',
  };

  const currencyAriaryStyle = {
    numFmt: '#,##0 "Ar"',
  };

  worksheet.columns = [
    { width: 40 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 25 },
  ];

  // --- 1. Logo ---
  const getBase64ImageFromURL = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const base64Logo = await getBase64ImageFromURL("/img/logo_firm.jpg");
  const imageId = workbook.addImage({
    base64: base64Logo,
    extension: "png",
  });
  worksheet.addImage(imageId, {
    tl: { col: 0.8, row: 1 },
    ext: { width: 100, height: 80 },
  });

  // --- 2. Titre principal en GRAS et centré ---
  worksheet.mergeCells("B3:E3");
  const cellTitle = worksheet.getCell("B3");
  cellTitle.value = "FIRM & ARCHITECTURE";
  cellTitle.font = {
    bold: true,
    size: 18,
    name: "Times New Roman', Times, serif",
  };
  cellTitle.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("B5:E5");
  const cellNomDevis = worksheet.getCell("B5");
  cellNomDevis.value = nomDevis;
  cellNomDevis.font = { bold: true, size: 12, name: "Arial" };
  cellNomDevis.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("B6:E6");
  const cellMO = worksheet.getCell("B6");
  cellMO.value = `Maitre d'ouvrage : ${maitreOuvrage}`;
  cellMO.font = { size: 10, name: "Arial" };
  cellMO.alignment = { horizontal: "center", vertical: "middle" };

  // --- 4. Informations complémentaires ---
  const headerInfo = [
    ["Version", version],
    ["Cours Ariary", `${coursAriary} Ar`],
    ["Code fiche", codeFiche],
    ["Date", dateStr],
  ];

  headerInfo.forEach((info, i) => {
    const cell = worksheet.getCell(`F${i + 3}`);
    cell.value = `${info[0]}: ${info[1]}`;
    cell.alignment = { horizontal: "right" };
    cell.font = { size: 10 };
  });

  // --- 5. Informations surface simplifiée ---
  worksheet.addRow([]);
  const surfaceValue = parseFloat(surfaceTotale) || 0;
  const surfaceText = `Type de surface: ${
    typeSurface || "N/A"
  }    |    Surface totale: ${surfaceValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m²`;

  let row = worksheet.addRow([surfaceText, "", "", "", "", ""]);
  row.height = 30;

  // Merger de A à F
  worksheet.mergeCells(`A${row.number}:F${row.number}`);

  // Appliquer le style seulement à la cellule mergée
  const mergedCell = row.getCell(1);
  mergedCell.fill = headerStyle.fill;
  mergedCell.font = headerStyle.font;
  mergedCell.alignment = headerStyle.alignment;

  worksheet.addRow([]);

  // --- 6. En-têtes des colonnes de travaux ---
  const headerRow = worksheet.addRow([
    "DÉSIGNATION",
    "TYPE",
    "MONTANT (€)",
    "MONTANT (AR)",
    "",
    "",
  ]);
  headerRow.height = 25;
  // Appliquer le style seulement aux cellules A-F
  for (let col = 1; col <= 6; col++) {
    const cell = headerRow.getCell(col);
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
  }

  // --- 7. Travaux standards ---
  const standards = travaux.filter((t) => t.type === "standard");
  if (standards.length > 0) {
    standards.forEach((t) => {
      const montantEur = parseFloat(t.montant) || 0;
      const montantAriary = montantEur * tauxAriary;

      const travailRow = worksheet.addRow([
        t.name,
        "Standard",
        montantEur,
        montantAriary,
        "",
        "",
      ]);

      // Appliquer les formats numériques
      travailRow.getCell(3).numFmt = currencyEurStyle.numFmt;
      travailRow.getCell(4).numFmt = currencyAriaryStyle.numFmt;
    });

    const totalStandardEur = standards.reduce(
      (sum, t) => sum + (parseFloat(t.montant) || 0),
      0
    );
    const totalStandardAriary = totalStandardEur * tauxAriary;

    const totalRow = worksheet.addRow([
      "Sous-total standards:",
      "",
      totalStandardEur,
      totalStandardAriary,
      "",
      "",
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(3).numFmt = currencyEurStyle.numFmt;
    totalRow.getCell(4).numFmt = currencyAriaryStyle.numFmt;
  }

  worksheet.addRow([]);

  // --- 8. Travaux personnalisés ---
  const customs = travaux.filter((t) => t.type === "custom");
  if (customs.length > 0) {
    customs.forEach((t) => {
      const montantEur = parseFloat(t.montant) || 0;
      const montantAriary = montantEur * tauxAriary;

      const travailRow = worksheet.addRow([
        t.name,
        "Personnalisé",
        montantEur,
        montantAriary,
        "",
        "",
      ]);

      // Appliquer les formats numériques
      travailRow.getCell(3).numFmt = currencyEurStyle.numFmt;
      travailRow.getCell(4).numFmt = currencyAriaryStyle.numFmt;
    });

    const totalCustomEur = customs.reduce(
      (sum, t) => sum + (parseFloat(t.montant) || 0),
      0
    );
    const totalCustomAriary = totalCustomEur * tauxAriary;

    const totalRow = worksheet.addRow([
      "Sous-total personnalisés:",
      "",
      totalCustomEur,
      totalCustomAriary,
      "",
      "",
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(3).numFmt = currencyEurStyle.numFmt;
    totalRow.getCell(4).numFmt = currencyAriaryStyle.numFmt;
  }

  worksheet.addRow([]);

  // --- 9. Total général stylisé ---
  const totalEur = parseFloat(total) || 0;
  const totalAriary = totalEur * tauxAriary;

  const totalFinalRow = worksheet.addRow([
    "TOTAL ESTIMATION",
    "",
    totalEur,
    totalAriary,
    "",
    "",
  ]);
  totalFinalRow.height = 30;
  worksheet.mergeCells(`A${totalFinalRow.number}:B${totalFinalRow.number}`);
  // Appliquer le style seulement aux cellules A-F
  for (let col = 1; col <= 6; col++) {
    const cell = totalFinalRow.getCell(col);
    cell.fill = totalStyle.fill;
    cell.font = totalStyle.font;
    if (col <= 2) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }
  totalFinalRow.getCell(3).numFmt = currencyEurStyle.numFmt;
  totalFinalRow.getCell(4).numFmt = currencyAriaryStyle.numFmt;

  // --- 10. Ajuster la largeur des colonnes ---
  worksheet.columns = [
    { width: 40 }, // Désignation
    { width: 20 }, // Type
    { width: 20 }, // Montant €
    { width: 20 }, // Montant Ar
    { width: 15 }, // Vide
    { width: 25 }, // Info droite
  ];

  // --- 11. Téléchargement ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${nomDevis || "devis"}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};export const exportToPDF = ({
  nomDevis,
  maitreOuvrage,
  total,
  travaux,
  codeFiche,
  version,
  typeSurface,
  surfaceTotale,
  projetReferrent,
  coursAriary,
}) => {
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const tauxAriary = parseFloat(coursAriary) || 1;

  const container = document.createElement("div");
  container.style.fontFamily = "Times New Roman";
  container.style.padding = "20px";
  container.style.fontSize = "12px";
  container.style.lineHeight = "1.4";
  container.style.color = "#333";

  // En-tête
  const headerTable = document.createElement("table");
  headerTable.style.width = "100%";
  headerTable.style.borderCollapse = "collapse";
  headerTable.style.marginBottom = "20px";
  headerTable.style.border = "2px solid #000";

  headerTable.innerHTML = `
  <tr style="background-color: #fff; color: #514f84;">
    <td style="padding: 15px; width: 15%; text-align: center; vertical-align: middle; border-right: 1px solid #000;">
      <img src="${logo}" style="width: 60px; height: auto; display: block; margin: 0 auto;" alt="Logo" />
    </td>
    <td style="padding: 15px; width: 85%; vertical-align: top; text-align: center; white-space: nowrap;">
      <h1 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #000; white-space: nowrap;">
        FIRM & ARCHITECTURE
      </h1>
      <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 8px; white-space: nowrap;">
        ${nomDevis || "N/A"}
      </div>
      <div style="font-size: 12px; color: #000; margin-bottom: 15px; white-space: nowrap;">
        Maître d'ouvrage : ${maitreOuvrage || "N/A"}
      </div>
      <div style="font-size: 10px; color: #000; text-align: center; white-space: nowrap;">
        <span style="margin-right: 20px;"><strong>Cours Ariary:</strong> ${
          coursAriary || "N/A"
        } Ar</span>
        <span style="margin-right: 20px;"><strong>Code fiche:</strong> ${
          codeFiche || "N/A"
        }</span>
        <span style="margin-right: 20px;"><strong>Version:</strong> ${
          version || "1.0"
        }</span>
        <span><strong>Date:</strong> ${dateStr}</span>
      </div>
    </td>
  </tr>
`;

  // Surface
  const surfaceDiv = document.createElement("div");
  surfaceDiv.style.width = "100%";
  surfaceDiv.style.backgroundColor = "#514f84";
  surfaceDiv.style.color = "white";
  surfaceDiv.style.padding = "15px";
  surfaceDiv.style.textAlign = "center";
  surfaceDiv.style.fontWeight = "bold";
  surfaceDiv.style.fontSize = "14px";
  surfaceDiv.style.marginBottom = "20px";
  surfaceDiv.style.border = "2px solid #514f84";

  const surfaceValuePDF = parseFloat(surfaceTotale) || 0;
  surfaceDiv.innerHTML = `Type de surface: ${
    typeSurface || "N/A"
  } &nbsp;&nbsp;|&nbsp;&nbsp; Surface totale: ${surfaceValuePDF.toLocaleString(
    "fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )} m²`;

  // Table travaux
  const createTravauxTable = (travauxList, title) => {
    if (travauxList.length === 0) return null;

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginBottom = "20px";
    table.style.border = "1px solid #514f84";
    table.style.tableLayout = "fixed"; // Fixe la largeur colonnes

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="background-color: #514f84; color: white;">
        <td colspan="3" style="padding: 10px; text-align: center; font-weight: bold; font-size: 14px; white-space: nowrap;">
          ${title}
        </td>
      </tr>
      <tr style="background-color: white; border-bottom: 1px solid #514f84;">
        <th style="padding: 10px; text-align: left; font-weight: bold; color: #514f84; border-right: 1px solid #514f84; white-space: nowrap;">Désignation</th>
        <th style="padding: 10px; text-align: right; font-weight: bold; color: #514f84; width: 120px; border-right: 1px solid #514f84; white-space: nowrap;">Montant (€)</th>
        <th style="padding: 10px; text-align: right; font-weight: bold; color: #514f84; width: 150px; white-space: nowrap;">Montant (Ar)</th>
      </tr>
    `;

    const tbody = document.createElement("tbody");
    travauxList.forEach((travail, index) => {
      const montantEur = parseFloat(travail.montant) || 0;
      const montantAriary = montantEur * tauxAriary;

      const row = document.createElement("tr");
      row.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
      row.innerHTML = `
        <td style="border-right: 1px solid #514f84; border-bottom: 1px solid #ddd; padding: 8px; white-space: nowrap;">${
          travail.name
        }</td>
        <td style="border-right: 1px solid #514f84; border-bottom: 1px solid #ddd; padding: 8px; text-align: right; white-space: nowrap;">${montantEur.toLocaleString(
          "fr-FR",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )} €</td>
        <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right; white-space: nowrap;">${montantAriary.toLocaleString(
          "fr-FR",
          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        )} Ar</td>
      `;
      tbody.appendChild(row);
    });

    // Sous-total
    const sousTotal = travauxList.reduce(
      (sum, t) => sum + (parseFloat(t.montant) || 0),
      0
    );
    const sousTotalAriary = sousTotal * tauxAriary;
    const sousToolRow = document.createElement("tr");
    sousToolRow.style.backgroundColor = "#514f84";
    sousToolRow.style.color = "white";
    sousToolRow.style.fontWeight = "bold";
    sousToolRow.style.pageBreakInside = "avoid"; // Empêche la coupure page
    sousToolRow.innerHTML = `
      <td style="border-right: 1px solid white; padding: 10px; text-align: right; white-space: nowrap;">
        Sous-total ${title}:
      </td>
      <td style="border-right: 1px solid white; padding: 10px; text-align: right; white-space: nowrap;">
        ${sousTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
      </td>
      <td style="padding: 10px; text-align: right; white-space: nowrap;">
        ${sousTotalAriary.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Ar
      </td>
    `;
    tbody.appendChild(sousToolRow);

    table.appendChild(thead);
    table.appendChild(tbody);

    return table;
  };

  // Séparer travaux
  const travauxStandards = travaux.filter(
    (t) => t.type === "standard" || !t.type
  );
  const travauxPersonnalises = travaux.filter((t) => t.type === "custom");

  // Total
  const totalEur = parseFloat(total) || 0;
  const totalAriary = totalEur * tauxAriary;

  const totalTable = document.createElement("table");
  totalTable.style.width = "100%";
  totalTable.style.borderCollapse = "collapse";
  totalTable.style.marginTop = "20px";
  totalTable.style.border = "2px solid #514f84";
  totalTable.style.tableLayout = "fixed";

  totalTable.innerHTML = `
    <tr 
      style="
        background-color: #514f84; 
        color: white; 
        page-break-inside: avoid;
        font-size: 13px;
        font-weight: bold;
      "
    >
      <td style="padding: 8px; text-align: right; border-right: 1px solid white; white-space: nowrap; width: 60%;">
        TOTAL\u00A0ESTIMATION:
      </td>
      <td style="padding: 8px; text-align: right; border-right: 1px solid white; white-space: nowrap; width: 20%;">
        ${totalEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
      </td>
      <td style="padding: 8px; text-align: right; white-space: nowrap; width: 20%;">
        ${totalAriary.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Ar
      </td>
    </tr>
  `;

  // Assemblage
  container.appendChild(headerTable);
  container.appendChild(surfaceDiv);

  const standardSection = createTravauxTable(
    travauxStandards,
    "TRAVAUX STANDARDS"
  );
  if (standardSection) container.appendChild(standardSection);

  const customSection = createTravauxTable(
    travauxPersonnalises,
    "TRAVAUX PERSONNALISÉS"
  );
  if (customSection) container.appendChild(customSection);

  container.appendChild(totalTable);

  // PDF
  const opt = {
    margin: 0.5,
    filename: `${nomDevis || "devis"}_${dateStr.replace(/\//g, "-")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    },
  };

  html2pdf().set(opt).from(container).save();
};

