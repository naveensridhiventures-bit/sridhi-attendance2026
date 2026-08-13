// src/utils/reportExport.js
// Dependency-free report exports — no jspdf/xlsx packages needed.
//  - Excel: builds a real .xls file using the MS-Office HTML table trick
//    (Excel opens it natively, with real cells/columns, not just text).
//  - PDF: opens a branded, print-styled window and calls window.print(),
//    so the person picks "Save as PDF" in their browser's print dialog —
//    works on every device without a PDF-generation library.

const BRAND = {
  ink: '#0E2418',
  brand500: '#1F9D4C',
  brand600: '#147F3D',
  brand700: '#0F6630',
  brand50: '#EFFBF2',
  brand100: '#D7F4DD',
  gold500: '#E8A317',
  rust: '#E2483D',
  slate: '#64748B'
}

function escapeHtml(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Downloads a real Excel (.xls) file.
 * @param {string} filename  e.g. "Attendance-July-2026.xls"
 * @param {string} title     Sheet title shown as the first row
 * @param {string[]} columns Column headers
 * @param {Array<Array<string|number>>} rows  Row data, same order as columns
 */
export function downloadExcel(filename, title, columns, rows) {
  const headerCells = columns.map(c => `<th style="background:${BRAND.brand600};color:#fff;padding:6px 10px;border:1px solid #ccc;">${escapeHtml(c)}</th>`).join('')
  const bodyRows = rows.map(r =>
    `<tr>${r.map(cell => `<td style="padding:5px 10px;border:1px solid #ddd;">${escapeHtml(cell)}</td>`).join('')}</tr>`
  ).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>${escapeHtml(title).slice(0, 31)}</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head>
    <body>
      <table>
        <tr><td colspan="${columns.length}" style="font-size:16px;font-weight:bold;padding:8px;">${escapeHtml(title)}</td></tr>
        <tr>${headerCells}</tr>
        ${bodyRows}
      </table>
    </body>
    </html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xls') ? filename : filename + '.xls'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Opens a branded, print-ready report and triggers the browser's print
 * dialog (person picks "Save as PDF"). Supports an optional summary-card
 * strip above the table for headline numbers (e.g. Total Payroll, Overall KM).
 *
 * @param {string} title       Big heading, e.g. "Attendance Report — July 2026"
 * @param {string} subtitle    Small line under the heading, e.g. "Sridhi Ventures · Generated 10 Jul 2026"
 * @param {string[]} columns   Column headers
 * @param {Array<Array<string|number>>} rows
 * @param {{label:string, value:string}[]} [summaryCards]  Optional headline stat cards
 */
export function downloadPdf(title, subtitle, columns, rows, summaryCards = []) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups to download the PDF report.')
    return
  }

  const cardsHtml = summaryCards.length ? `
    <div class="cards">
      ${summaryCards.map(c => `
        <div class="card">
          <div class="card-value">${escapeHtml(c.value)}</div>
          <div class="card-label">${escapeHtml(c.label)}</div>
        </div>`).join('')}
    </div>` : ''

  const theadHtml = `<tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`
  const tbodyHtml = rows.map((r, i) =>
    `<tr class="${i % 2 ? 'alt' : ''}">${r.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
  ).join('')

  win.document.write(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: ${BRAND.ink}; margin: 0; padding: 32px; }
        .report-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${BRAND.brand500}; padding-bottom: 14px; margin-bottom: 18px; }
        .report-header h1 { font-size: 20px; margin: 0 0 4px; color: ${BRAND.brand700}; }
        .report-header p { font-size: 12px; margin: 0; color: ${BRAND.slate}; }
        .badge { background: ${BRAND.brand500}; color: #fff; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
        .cards { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .card { flex: 1; min-width: 130px; background: ${BRAND.brand50}; border: 1px solid ${BRAND.brand100}; border-radius: 10px; padding: 12px 14px; }
        .card-value { font-size: 18px; font-weight: 700; color: ${BRAND.brand700}; }
        .card-label { font-size: 10.5px; color: ${BRAND.slate}; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        th { background: ${BRAND.brand600}; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        tr.alt td { background: ${BRAND.brand50}; }
        .footer { margin-top: 24px; font-size: 10px; color: ${BRAND.slate}; text-align: center; }
        @media print { body { padding: 12px; } }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <span class="badge">Sridhi Ventures</span>
      </div>
      ${cardsHtml}
      <table>
        <thead>${theadHtml}</thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
      <p class="footer">Generated by Sridhi Attendance App · ${new Date().toLocaleString('en-IN')}</p>
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  // Small delay so the browser finishes laying out the table before print
  setTimeout(() => win.print(), 300)
}
