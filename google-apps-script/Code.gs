/**
 * SRIDHI VENTURES — ATTENDANCE BACKEND v3.1
 * Matches exact sheet format:
 *   Attendance: SNO | Employee Name | 01-Jun-26 | 02-Jun-26 | ... (horizontal grid)
 *   Salary:     S.No | Employee Name | Monthly Salary | Advance | Total Days |
 *               P Count | A Count | WO Count | WOP Count | Paid Days |
 *               Per Day Salary | Gross Salary | Net Salary | Warning
 *   Logs:       S.No | Date | Time | EmployeeID | Name | Role | Type | Status |
 *               Marked By | Latitude | Longitude | Map Link | Timestamp
 *               (one permanent tab — every attendance mark ever made, newest on top)
 *
 * Tab names: "June-2026 Attendance", "June-2026 Salary", "June-2026 permission", "Leave_Requests", "Logs"
 *
 * SETUP:
 * 1. Replace SHEET_ID below with your Sheet ID.
 * 2. Deploy as Web App (Execute as Me, Anyone can access).
 * 3. Paste Web App URL into src/api/sheetApi.js as WEB_APP_URL.
 */

const SHEET_ID = '1GJ65SjLMMBzhfWhhLABh0UEYIb-arpbrniPK_egoFoU'
const TZ = 'Asia/Kolkata'
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const LOGS_SHEET_NAME = 'Logs'

// Status colors
const COLORS = {
  P:   '#00FF00',  // Green
  A:   '#FF0000',  // Red
  WO:  '#FFFF00',  // Yellow
  WOP: '#9900FF',  // Purple
  NA:  '#4169E1'   // Blue
}

// ─── JSONP-enabled routing ────────────────────────────────────────────────────

// Actions that don't touch monthly Attendance/Salary/Permission tabs at
// all — skipping ensureMonthlyTabs() for these cuts a real chunk of
// latency off every quick call (announcements, logins, hero image, etc),
// which was previously paying the same cost as attendance-heavy actions.
const LIGHTWEIGHT_ACTIONS = new Set([
  'getAnnouncement', 'setAnnouncement', 'clearAnnouncement',
  'getHeroImage', 'setHeroImage',
  'dashboardLogin', 'hrLogin',
  'getHrWhatsappNumber', 'setHrWhatsappNumber',
  'verifyAttendancePassword', 'setAttendancePassword',
  'addDeduction', 'getDeductionsForEmployee', 'getAllDeductionsForMonth', 'deleteDeduction', 'updateDeduction',
  'addDriverKm', 'getDriverKmLogs', 'getDriverKmSummary', 'deleteDriverKmEntry', 'updateDriverKmEntry'
])

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback

  function respond(obj) {
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
    }
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
  }

  if (!e || !e.parameter || !e.parameter.action) {
    const msg = 'Sridhi Ventures Attendance API v3.1 — OK'
    if (callback) return ContentService.createTextOutput(callback + '({"ok":true})').setMimeType(ContentService.MimeType.JAVASCRIPT)
    return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT)
  }

  let body = {}
  try { body = e.parameter.payload ? JSON.parse(e.parameter.payload) : {} } catch (_) { body = {} }
  body.action = e.parameter.action

  try {
    if (!LIGHTWEIGHT_ACTIONS.has(body.action)) ensureMonthlyTabs()
    return respond(route_(body))
  } catch (err) {
    return respond({ success: false, message: err.message })
  }
}

function doPost(e) {
  let body
  try { body = JSON.parse(e.postData.contents) } catch (_) { return jsonOut({ success: false, message: 'Invalid JSON' }) }
  try {
    ensureMonthlyTabs()
    return jsonOut(route_(body))
  } catch (err) {
    return jsonOut({ success: false, message: err.message })
  }
}

function route_(body) {
  const a = body.action
  if (a === 'getEmployees')          return getEmployees(body.type)
  if (a === 'getAllEmployeesFull')    return getAllEmployeesFull()
  if (a === 'addEmployee')           return addEmployee(body.employee)
  if (a === 'updateEmployee')        return updateEmployee(body.employeeId, body.updates)
  if (a === 'updateSalary')          return updateSalary(body.employeeId, body.salary)
  if (a === 'updateAdvance')         return updateAdvance(body.employeeId, body.advance)
  if (a === 'getEmployeeById')       return getEmployeeById(body.employeeId)
  if (a === 'markAttendance')        return markAttendance(body)
  if (a === 'markAttendanceBulk')    return markAttendanceBulk(body)
  if (a === 'markAttendanceForDate') return markAttendanceForDate(body)
  if (a === 'getAttendanceForDate')  return getAttendanceForDate(body)
  if (a === 'getTodaySummary')       return getTodaySummary()
  if (a === 'getMonthlyAttendance')  return getMonthlyAttendance(body.employeeId, body.year, body.month)
  if (a === 'getAttendanceHistory')  return getAttendanceHistory(body.employeeId)
  if (a === 'getMonthlySalary')      return getMonthlySalary(body.year, body.month)
  if (a === 'getEmployeeSalary')     return getEmployeeSalary(body.employeeId, body.year, body.month)
  if (a === 'getLogs')               return getLogs(body.limit, body.employeeId)
  if (a === 'dashboardLogin')        return dashboardLogin(body.employeeId, body.password)
  if (a === 'applyLeave')            return applyLeave(body.request)
  if (a === 'getLeaveRequests')      return getLeaveRequests(body.employeeId)
  if (a === 'getAllLeaveRequests')    return getAllLeaveRequests(body.status)
  if (a === 'updateLeaveStatus')     return updateLeaveStatus(body.requestId, body.status, body.remarks)
  if (a === 'getHeroImage')          return getHeroImage()
  if (a === 'setHeroImage')          return setHeroImage(body.imageUrl, body.caption)
  if (a === 'getAnnouncement')       return getAnnouncement()
  if (a === 'setAnnouncement')       return setAnnouncement(body.message, body.type, body.authorName)
  if (a === 'clearAnnouncement')     return clearAnnouncement()
  if (a === 'getMonthlyTabsList')    return getMonthlyTabsList()
  if (a === 'getAbsenteesToday')     return getAbsenteesToday()
  if (a === 'getHrWhatsappNumber')   return getHrWhatsappNumber()
  if (a === 'setHrWhatsappNumber')   return setHrWhatsappNumber(body.number)
  if (a === 'verifyAttendancePassword') return verifyAttendancePassword(body.password)
  if (a === 'setAttendancePassword') return setAttendancePassword(body.password)
  if (a === 'addDeduction')          return addDeduction(body.entry)
  if (a === 'getDeductionsForEmployee') return getDeductionsForEmployee(body.employeeId, body.year, body.month)
  if (a === 'getAllDeductionsForMonth') return getAllDeductionsForMonth(body.year, body.month)
  if (a === 'deleteDeduction')       return deleteDeduction(body.entryId)
  if (a === 'updateDeduction')       return updateDeduction(body.entryId, body.updates)
  if (a === 'addDriverKm')           return addDriverKm(body.entry)
  if (a === 'getDriverKmLogs')       return getDriverKmLogs(body.employeeId, body.fromDate, body.toDate)
  if (a === 'getDriverKmSummary')    return getDriverKmSummary()
  if (a === 'deleteDriverKmEntry')   return deleteDriverKmEntry(body.entryId)
  if (a === 'updateDriverKmEntry')   return updateDriverKmEntry(body.entryId, body.entry)
  if (a === 'getPermissionsForMonth') return getPermissionsForMonth(body.year, body.month)
  if (a === 'getPermissionsForEmployeeMonth') return getPermissionsForEmployeeMonth(body.employeeId, body.year, body.month)
  if (a === 'updatePermissionStatus') return updatePermissionStatus(body.requestId, body.year, body.month, body.status, body.remarks)
  if (a === 'deletePermissionEntry') return deletePermissionEntry(body.requestId, body.year, body.month)
  return { success: false, message: 'Unknown action: ' + a }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// ─── Manual edits in the sheet ─────────────────────────────────────────────────
// Fires automatically whenever someone hand-edits a cell in Google Sheets
// (typing P/A/WO/WOP/NA directly, pasting a column, etc). The app's own
// writes (setValue/setValues from Code.gs) do NOT re-trigger this, so
// there's no risk of a loop — this only catches edits made by a human in
// the UI, which previously had no effect on the Salary tab at all.
function onEdit(e) {
  try {
    if (!e || !e.range) return // manual run from the editor, not a real edit — nothing to do
    const sheet = e.range.getSheet()
    const name = sheet.getName()
    if (e.range.getRow() === 1) return // ignore header-row edits everywhere

    if (name.endsWith(' Attendance')) {
      const label = name.slice(0, -(' Attendance').length) // e.g. "July-2026"
      const [monthName, yearStr] = label.split('-')
      const month = FULL_MONTHS.indexOf(monthName) + 1
      const year = parseInt(yearStr, 10)
      if (!month || !year) return
      syncSalarySheet_(year, month)
      return
    }

    if (name.endsWith(' Salary')) {
      // e.g. someone typed a new Advance amount directly into a Salary
      // tab — recalculate that same month so Net Salary reflects it.
      const label = name.slice(0, -(' Salary').length)
      const [monthName, yearStr] = label.split('-')
      const month = FULL_MONTHS.indexOf(monthName) + 1
      const year = parseInt(yearStr, 10)
      if (!month || !year) return
      syncSalarySheet_(year, month)
      return
    }

    if (name === 'Employees') {
      // Someone changed a monthly salary figure on the master Employees
      // list. Refresh the CURRENT month's Salary tab so it picks up the
      // new figure — past/closed months are left as historical record
      // and don't get retroactively rewritten by a later salary change.
      const ym = currentYM()
      syncSalarySheet_(ym.year, ym.month)
      return
    }
  } catch (err) {
    // Never let a sync error break the person's manual edit
    console.error('onEdit sync failed: ' + err)
  }
}

function getSS() { return SpreadsheetApp.openById(SHEET_ID) }

// ─── Month helpers ────────────────────────────────────────────────────────────

function currentYM() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// "June-2026"
function monthTabLabel(year, month) {
  return FULL_MONTHS[month - 1] + '-' + year
}

// "01-Jun-26"
function dateColLabel(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0')
  const m = SHORT_MONTHS[dateObj.getMonth()]
  const y = String(dateObj.getFullYear()).slice(-2)
  return d + '-' + m + '-' + y
}

// Google Sheets sometimes auto-detects a header string like "01-Aug-26" as
// an actual date and silently converts the cell to a Date object instead
// of keeping the literal text. A plain .indexOf(todayLabel) then never
// matches (Date !== string) and every date-column lookup in this file
// would fail for that column. This checks both possible forms so it finds
// the column either way.
function findDateColIdx_(headerRow, dateObj) {
  const label = dateColLabel(dateObj)
  for (let i = 2; i < headerRow.length; i++) {
    const cell = headerRow[i]
    const cellLabel = (cell instanceof Date) ? dateColLabel(cell) : String(cell || '').trim()
    if (cellLabel === label) return i
  }
  return -1
}

// Diagnostic helper — run this once from the editor (select it in the
// function dropdown, click Run, then View > Logs) if "Date column not
// found" ever comes back. Shows exactly what's stored in the header row.
function debugDateColumn() {
  const ym = currentYM()
  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  if (!sh) { Logger.log('No Attendance sheet found for ' + attTabName(ym.year, ym.month)); return }

  const now = new Date()
  Logger.log('Server "now": ' + now)
  Logger.log('Server today label (dateColLabel): ' + dateColLabel(now))
  Logger.log('Sheet timezone: ' + getSS().getSpreadsheetTimeZone())
  Logger.log('Script TZ constant: ' + TZ)

  const headers = sh.getRange(1, 1, 1, 8).getValues()[0]
  headers.forEach((h, i) => {
    Logger.log('Header[' + i + '] = ' + JSON.stringify(h) + '  |  typeof=' + typeof h + '  |  isDate=' + (h instanceof Date))
  })

  const idx = findDateColIdx_(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], now)
  Logger.log('findDateColIdx_ result: ' + idx)
}

function todayStr() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')
}

function timeStr() {
  return Utilities.formatDate(new Date(), TZ, 'HH:mm:ss')
}

function fmtDate(d) {
  if (!d) return ''
  if (typeof d === 'string') return d
  return Utilities.formatDate(new Date(d), TZ, 'yyyy-MM-dd')
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function workingDaysInMonth(year, month) {
  // Use the real number of calendar days in the month (28/29/30/31) so
  // Per Day Salary = Monthly Salary / actual days — a 31-day month like
  // August or January should divide by 31, not a fixed 30.
  return daysInMonth(year, month)
}

// ─── Tab naming ───────────────────────────────────────────────────────────────

function attTabName(year, month)  { return monthTabLabel(year, month) + ' Attendance' }
function salTabName(year, month)  { return monthTabLabel(year, month) + ' Salary' }
function permTabName(year, month) { return monthTabLabel(year, month) + ' permission' }

// ─── Auto Monthly Tab Creation ────────────────────────────────────────────────

function ensureMonthlyTabs(year, month) {
  const ym = (year && month) ? { year, month } : currentYM()
  const y = ym.year, m = ym.month
  const ss = getSS()

  // Attendance tab — horizontal format
  if (!ss.getSheetByName(attTabName(y, m))) {
    createAttendanceTab_(ss, y, m)
  }

  // Salary tab
  if (!ss.getSheetByName(salTabName(y, m))) {
    createSalaryTab_(ss, y, m)
  }

  // Permission tab
  if (!ss.getSheetByName(permTabName(y, m))) {
    const sh = ss.insertSheet(permTabName(y, m))
    sh.appendRow(['RequestID','EmployeeID','Employee Name','Date','Hours','Reason','Status','AppliedAt','Remarks'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 9)
  }

  // Leave_Requests — permanent global tab
  if (!ss.getSheetByName('Leave_Requests')) {
    const sh = ss.insertSheet('Leave_Requests')
    sh.appendRow(['RequestID','EmployeeID','Employee Name','Type','FromDate','ToDate','Reason','Status','AppliedAt','Remarks'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 10)
  }

  // Logs — permanent global tab, ensured up front
  getLogsSheet_()
}

function createAttendanceTab_(ss, year, month) {
  const sh = ss.insertSheet(attTabName(year, month))
  const totalDays = daysInMonth(year, month)

  // Headers: SNO | Employee Name | 01-Jun-26 | 02-Jun-26 | ...
  const headers = ['SNO', 'Employee Name']
  for (let d = 1; d <= totalDays; d++) {
    headers.push(dateColLabel(new Date(year, month - 1, d)))
  }
  sh.appendRow(headers)
  sh.setFrozenRows(1)
  sh.setFrozenColumns(2)

  // Style header row
  const headerRange = sh.getRange(1, 1, 1, headers.length)
  headerRange.setBackground('#FFFF00').setFontWeight('bold').setHorizontalAlignment('center')

  // Column widths
  sh.setColumnWidth(1, 50)
  sh.setColumnWidth(2, 160)
  for (let d = 3; d <= headers.length; d++) sh.setColumnWidth(d, 70)

  // Add existing employees as rows
  addEmployeeRowsToAttSheet_(sh, year, month)
  return sh
}

function addEmployeeRowsToAttSheet_(sh, year, month) {
  const empSh = getSS().getSheetByName('Employees')
  if (!empSh) return
  const vals = empSh.getDataRange().getValues()
  if (vals.length < 2) return
  const employees = rows2obj_(vals)

  employees.forEach((e, idx) => {
    const row = [idx + 1, e.Name]
    sh.appendRow(row)
  })
}

function createSalaryTab_(ss, year, month) {
  const sh = ss.insertSheet(salTabName(year, month))
  const headers = ['S.No','Employee Name','Monthly Salary','Advance','Total Days',
    'P Count','A Count','WO Count','WOP Count','Paid Days',
    'Per Day Salary','Gross Salary','Net Salary','Warning','NA Count']
  sh.appendRow(headers)
  sh.setFrozenRows(1)
  formatHeader_(sh, headers.length)

  // Populate from employees
  const empSh = getSS().getSheetByName('Employees')
  if (empSh) {
    const vals = empSh.getDataRange().getValues()
    if (vals.length >= 2) {
      rows2obj_(vals).forEach((e, idx) => {
        const monthly = parseFloat(e.Salary) || 0
        const workDays = workingDaysInMonth(year, month)
        const perDay = workDays > 0 ? monthly / workDays : 0
        sh.appendRow([idx + 1, e.Name, monthly, 0, workDays, 0, 0, 0, 0, 0,
          perDay, 0, 0, 'OK', 0])
      })
    }
  }
  return sh
}

function formatHeader_(sh, cols) {
  sh.getRange(1, 1, 1, cols)
    .setBackground('#FFFF00').setFontWeight('bold').setHorizontalAlignment('center')
}

function onMonthStart() {
  const ym = currentYM()
  ensureMonthlyTabs(ym.year, ym.month)
}

function getMonthlyTabsList() {
  const ss = getSS()
  const names = ss.getSheets().map(s => s.getName())
  const months = []
  names.forEach(n => {
    const m = n.match(/^(\w+-\d{4}) Attendance$/)
    if (m) months.push(m[1])
  })
  return { success: true, months: months.sort().reverse() }
}

// ─── Deductions Ledger (Advance / Penalty / Gas / Food / Rice / Custom) ────────
// One permanent sheet holding every deduction entry ever made, across all
// months. This is the single source of truth for the "Advance" figure in
// the Salary sheet — syncSalarySheet_() sums this ledger per employee per
// month and writes the total into the Salary tab's Advance column, so Net
// Salary always reflects it automatically without any separate step.

function ensureDeductionsSheet_() {
  const ss = getSS()
  let sh = ss.getSheetByName('Deductions')
  if (!sh) {
    sh = ss.insertSheet('Deductions')
    sh.appendRow(['EntryID', 'EmployeeID', 'Employee Name', 'Date', 'Category', 'Note', 'Amount', 'Added By', 'CreatedAt'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 9)
  }
  return sh
}

function addDeduction(entry) {
  if (!entry || !entry.employeeId || !entry.date || !entry.category || !(parseFloat(entry.amount) > 0)) {
    return { success: false, message: 'Employee, date, category and a positive amount are required' }
  }
  const sh = ensureDeductionsSheet_()
  const id = 'DED-' + Date.now()
  sh.appendRow([
    id, entry.employeeId, entry.name || '', entry.date, entry.category,
    entry.note || '', parseFloat(entry.amount) || 0, entry.addedBy || '', new Date()
  ])
  // Resync that month's Salary tab right away so Net Salary reflects the
  // new advance/deduction immediately, instead of waiting for the next
  // attendance mark to happen to trigger a sync.
  const d = new Date(entry.date)
  syncSalarySheet_(d.getFullYear(), d.getMonth() + 1)
  return { success: true, entryId: id }
}

function deleteDeduction(entryId) {
  const sh = getSS().getSheetByName('Deductions')
  if (!sh) return { success: false, message: 'No deductions recorded yet' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(entryId)) {
      const entryDate = vals[i][3]
      sh.deleteRow(i + 1)
      const d = new Date(entryDate)
      syncSalarySheet_(d.getFullYear(), d.getMonth() + 1)
      return { success: true }
    }
  }
  return { success: false, message: 'Entry not found' }
}

// Edits an existing ledger row in place (date / category / note / amount).
// EmployeeID + Employee Name are kept as originally recorded — if the entry
// needs to move to a different employee, delete it and add a fresh one.
function updateDeduction(entryId, updates) {
  if (!entryId || !updates) return { success: false, message: 'Entry ID and updates are required' }
  if (!updates.date || !updates.category || !(parseFloat(updates.amount) > 0)) {
    return { success: false, message: 'Date, category and a positive amount are required' }
  }
  const sh = getSS().getSheetByName('Deductions')
  if (!sh) return { success: false, message: 'No deductions recorded yet' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(entryId)) {
      const oldDate = vals[i][3]
      // Columns: Date(4) Category(5) Note(6) Amount(7)
      sh.getRange(i + 1, 4, 1, 4).setValues([[
        updates.date, updates.category, updates.note || '', parseFloat(updates.amount) || 0
      ]])
      // Resync the Salary tab right away. If the date was moved to a
      // different month, resync both months so neither one is left stale.
      const oldD = new Date(oldDate)
      const newD = new Date(updates.date)
      syncSalarySheet_(oldD.getFullYear(), oldD.getMonth() + 1)
      if (oldD.getFullYear() !== newD.getFullYear() || oldD.getMonth() !== newD.getMonth()) {
        syncSalarySheet_(newD.getFullYear(), newD.getMonth() + 1)
      }
      return { success: true }
    }
  }
  return { success: false, message: 'Entry not found' }
}

function _deductionRows() {
  const sh = getSS().getSheetByName('Deductions')
  if (!sh) return []
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return []
  return rows2obj_(vals).map(r => ({
    entryId: r.EntryID, employeeId: String(r.EmployeeID), name: r['Employee Name'],
    date: fmtDate(r.Date), category: r.Category, note: r.Note,
    amount: parseFloat(r.Amount) || 0, addedBy: r['Added By']
  }))
}

function getDeductionsForEmployee(employeeId, year, month) {
  const ym = (year && month) ? { year, month } : currentYM()
  const rows = _deductionRows().filter(r => {
    if (String(r.employeeId) !== String(employeeId)) return false
    const d = new Date(r.date)
    return d.getFullYear() === ym.year && (d.getMonth() + 1) === ym.month
  }).sort((a, b) => a.date < b.date ? 1 : -1)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return { success: true, entries: rows, total }
}

function getAllDeductionsForMonth(year, month) {
  const ym = (year && month) ? { year, month } : currentYM()
  const rows = _deductionRows().filter(r => {
    const d = new Date(r.date)
    return d.getFullYear() === ym.year && (d.getMonth() + 1) === ym.month
  }).sort((a, b) => a.date < b.date ? 1 : -1)
  return { success: true, entries: rows }
}

// Sums this ledger per normalized employee name for a given month —
// called from syncSalarySheet_() so Net Salary always reflects every
// Advance/Penalty/Gas/Food/Rice/Custom entry on file.
function deductionTotalsByName_(year, month) {
  const totals = {}
  _deductionRows().forEach(r => {
    const d = new Date(r.date)
    if (d.getFullYear() !== year || (d.getMonth() + 1) !== month) return
    const key = normName_(r.name)
    if (!key) return
    totals[key] = (totals[key] || 0) + r.amount
  })
  return totals
}

// ─── Driver KM Ledger ───────────────────────────────────────────────────────────
// One permanent sheet — every trip, any driver, any lease vehicle, ever
// logged. Trip KM is computed server-side (End − Start) so it can never
// drift from what's actually stored.

function ensureDriverKmSheet_() {
  const ss = getSS()
  let sh = ss.getSheetByName('DriverKM')
  if (!sh) {
    sh = ss.insertSheet('DriverKM')
    sh.appendRow(['EntryID', 'Date', 'EmployeeID', 'Driver Name', 'Vehicle', 'Start KM', 'End KM', 'Trip KM', 'Notes', 'Added By', 'CreatedAt'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 11)
  }
  return sh
}

function addDriverKm(entry) {
  if (!entry || !entry.employeeId || !entry.date) {
    return { success: false, message: 'Driver and date are required' }
  }
  const startKm = parseFloat(entry.startKm)
  const endKm = parseFloat(entry.endKm)
  if (isNaN(startKm) || isNaN(endKm)) return { success: false, message: 'Start KM and End KM must be numbers' }
  if (endKm < startKm) return { success: false, message: 'End KM cannot be less than Start KM' }
  const tripKm = Math.round((endKm - startKm) * 100) / 100

  const sh = ensureDriverKmSheet_()
  const id = 'KM-' + Date.now()
  sh.appendRow([
    id, entry.date, entry.employeeId, entry.name || '', entry.vehicle || '',
    startKm, endKm, tripKm, entry.notes || '', entry.addedBy || '', new Date()
  ])
  return { success: true, entryId: id, tripKm }
}

function deleteDriverKmEntry(entryId) {
  const sh = getSS().getSheetByName('DriverKM')
  if (!sh) return { success: false, message: 'No driver KM entries yet' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(entryId)) {
      sh.deleteRow(i + 1)
      return { success: true }
    }
  }
  return { success: false, message: 'Entry not found' }
}

// Edits an existing trip in place (same row, same EntryID) rather than
// deleting + re-adding — keeps the row position and CreatedAt intact,
// and recomputes Trip KM server-side so it can never drift from what's
// actually saved, same as when the entry was first added.
function updateDriverKmEntry(entryId, entry) {
  const sh = getSS().getSheetByName('DriverKM')
  if (!sh) return { success: false, message: 'No driver KM entries yet' }
  const startKm = parseFloat(entry.startKm)
  const endKm = parseFloat(entry.endKm)
  if (isNaN(startKm) || isNaN(endKm)) return { success: false, message: 'Start KM and End KM must be numbers' }
  if (endKm < startKm) return { success: false, message: 'End KM cannot be less than Start KM' }
  const tripKm = Math.round((endKm - startKm) * 100) / 100

  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(entryId)) {
      sh.getRange(i + 1, 2, 1, 8).setValues([[
        entry.date, entry.employeeId, entry.name || '', entry.vehicle || '',
        startKm, endKm, tripKm, entry.notes || ''
      ]])
      return { success: true, tripKm }
    }
  }
  return { success: false, message: 'Entry not found' }
}

function _driverKmRows() {
  const sh = getSS().getSheetByName('DriverKM')
  if (!sh) return []
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return []
  return rows2obj_(vals).map(r => ({
    entryId: r.EntryID, date: fmtDate(r.Date), employeeId: String(r.EmployeeID),
    name: r['Driver Name'], vehicle: r.Vehicle,
    startKm: parseFloat(r['Start KM']) || 0, endKm: parseFloat(r['End KM']) || 0,
    tripKm: parseFloat(r['Trip KM']) || 0, notes: r.Notes, addedBy: r['Added By']
  }))
}

function getDriverKmLogs(employeeId, fromDate, toDate) {
  let rows = _driverKmRows()
  if (employeeId) rows = rows.filter(r => String(r.employeeId) === String(employeeId))
  if (fromDate) rows = rows.filter(r => r.date >= fromDate)
  if (toDate) rows = rows.filter(r => r.date <= toDate)
  rows.sort((a, b) => a.date < b.date ? 1 : (a.date > b.date ? -1 : 0))
  return { success: true, entries: rows }
}

// Overall KM per driver, across every vehicle they've ever driven —
// exactly what a "driver name + lease vehicle km, overall" report needs.
function getDriverKmSummary() {
  const rows = _driverKmRows()
  const byDriver = {}
  rows.forEach(r => {
    const key = r.employeeId || normName_(r.name)
    if (!byDriver[key]) {
      byDriver[key] = { employeeId: r.employeeId, name: r.name, trips: 0, totalKm: 0, vehicles: new Set(), lastDate: '', lastEndKm: 0 }
    }
    const d = byDriver[key]
    d.trips++
    d.totalKm += r.tripKm
    if (r.vehicle) d.vehicles.add(r.vehicle)
    if (!d.lastDate || r.date > d.lastDate) { d.lastDate = r.date; d.lastEndKm = r.endKm }
  })
  const summary = Object.values(byDriver).map(d => ({
    employeeId: d.employeeId, name: d.name, trips: d.trips,
    totalKm: Math.round(d.totalKm * 100) / 100,
    vehicles: Array.from(d.vehicles), lastDate: d.lastDate, lastEndKm: d.lastEndKm
  })).sort((a, b) => b.totalKm - a.totalKm)
  return { success: true, summary }
}

// ─── Employees ────────────────────────────────────────────────────────────────

function getEmpSheet() { return getSS().getSheetByName('Employees') }

function rows2obj_(values) {
  const h = values[0]
  return values.slice(1).filter(r => r[0]).map(r => {
    const o = {}; h.forEach((k, i) => o[k] = r[i]); return o
  })
}

function toBool_(v) { return v === true || String(v).toUpperCase() === 'TRUE' }

function getEmployees(type) {
  const sh = getEmpSheet()
  if (!sh) return { success: true, employees: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, employees: [] }

  let emps = rows2obj_(vals).map(e => ({
    employeeId: String(e.EmployeeID),
    name: e.Name, type: e.Type, isHR: toBool_(e.IsHR),
    phone: e.Phone, role: e.Role, joinDate: fmtDate(e.JoinDate)
  }))
  if (type) emps = emps.filter(e => e.type === type)

  // today's status from horizontal attendance sheet
  const ym = currentYM()
  const attSh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  const todayRecs = {}
  if (attSh) {
    const av = attSh.getDataRange().getValues()
    if (av.length > 1) {
      const dateColIdx = findDateColIdx_(av[0], new Date())
      if (dateColIdx > -1) {
        av.slice(1).forEach(row => {
          const empName = String(row[1])
          const status = row[dateColIdx]
          if (status) todayRecs[empName] = status
        })
      }
    }
  }

  return {
    success: true,
    employees: emps.map(e => ({ ...e, todayStatus: todayRecs[e.name] || null }))
  }
}

function getAllEmployeesFull() {
  const sh = getEmpSheet()
  if (!sh) return { success: true, employees: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, employees: [] }
  return {
    success: true,
    employees: rows2obj_(vals).map(e => ({
      employeeId: String(e.EmployeeID), name: e.Name, type: e.Type,
      isHR: toBool_(e.IsHR), phone: e.Phone, role: e.Role,
      joinDate: fmtDate(e.JoinDate), salary: e.Salary || ''
    }))
  }
}

function getEmployeeById(employeeId) {
  const sh = getEmpSheet()
  if (!sh) return { success: false, message: 'Employees sheet not found' }
  const found = rows2obj_(sh.getDataRange().getValues())
    .find(e => String(e.EmployeeID) === String(employeeId))
  if (!found) return { success: false, message: 'Employee not found' }
  return {
    success: true, employee: {
      employeeId: String(found.EmployeeID), name: found.Name,
      type: found.Type, isHR: toBool_(found.IsHR),
      phone: found.Phone, role: found.Role,
      joinDate: fmtDate(found.JoinDate), salary: found.Salary || ''
    }
  }
}

function addEmployee(employee) {
  if (!employee?.name || !employee?.type) return { success: false, message: 'Name and type required' }
  const id = generateId_(employee.type)
  const pwd = Math.floor(100000 + Math.random() * 900000).toString()
  const sh = getEmpSheet()
  sh.appendRow([id, employee.name, employee.type, !!employee.isHR,
    employee.phone || '', employee.role || '', employee.joinDate || '',
    employee.salary || '', pwd, new Date()])

  // Add employee row to current month's attendance sheet
  const ym = currentYM()
  const attSh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  if (attSh) {
    const lastRow = attSh.getLastRow()
    attSh.appendRow([lastRow, employee.name])
  }

  // Add employee row to current month's salary sheet
  const salSh = getSS().getSheetByName(salTabName(ym.year, ym.month))
  if (salSh) {
    const lastRow = salSh.getLastRow()
    const monthly = parseFloat(employee.salary) || 0
    const workDays = workingDaysInMonth(ym.year, ym.month)
    const perDay = workDays > 0 ? monthly / workDays : 0
    salSh.appendRow([lastRow, employee.name, monthly, 0, workDays, 0, 0, 0, 0, 0, perDay, 0, 0, 'OK'])
  }

  return { success: true, employeeId: id, password: pwd }
}

function updateEmployee(employeeId, updates) {
  const sh = getEmpSheet()
  const vals = sh.getDataRange().getValues()
  const hdrs = vals[0]
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(employeeId)) {
      Object.keys(updates || {}).forEach(k => {
        const ci = hdrs.indexOf(k)
        if (ci > -1) sh.getRange(i + 1, ci + 1).setValue(updates[k])
      })
      return { success: true }
    }
  }
  return { success: false, message: 'Employee not found' }
}

function updateSalary(employeeId, salary) {
  const res = updateEmployee(employeeId, { Salary: salary })
  if (res.success) {
    const ym = currentYM()
    syncSalarySheet_(ym.year, ym.month)
  }
  return res
}

function updateAdvance(employeeId, advance) {
  // Updates advance in the salary sheet directly
  const ym = currentYM()
  const salSh = getSS().getSheetByName(salTabName(ym.year, ym.month))
  if (!salSh) return { success: false, message: 'Salary sheet not found' }
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return empRes
  const empName = empRes.employee.name
  const vals = salSh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][1]) === empName) {
      salSh.getRange(i + 1, 4).setValue(parseFloat(advance) || 0) // Column D = Advance
      // Recalculate Net Salary
      const gross = parseFloat(vals[i][11]) || 0
      const adv = parseFloat(advance) || 0
      salSh.getRange(i + 1, 13).setValue(Math.max(gross - adv, 0)) // Column M = Net Salary
      return { success: true }
    }
  }
  return { success: false, message: 'Employee not found in salary sheet' }
}

function generateId_(type) {
  const sh = getSS().getSheetByName('Counters')
  if (!sh) {
    const newSh = getSS().insertSheet('Counters')
    newSh.appendRow(['Type', 'LastNumber'])
    newSh.appendRow(['office', 0])
    newSh.appendRow(['production', 0])
  }
  const cSh = getSS().getSheetByName('Counters')
  const vals = cSh.getDataRange().getValues()
  const prefix = type === 'office' ? 'SV-OFC-' : 'SV-PRD-'
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === type) {
      const next = Number(vals[i][1]) + 1
      cSh.getRange(i + 1, 2).setValue(next)
      return prefix + String(next).padStart(4, '0')
    }
  }
  cSh.appendRow([type, 1])
  return prefix + '0001'
}

// ─── Logs (permanent, one row per attendance mark ever made) ─────────────────

function getLogsSheet_() {
  const ss = getSS()
  let sh = ss.getSheetByName(LOGS_SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(LOGS_SHEET_NAME)
    sh.appendRow(['S.No','Date','Time','EmployeeID','Name','Role','Type','Status','Marked By','Latitude','Longitude','Map Link','Timestamp'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 13)
    sh.setColumnWidth(1, 50)
    sh.setColumnWidth(5, 150)
    sh.setColumnWidth(12, 220)
  }
  return sh
}

// Appends one row per attendance mark. Newest entries are inserted right
// under the header so the log always reads latest-first.
function appendAttendanceLog_(entry) {
  const sh = getLogsSheet_()
  const lat = entry.latitude !== '' && entry.latitude != null ? entry.latitude : ''
  const lng = entry.longitude !== '' && entry.longitude != null ? entry.longitude : ''
  const mapLink = (lat !== '' && lng !== '') ? ('https://maps.google.com/?q=' + lat + ',' + lng) : ''

  const lastRow = sh.getLastRow()
  const sno = lastRow // header is row 1, so lastRow count = next serial number
  sh.insertRowAfter(1)
  sh.getRange(2, 1, 1, 13).setValues([[
    sno, entry.date, entry.time, entry.employeeId, entry.name, entry.role || '',
    entry.type || '', entry.status, entry.markedBy || 'Self', lat, lng, '', entry.timestamp
  ]])
  if (mapLink) {
    sh.getRange(2, 12).setFormula('=HYPERLINK("' + mapLink + '","View on map")')
  }
}

function getLogs(limit, employeeId) {
  const sh = getSS().getSheetByName(LOGS_SHEET_NAME)
  if (!sh) return { success: true, logs: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, logs: [] }
  let logs = rows2obj_(vals).map(r => ({
    sno: r['S.No'], date: r.Date, time: r.Time, employeeId: String(r.EmployeeID),
    name: r.Name, role: r.Role, type: r.Type, status: r.Status,
    markedBy: r['Marked By'], latitude: r.Latitude, longitude: r.Longitude,
    timestamp: r.Timestamp
  }))
  if (employeeId) logs = logs.filter(l => String(l.employeeId) === String(employeeId))
  const n = limit ? Number(limit) : 200
  return { success: true, logs: logs.slice(0, n) }
}

// ─── Attendance (horizontal grid) ────────────────────────────────────────────

function markAttendance(body) {
  const { employeeId, status, mode, supervisorName, location } = body
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return { success: false, message: 'Employee ID not found / Invalid QR' }
  const emp = empRes.employee

  const ym = currentYM()
  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  if (!sh) return { success: false, message: 'Attendance sheet not ready' }

  const todayLabel = dateColLabel(new Date())
  const allVals = sh.getDataRange().getValues()
  const headers = allVals[0]

  // Find date column
  const dateColIdx = findDateColIdx_(headers, new Date())
  if (dateColIdx === -1) return { success: false, message: 'Date column not found: ' + todayLabel }

  // Find employee row by name
  let empRowIdx = -1
  for (let i = 1; i < allVals.length; i++) {
    if (normName_(allVals[i][1]) === normName_(emp.name)) {
      empRowIdx = i
      break
    }
  }

  // If employee not in sheet yet, add them
  if (empRowIdx === -1) {
    sh.appendRow([allVals.length, emp.name])
    empRowIdx = allVals.length
  }

  const finalStatus = (status || 'present').toUpperCase()
  const displayStatus = finalStatus === 'PRESENT' ? 'P' : finalStatus === 'ABSENT' ? 'A' :
    finalStatus === 'WEEKOFF' ? 'WO' : finalStatus === 'WOP' ? 'WOP' : finalStatus === 'NA' ? 'NA' : finalStatus

  // Write to cell (row is 1-indexed in sheet, +1 for header)
  const cell = sh.getRange(empRowIdx + 1, dateColIdx + 1)
  cell.setValue(displayStatus)

  // Apply color
  const color = COLORS[displayStatus] || '#FFFFFF'
  cell.setBackground(color)
  cell.setHorizontalAlignment('center')
  cell.setFontWeight('bold')

  const nowTime = timeStr()

  // Permanent Logs tab — every mark, ever, with name/role/location/date/time
  appendAttendanceLog_({
    date: todayStr(),
    time: nowTime,
    employeeId: employeeId,
    name: emp.name,
    role: emp.role || '',
    type: emp.type || '',
    status: displayStatus,
    markedBy: mode === 'manual' && supervisorName ? supervisorName : (mode || 'Self'),
    latitude: location?.lat || '',
    longitude: location?.lng || '',
    timestamp: new Date()
  })

  // Recalculate salary
  syncSalarySheet_(ym.year, ym.month)

  return { success: true, employeeName: emp.name, time: nowTime }
}

function markAttendanceBulk(body) {
  const { entries, mode, supervisorName, location } = body
  if (!entries || !entries.length) return { success: false, message: 'No entries provided' }

  const ym = currentYM()
  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  if (!sh) return { success: false, message: 'Attendance sheet not ready' }

  const todayLabel = dateColLabel(new Date())
  const allVals = sh.getDataRange().getValues()
  const headers = allVals[0]
  const dateColIdx = findDateColIdx_(headers, new Date())
  if (dateColIdx === -1) return { success: false, message: 'Date column not found: ' + todayLabel }

  // Build a name -> row index map once
  const nameToRow = {}
  for (let i = 1; i < allVals.length; i++) {
    nameToRow[normName_(allVals[i][1])] = i
  }

  const nowTime = timeStr()
  const okNames = []
  const failed = []
  const logEntries = []

  entries.forEach(entry => {
    const empRes = getEmployeeById(entry.employeeId)
    if (!empRes.success) { failed.push({ employeeId: entry.employeeId, message: 'Employee not found' }); return }
    const emp = empRes.employee

    let rowIdx = nameToRow[normName_(emp.name)]
    if (rowIdx === undefined) {
      sh.appendRow([allVals.length, emp.name])
      rowIdx = sh.getLastRow() - 1
      nameToRow[normName_(emp.name)] = rowIdx
    }

    const finalStatus = (entry.status || 'present').toUpperCase()
    const displayStatus = finalStatus === 'PRESENT' ? 'P' : finalStatus === 'ABSENT' ? 'A' :
      finalStatus === 'WEEKOFF' ? 'WO' : finalStatus === 'WOP' ? 'WOP' : finalStatus === 'NA' ? 'NA' : finalStatus

    const cell = sh.getRange(rowIdx + 1, dateColIdx + 1)
    cell.setValue(displayStatus)
    cell.setBackground(COLORS[displayStatus] || '#FFFFFF')
    cell.setHorizontalAlignment('center')
    cell.setFontWeight('bold')

    logEntries.push({
      date: todayStr(),
      time: nowTime,
      employeeId: entry.employeeId,
      name: emp.name,
      role: emp.role || '',
      type: emp.type || '',
      status: displayStatus,
      markedBy: mode === 'manual' && supervisorName ? supervisorName : (mode || 'Self'),
      latitude: location?.lat || '',
      longitude: location?.lng || '',
      timestamp: new Date()
    })

    okNames.push(emp.name)
  })

  logEntries.forEach(appendAttendanceLog_)

  // Recalculate salary ONCE for the whole batch, not once per employee
  syncSalarySheet_(ym.year, ym.month)

  return { success: true, marked: okNames, failed: failed, time: nowTime }
}

// Lets HR correct or backfill attendance for ANY date — past or future —
// not just today. Used by the "Edit Attendance" tool in HR Admin where
// they pick a date and one or more workers.
function markAttendanceForDate(body) {
  const { date, entries, markedBy } = body
  if (!date) return { success: false, message: 'No date provided' }
  if (!entries || !entries.length) return { success: false, message: 'No entries provided' }

  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return { success: false, message: 'Invalid date' }
  const year = d.getFullYear()
  const month = d.getMonth() + 1

  const ss = getSS()
  ensureMonthlyTabs(year, month) // make sure that month's tabs exist even if it's not the current month
  const sh = ss.getSheetByName(attTabName(year, month))
  if (!sh) return { success: false, message: 'Could not prepare Attendance sheet for ' + attTabName(year, month) }

  const allVals = sh.getDataRange().getValues()
  const headers = allVals[0]
  const dateColIdx = findDateColIdx_(headers, d)
  if (dateColIdx === -1) return { success: false, message: 'Date column not found: ' + dateColLabel(d) }

  const nameToRow = {}
  for (let i = 1; i < allVals.length; i++) {
    nameToRow[normName_(allVals[i][1])] = i
  }

  const nowTime = timeStr()
  const okNames = []
  const failed = []
  const logEntries = []

  entries.forEach(entry => {
    const empRes = getEmployeeById(entry.employeeId)
    if (!empRes.success) { failed.push({ employeeId: entry.employeeId, message: 'Employee not found' }); return }
    const emp = empRes.employee

    let rowIdx = nameToRow[normName_(emp.name)]
    if (rowIdx === undefined) {
      sh.appendRow([allVals.length, emp.name])
      rowIdx = sh.getLastRow() - 1
      nameToRow[normName_(emp.name)] = rowIdx
    }

    const finalStatus = (entry.status || 'present').toUpperCase()
    const displayStatus = finalStatus === 'PRESENT' ? 'P' : finalStatus === 'ABSENT' ? 'A' :
      finalStatus === 'WEEKOFF' ? 'WO' : finalStatus === 'WOP' ? 'WOP' : finalStatus === 'NA' ? 'NA' : finalStatus

    const cell = sh.getRange(rowIdx + 1, dateColIdx + 1)
    cell.setValue(displayStatus)
    cell.setBackground(COLORS[displayStatus] || '#FFFFFF')
    cell.setHorizontalAlignment('center')
    cell.setFontWeight('bold')

    logEntries.push({
      date: date,
      time: nowTime,
      employeeId: entry.employeeId,
      name: emp.name,
      role: emp.role || '',
      type: emp.type || '',
      status: displayStatus,
      markedBy: 'HR: ' + (markedBy || 'Admin') + ' (edited for ' + date + ')',
      latitude: '',
      longitude: '',
      timestamp: new Date()
    })

    okNames.push(emp.name)
  })

  logEntries.forEach(appendAttendanceLog_)

  // Recalculate salary for whichever month that date falls in
  syncSalarySheet_(year, month)

  return { success: true, marked: okNames, failed: failed, date: date }
}

// Returns { employeeId: status } for every employee on a given date, so
// the HR "Edit Attendance for a Date" tool can show what's already marked
// before someone changes it — same idea as todayStatus on getEmployees(),
// but for any date instead of only today.
function getAttendanceForDate(body) {
  const { date } = body
  if (!date) return { success: false, message: 'No date provided' }

  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return { success: false, message: 'Invalid date' }
  const year = d.getFullYear()
  const month = d.getMonth() + 1

  const empSh = getEmpSheet()
  const empVals = empSh ? empSh.getDataRange().getValues() : [[]]
  const emps = empVals.length > 1 ? rows2obj_(empVals) : []
  const idByName = {}
  emps.forEach(e => { idByName[normName_(e.Name)] = String(e.EmployeeID) })

  const sh = getSS().getSheetByName(attTabName(year, month))
  const statusByEmployeeId = {}
  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) {
      const dateColIdx = findDateColIdx_(vals[0], d)
      if (dateColIdx > -1) {
        vals.slice(1).forEach(row => {
          const empId = idByName[normName_(row[1])]
          const status = row[dateColIdx]
          if (empId && status) statusByEmployeeId[empId] = String(status)
        })
      }
    }
  }

  return { success: true, date: date, statusByEmployeeId: statusByEmployeeId }
}

function getTodaySummary() {
  const ym = currentYM()
  const empSh = getEmpSheet()
  const empVals = empSh ? empSh.getDataRange().getValues() : [[]]
  const employees = empVals.length > 1 ? rows2obj_(empVals) : []
  const officeTotal = employees.filter(e => e.Type === 'office').length
  const productionTotal = employees.filter(e => e.Type === 'production').length

  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  let officePresent = 0, productionPresent = 0

  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) {
      const dateColIdx = findDateColIdx_(vals[0], new Date())
      if (dateColIdx > -1) {
        // Build employee type map
        const typeMap = {}
        employees.forEach(e => typeMap[e.Name.toLowerCase().trim()] = e.Type)
        vals.slice(1).forEach(row => {
          const status = String(row[dateColIdx] || '').toUpperCase()
          if (status === 'P') {
            const name = String(row[1]).toLowerCase().trim()
            const empType = typeMap[name] || ''
            if (empType === 'office') officePresent++
            else if (empType === 'production') productionPresent++
          }
        })
      }
    }
  }

  return {
    success: true, officeTotal, productionTotal,
    officePresent, productionPresent,
    officeAbsent: Math.max(officeTotal - officePresent, 0),
    productionAbsent: Math.max(productionTotal - productionPresent, 0)
  }
}

// ─── Absentee WhatsApp Alerts ──────────────────────────────────────────────

function getAbsenteesToday() {
  const ym = currentYM()
  const empSh = getEmpSheet()
  const empVals = empSh ? empSh.getDataRange().getValues() : [[]]
  const employees = empVals.length > 1 ? rows2obj_(empVals) : []

  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  const statusMap = {}

  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) {
      const dateColIdx = findDateColIdx_(vals[0], new Date())
      if (dateColIdx > -1) {
        vals.slice(1).forEach(row => {
          const name = String(row[1]).toLowerCase().trim()
          statusMap[name] = String(row[dateColIdx] || '').toUpperCase()
        })
      }
    }
  }

  const absentees = employees
    .map(e => {
      const status = statusMap[String(e.Name || '').toLowerCase().trim()] || ''
      return {
        employeeId: String(e.EmployeeID), name: e.Name, phone: e.Phone || '',
        type: e.Type, status: status, statusLabel: status === 'A' ? 'Marked Absent' : 'Not Checked In'
      }
    })
    .filter(e => e.status === 'A' || e.status === '')

  return { success: true, date: todayStr(), absentees, count: absentees.length }
}

function getHrWhatsappNumber() {
  const row = settingsGet('hrWhatsappNumber')
  return { success: true, number: row ? row.value : '' }
}

function setHrWhatsappNumber(number) {
  settingsSet('hrWhatsappNumber', number || '', '')
  return { success: true }
}

// ─── Attendance password (gate on the Attendance page) ─────────────────────
// Stored in the Settings sheet under key 'attendancePassword'. Falls back to
// '1234' until HR sets a real one from the HR Dashboard so the app never
// locks everyone out before a password has been configured.
const DEFAULT_ATTENDANCE_PASSWORD = '1234'

function verifyAttendancePassword(password) {
  const row = settingsGet('attendancePassword')
  const stored = row && row.value ? String(row.value) : DEFAULT_ATTENDANCE_PASSWORD
  return { success: true, valid: String(password || '') === stored }
}

function setAttendancePassword(password) {
  const pw = String(password || '').trim()
  if (!pw) return { success: false, message: 'Password cannot be empty' }
  settingsSet('attendancePassword', pw, '')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────

function getMonthlyAttendance(employeeId, year, month) {
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return { success: true, days: [] }
  const empName = empRes.employee.name

  const sh = getSS().getSheetByName(attTabName(year, month))
  const days = []
  const totalDays = daysInMonth(year, month)

  if (sh) {
    const vals = sh.getDataRange().getValues()
    const headers = vals[0]
    let empRow = null
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][1]).toLowerCase().trim() === empName.toLowerCase().trim()) {
        empRow = vals[i]; break
      }
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d)
      const ds = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      const colIdx = findDateColIdx_(headers, dateObj)
      const status = empRow && colIdx > -1 ? String(empRow[colIdx] || '').toUpperCase() : null
      const normalized = status === 'P' ? 'present' : status === 'A' ? 'absent' :
        status === 'WO' ? 'weekoff' : status === 'WOP' ? 'wop' : status === 'NA' ? 'na' : null
      days.push({ date: ds, status: normalized })
    }
  } else {
    for (let d = 1; d <= totalDays; d++) {
      const ds = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      days.push({ date: ds, status: null })
    }
  }
  return { success: true, days }
}

function getAttendanceHistory(employeeId) {
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return { success: true, history: [] }
  const empName = empRes.employee.name
  const history = []
  const ym = currentYM()

  for (let offset = 0; offset < 3; offset++) {
    let m = ym.month - offset, y = ym.year
    if (m <= 0) { m += 12; y-- }
    const sh = getSS().getSheetByName(attTabName(y, m))
    if (!sh) continue
    const vals = sh.getDataRange().getValues()
    const headers = vals[0]
    let empRow = null
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][1]).toLowerCase().trim() === empName.toLowerCase().trim()) {
        empRow = vals[i]; break
      }
    }
    if (!empRow) continue
    const totalDays = daysInMonth(y, m)
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(y, m - 1, d)
      const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      const colIdx = findDateColIdx_(headers, dateObj)
      const s = empRow && colIdx > -1 ? String(empRow[colIdx] || '') : ''
      if (s) {
        const normalized = s === 'P' ? 'present' : s === 'A' ? 'absent' :
          s === 'WO' ? 'weekoff' : s === 'WOP' ? 'wop' : 'na'
        history.push({ date: ds, status: normalized })
      }
    }
  }
  history.sort((a, b) => a.date < b.date ? 1 : -1)
  return { success: true, history: history.slice(0, 60) }
}

// ─── Salary Calculation ───────────────────────────────────────────────────────

function normName_(name) {
  return String(name || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function syncSalarySheet_(year, month) {
  const salSh = getSS().getSheetByName(salTabName(year, month))
  const attSh = getSS().getSheetByName(attTabName(year, month))
  if (!salSh || !attSh) return

  // Self-heal: older salary tabs created before the "NA Count" column existed
  // won't have it — add it so every month's data stays complete and consistent.
  if (String(salSh.getRange(1, 15).getValue() || '') !== 'NA Count') {
    salSh.getRange(1, 15).setValue('NA Count')
    formatHeader_(salSh, 15)
  }

  const attVals = attSh.getDataRange().getValues()
  const attHeaders = attVals[0]
  const workDays = workingDaysInMonth(year, month)
  let salVals = salSh.getDataRange().getValues()

  // Self-heal: add a Salary row for any employee who exists in the Employees
  // sheet (or already has an Attendance row) but is missing from the Salary
  // sheet — otherwise sync has nowhere to write their numbers and they stay
  // blank forever, no matter how many times attendance gets marked.
  const existingNames = new Set(salVals.slice(1).map(r => normName_(r[1])).filter(Boolean))
  const empSh = getEmpSheet()
  const empRoster = empSh ? rows2obj_(empSh.getDataRange().getValues()) : []
  const empSalaryByName = {}
  empRoster.forEach(e => { empSalaryByName[normName_(e.Name)] = parseFloat(e.Salary) || 0 })

  // Anyone in Attendance (or Employees) not yet in Salary
  const namesNeeded = []
  attVals.slice(1).forEach(row => {
    const name = String(row[1]).trim()
    if (name && !existingNames.has(normName_(name))) { namesNeeded.push(name); existingNames.add(normName_(name)) }
  })
  empRoster.forEach(e => {
    const name = String(e.Name || '').trim()
    if (name && !existingNames.has(normName_(name))) { namesNeeded.push(name); existingNames.add(normName_(name)) }
  })

  if (namesNeeded.length) {
    const startSNo = salVals.length // header counts as row 1, so this is next S.No
    const newRows = namesNeeded.map((name, idx) => {
      const monthly = empSalaryByName[normName_(name)] || 0
      const perDay = workDays > 0 ? monthly / workDays : 0
      return [startSNo + idx, name, monthly, 0, workDays, 0, 0, 0, 0, 0, perDay, 0, 0, 'OK', 0]
    })
    salSh.getRange(salVals.length + 1, 1, newRows.length, 15).setValues(newRows)
    salVals = salSh.getDataRange().getValues() // re-read so the rest of the sync sees the new rows
  }

  // Build tally from attendance sheet. Uses += rather than a flat
  // assignment so that if the same person accidentally has more than one
  // row in the Attendance sheet (a stray duplicate), their counts get
  // ADDED together instead of the later row silently wiping out the
  // earlier one's numbers.
  const tally = {}
  attVals.slice(1).forEach(row => {
    const name = normName_(row[1])
    if (!name) return
    if (!tally[name]) tally[name] = { P: 0, A: 0, WO: 0, WOP: 0, NA: 0 }
    const t = tally[name]
    attHeaders.slice(2).forEach((h, i) => {
      const s = String(row[i + 2] || '').toUpperCase().trim()
      if (t[s] !== undefined) t[s]++
    })
  })

  // Every Advance/Penalty/Gas/Food/Rice/Custom entry on file for this
  // month, summed per employee — this becomes the Advance column below,
  // so Net Salary always reflects the full deductions ledger automatically.
  const deductionTotals = deductionTotalsByName_(year, month)

  // Update each employee row in salary sheet — build the whole block in memory
  // and write it in ONE setValues() call instead of 11 separate .setValue()
  // calls per row. Per-cell writes for every employee, on every single mark,
  // is what was making syncs slow enough to time out during bulk marking.
  const numRows = salVals.length - 1
  if (numRows > 0) {
    const salaryCol = []
    const advanceCol = []
    const block = []
    const naBlock = []
    for (let i = 1; i < salVals.length; i++) {
      const name = normName_(salVals[i][1])
      const t = tally[name] || { P: 0, A: 0, WO: 0, WOP: 0, NA: 0 }
      // Pull the current monthly salary from the Employees sheet if this
      // person is still on the roster there — that's the source of truth.
      // Only fall back to whatever's already in the Salary sheet if they
      // were removed from Employees (keeps salary history intact for
      // people no longer employed instead of zeroing them out).
      const monthly = (name in empSalaryByName) ? empSalaryByName[name] : (parseFloat(salVals[i][2]) || 0)
      const advance = deductionTotals[name] || 0
      const perDay = workDays > 0 ? monthly / workDays : 0
      // WO (Week Off) is paid leave, same as a normal working day. WOP
      // means someone came in on their day off, so it's paid DOUBLE — and
      // now Paid Days shows that too (counts as 2), so the column always
      // matches what's actually being paid instead of looking like 1 day.
      const payableUnits = t.P + t.WO + (t.WOP * 2)
      const paidDays = payableUnits
      const gross = Math.round(payableUnits * perDay)
      const net = Math.max(gross - advance, 0)
      const warning = t.A > 3 ? 'EXCESS ABSENT' : 'OK'

      salaryCol.push([monthly])
      advanceCol.push([advance])
      block.push([workDays, t.P, t.A, t.WO, t.WOP, paidDays, perDay, gross, net, warning])
      naBlock.push([t.NA || 0])
    }
    // Column 3 = Monthly Salary (kept in sync with the Employees sheet)
    salSh.getRange(2, 3, numRows, 1).setValues(salaryCol)
    // Column 4 = Advance (now driven entirely by the Deductions ledger)
    salSh.getRange(2, 4, numRows, 1).setValues(advanceCol)
    // Columns 5..14 = Total Days, P, A, WO, WOP, Paid Days, Per Day, Gross, Net, Warning
    salSh.getRange(2, 5, numRows, 10).setValues(block)
    // Column 15 = NA Count
    salSh.getRange(2, 15, numRows, 1).setValues(naBlock)
  }
}

function getMonthlySalary(year, month) {
  const ym = currentYM()
  // Only re-sync the current month against live attendance so numbers reflect
  // today's marks. Past months stay as finalized (no attendance sheet keeps
  // changing there, and it avoids re-writing closed-out payroll history).
  if (year === ym.year && month === ym.month) {
    syncSalarySheet_(year, month)
  }

  const sh = getSS().getSheetByName(salTabName(year, month))
  if (!sh) return { success: true, rows: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, rows: [] }

  // Join with Employees sheet so the UI can show EmployeeID / Type per worker
  const empSh = getEmpSheet()
  const empMap = {}
  if (empSh) {
    const empVals = empSh.getDataRange().getValues()
    if (empVals.length >= 2) {
      rows2obj_(empVals).forEach(e => {
        empMap[String(e.Name || '').toLowerCase().trim()] = {
          employeeId: String(e.EmployeeID || ''),
          type: e.Type || ''
        }
      })
    }
  }

  const rows = rows2obj_(vals).map(r => {
    const meta = empMap[String(r['Employee Name'] || '').toLowerCase().trim()] || { employeeId: '', type: '' }
    return {
      Name: r['Employee Name'],
      EmployeeID: meta.employeeId,
      Type: meta.type,
      MonthlySalary: parseFloat(r['Monthly Salary']) || 0,
      EarnedSalary: parseFloat(r['Gross Salary']) || 0,
      Deduction: parseFloat(r['Advance']) || 0,
      FinalSalary: parseFloat(r['Net Salary']) || 0,
      Present: r['P Count'] || 0,
      Absent: r['A Count'] || 0,
      WeekOff: r['WO Count'] || 0,
      WOP: r['WOP Count'] || 0,
      NA: r['NA Count'] || 0,
      TotalDays: r['Total Days'] || 0,
      PaidDays: r['Paid Days'] || 0,
      PerDaySalary: parseFloat(r['Per Day Salary']) || 0,
      Warning: r['Warning'] || ''
    }
  })

  return { success: true, rows }
}

function getEmployeeSalary(employeeId, year, month) {
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return { success: true, salary: null }
  const res = getMonthlySalary(year, month)
  const row = (res.rows || []).find(r => String(r.EmployeeID) === String(employeeId))
  return { success: true, salary: row || null }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function dashboardLogin(employeeId, password) {
  const sh = getEmpSheet()
  if (!sh) return { success: false, message: 'Employees sheet not found' }
  const found = rows2obj_(sh.getDataRange().getValues())
    .find(e => String(e.EmployeeID) === String(employeeId))
  if (!found) return { success: false, message: 'Employee ID not found' }
  if (String(found.Password) !== String(password)) return { success: false, message: 'Incorrect password' }
  return {
    success: true, employee: {
      employeeId: String(found.EmployeeID), name: found.Name,
      type: found.Type, isHR: toBool_(found.IsHR),
      phone: found.Phone, role: found.Role,
      joinDate: fmtDate(found.JoinDate), salary: found.Salary || ''
    }
  }
}

// ─── Leave ────────────────────────────────────────────────────────────────────

function applyLeave(request) {
  if (!request?.employeeId || !request?.fromDate) return { success: false, message: 'Employee and fromDate required' }
  const isPermission = request.type === 'permission'

  if (isPermission) {
    // File this into the permission sheet for whichever month the CHOSEN
    // date actually falls in — not always the current month. This is what
    // makes past ("missed") and future permission dates work correctly;
    // previously every entry landed in today's month sheet regardless of
    // what date was picked, silently mismatching the record.
    const parts = String(request.fromDate).split('-') // 'YYYY-MM-DD'
    const targetYear = parseInt(parts[0], 10)
    const targetMonth = parseInt(parts[1], 10)
    if (!targetYear || !targetMonth) return { success: false, message: 'Invalid date' }

    ensureMonthlyTabs(targetYear, targetMonth) // creates that month's tabs if they don't exist yet (e.g. a future month)
    const sh = getSS().getSheetByName(permTabName(targetYear, targetMonth))
    if (!sh) return { success: false, message: 'Permission sheet not ready' }
    const id = 'PM-' + Date.now()
    sh.appendRow([id, request.employeeId, request.name || '', request.fromDate,
      request.hours || '', request.reason || '', 'pending', new Date(), ''])
    return { success: true, requestId: id }
  } else {
    const sh = getSS().getSheetByName('Leave_Requests')
    if (!sh) return { success: false, message: 'Leave_Requests sheet not found' }
    const id = 'LV-' + Date.now()
    sh.appendRow([id, request.employeeId, request.name || '', request.type || 'leave',
      request.fromDate, request.toDate || '', request.reason || '', 'pending', new Date(), ''])
    return { success: true, requestId: id }
  }
}

// ─── Permission history (HR view of past Permission entries) ──────────────────
// Permission entries are appended into a per-month sheet ("<Month>-<Year>
// permission") whenever someone submits one from the Attendance page, but
// until now nothing ever read that sheet back — HR had no way to see,
// approve/reject, or correct a permission entry once it was submitted.
// This mirrors the Edit-Attendance-by-date pattern: pick a month, see
// everything, act on it.

function getPermissionsForMonth(year, month) {
  const ym = (year && month) ? { year, month } : currentYM()
  const sh = getSS().getSheetByName(permTabName(ym.year, ym.month))
  if (!sh) return { success: true, requests: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, requests: [] }
  const requests = rows2obj_(vals).map(r => ({
    requestId: r.RequestID, employeeId: String(r.EmployeeID), name: r['Employee Name'],
    date: fmtDate(r.Date), hours: r.Hours, reason: r.Reason,
    status: r.Status, appliedAt: r.AppliedAt, remarks: r.Remarks
  })).sort((a, b) => a.appliedAt < b.appliedAt ? 1 : -1)
  return { success: true, requests }
}

// Same data as getPermissionsForMonth() but filtered to one employee —
// this is what the Employee Dashboard calls, so a person only ever sees
// their own permission history, never anyone else's reasons.
function getPermissionsForEmployeeMonth(employeeId, year, month) {
  const res = getPermissionsForMonth(year, month)
  if (!res.success) return res
  return { success: true, requests: res.requests.filter(r => String(r.employeeId) === String(employeeId)) }
}

function updatePermissionStatus(requestId, year, month, status, remarks) {
  const ym = (year && month) ? { year, month } : currentYM()
  const sh = getSS().getSheetByName(permTabName(ym.year, ym.month))
  if (!sh) return { success: false, message: 'Permission sheet not found for that month' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(requestId)) {
      sh.getRange(i + 1, 7).setValue(status)          // Status column
      if (remarks !== undefined) sh.getRange(i + 1, 9).setValue(remarks) // Remarks column
      return { success: true }
    }
  }
  return { success: false, message: 'Permission entry not found' }
}

function deletePermissionEntry(requestId, year, month) {
  const ym = (year && month) ? { year, month } : currentYM()
  const sh = getSS().getSheetByName(permTabName(ym.year, ym.month))
  if (!sh) return { success: false, message: 'Permission sheet not found for that month' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(requestId)) {
      sh.deleteRow(i + 1)
      return { success: true }
    }
  }
  return { success: false, message: 'Permission entry not found' }
}

function getLeaveRequests(employeeId) {
  const sh = getSS().getSheetByName('Leave_Requests')
  if (!sh) return { success: true, requests: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, requests: [] }
  const requests = rows2obj_(vals)
    .filter(r => String(r.EmployeeID) === String(employeeId))
    .map(r => ({
      requestId: r.RequestID, employeeId: String(r.EmployeeID),
      name: r['Employee Name'], type: r.Type,
      fromDate: fmtDate(r.FromDate), toDate: fmtDate(r.ToDate),
      reason: r.Reason, status: r.Status, appliedAt: r.AppliedAt
    }))
    .sort((a, b) => a.appliedAt < b.appliedAt ? 1 : -1)
  return { success: true, requests }
}

function getAllLeaveRequests(status) {
  const sh = getSS().getSheetByName('Leave_Requests')
  if (!sh) return { success: true, requests: [] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success: true, requests: [] }
  let requests = rows2obj_(vals).map(r => ({
    requestId: r.RequestID, employeeId: String(r.EmployeeID),
    name: r['Employee Name'], type: r.Type,
    fromDate: fmtDate(r.FromDate), toDate: fmtDate(r.ToDate),
    reason: r.Reason, status: r.Status, appliedAt: r.AppliedAt
  }))
  if (status) requests = requests.filter(r => r.status === status)
  return { success: true, requests: requests.sort((a, b) => a.appliedAt < b.appliedAt ? 1 : -1) }
}

function updateLeaveStatus(requestId, status, remarks) {
  const sh = getSS().getSheetByName('Leave_Requests')
  if (!sh) return { success: false, message: 'Leave_Requests sheet not found' }
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === requestId) {
      sh.getRange(i + 1, 8).setValue(status)
      sh.getRange(i + 1, 10).setValue(remarks || '')
      return { success: true }
    }
  }
  return { success: false, message: 'Request not found' }
}

// ─── Settings ────────────────────────────────────────────────────────────────

function getSettingsSheet() {
  const ss = getSS()
  let sh = ss.getSheetByName('Settings')
  if (!sh) {
    sh = ss.insertSheet('Settings')
    sh.appendRow(['Key', 'Value', 'Extra', 'UpdatedAt'])
    sh.setFrozenRows(1)
    formatHeader_(sh, 4)
  }
  return sh
}

function settingsGet(key) {
  const vals = getSettingsSheet().getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) if (vals[i][0] === key) return { value: vals[i][1], extra: vals[i][2] }
  return null
}

function settingsSet(key, value, extra) {
  const sh = getSettingsSheet()
  const vals = sh.getDataRange().getValues()
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === key) {
      sh.getRange(i + 1, 2).setValue(value)
      sh.getRange(i + 1, 3).setValue(extra || '')
      sh.getRange(i + 1, 4).setValue(new Date().toLocaleString())
      return
    }
  }
  sh.appendRow([key, value, extra || '', new Date().toLocaleString()])
}

function getHeroImage() {
  const row = settingsGet('heroImage')
  return { success: true, heroImage: row ? { imageUrl: row.value, caption: row.extra } : null }
}

function setHeroImage(imageUrl, caption) {
  settingsSet('heroImage', imageUrl || '', caption || '')
  return { success: true }
}

function getAnnouncement() {
  const row = settingsGet('announcement')
  if (!row?.value) return { success: true, announcement: null }
  try { return { success: true, announcement: JSON.parse(row.value) } }
  catch (_) { return { success: true, announcement: null } }
}

function setAnnouncement(message, type, authorName) {
  const payload = JSON.stringify({
    message, type: type || 'announcement',
    authorName: authorName || 'HR', postedAt: new Date().toISOString()
  })
  settingsSet('announcement', payload, '')
  return { success: true }
}

function clearAnnouncement() {
  settingsSet('announcement', '', '')
  return { success: true }
}

// ─── Monthly trigger ──────────────────────────────────────────────────────────

function installMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onMonthStart') ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('onMonthStart').timeBased().onMonthDay(1).atHour(0).create()
  Logger.log('✅ Monthly trigger installed')
}

// ─── One-off maintenance helpers (safe to keep, only run manually if needed) ──

function fixAttendanceSheetHeaders() {
  const ss = getSS()
  const ym = currentYM()
  for (let offset = 0; offset < 2; offset++) {
    let m = ym.month - offset, y = ym.year
    if (m <= 0) { m += 12; y-- }
    const shName = attTabName(y, m)
    let sh = ss.getSheetByName(shName)
    if (!sh) { sh = ss.insertSheet(shName); Logger.log('Created new sheet: ' + shName) }
    const existing = sh.getDataRange().getValues()
    const hasDateCols = existing.length > 0 && existing[0].length > 2
    if (!hasDateCols) {
      const totalDays = daysInMonth(y, m)
      const headers = ['SNO', 'Employee Name']
      for (let d = 1; d <= totalDays; d++) headers.push(dateColLabel(new Date(y, m - 1, d)))
      sh.clearContents()
      sh.appendRow(headers)
      sh.setFrozenRows(1)
      sh.setFrozenColumns(2)
      sh.getRange(1, 1, 1, headers.length).setBackground('#FFFF00').setFontWeight('bold').setHorizontalAlignment('center')
      sh.setColumnWidth(1, 50)
      sh.setColumnWidth(2, 160)
      for (let d = 3; d <= headers.length; d++) sh.setColumnWidth(d, 70)
      addEmployeeRowsToAttSheet_(sh, y, m)
      Logger.log('✅ Fixed ' + shName + ' — added ' + (headers.length - 2) + ' date columns')
    } else {
      Logger.log('✓ ' + shName + ' already has date columns: ' + existing[0][2])
    }
  }
  SpreadsheetApp.flush()
  Logger.log('Done!')
}

function recalcNow() {
  const ym = currentYM()
  syncSalarySheet_(ym.year, ym.month)
  Logger.log('✅ Salary recalculated for ' + ym.month + '/' + ym.year)
}

// Run this ONCE after deploying the fix that makes workingDaysInMonth()
// use the real calendar days (28/29/30/31) instead of a fixed 30. It walks
// every existing "<Month>-<Year> Salary" tab in the spreadsheet and re-runs
// syncSalarySheet_() on it, so Total Days / Per Day Salary / Gross / Net on
// already-created months (e.g. August-2026, which has 31 days) get fixed
// immediately instead of waiting for the next attendance mark in that month.
function recalcAllMonthsFor31DayFix() {
  const ss = getSS()
  const sheets = ss.getSheets()
  let fixed = 0
  sheets.forEach(sh => {
    const name = sh.getName()
    const match = name.match(/^([A-Za-z]+)-(\d{4}) Salary$/)
    if (!match) return
    const monthIdx = FULL_MONTHS.indexOf(match[1])
    if (monthIdx === -1) return
    const year = parseInt(match[2], 10)
    const month = monthIdx + 1
    syncSalarySheet_(year, month)
    Logger.log('✅ Recalculated ' + name)
    fixed++
  })
  Logger.log('Done — recalculated ' + fixed + ' salary tab(s).')
}

// Run this ONCE after deploying this version, to create the Logs tab immediately
// instead of waiting for the next attendance mark.
function initLogsTab() {
  getLogsSheet_()
  Logger.log('✅ Logs tab ready')
}
