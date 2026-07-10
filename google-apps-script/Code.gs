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
    ensureMonthlyTabs()
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
  return { success: false, message: 'Unknown action: ' + a }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
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
  // Fixed 30 days for salary calculation (company policy)
  return 30
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

  SpreadsheetApp.flush()
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
  const todayLabel = dateColLabel(new Date())
  const todayRecs = {}
  if (attSh) {
    const av = attSh.getDataRange().getValues()
    if (av.length > 1) {
      const dateColIdx = av[0].indexOf(todayLabel)
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
  const dateColIdx = headers.indexOf(todayLabel)
  if (dateColIdx === -1) return { success: false, message: 'Date column not found: ' + todayLabel }

  // Find employee row by name
  let empRowIdx = -1
  for (let i = 1; i < allVals.length; i++) {
    if (String(allVals[i][1]).toLowerCase().trim() === emp.name.toLowerCase().trim()) {
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

function getTodaySummary() {
  const ym = currentYM()
  const empSh = getEmpSheet()
  const empVals = empSh ? empSh.getDataRange().getValues() : [[]]
  const employees = empVals.length > 1 ? rows2obj_(empVals) : []
  const officeTotal = employees.filter(e => e.Type === 'office').length
  const productionTotal = employees.filter(e => e.Type === 'production').length

  const sh = getSS().getSheetByName(attTabName(ym.year, ym.month))
  const todayLabel = dateColLabel(new Date())
  let officePresent = 0, productionPresent = 0

  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) {
      const dateColIdx = vals[0].indexOf(todayLabel)
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
  const todayLabel = dateColLabel(new Date())
  const statusMap = {}

  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) {
      const dateColIdx = vals[0].indexOf(todayLabel)
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
      const label = dateColLabel(dateObj)
      const ds = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      const colIdx = headers.indexOf(label)
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
      const label = dateColLabel(dateObj)
      const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      const colIdx = headers.indexOf(label)
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
  const salVals = salSh.getDataRange().getValues()

  // Build tally from attendance sheet
  const tally = {}
  attVals.slice(1).forEach(row => {
    const name = String(row[1]).toLowerCase().trim()
    if (!name) return
    const t = { P: 0, A: 0, WO: 0, WOP: 0, NA: 0 }
    attHeaders.slice(2).forEach((h, i) => {
      const s = String(row[i + 2] || '').toUpperCase().trim()
      if (t[s] !== undefined) t[s]++
    })
    tally[name] = t
  })

  // Update each employee row in salary sheet
  for (let i = 1; i < salVals.length; i++) {
    const name = String(salVals[i][1]).toLowerCase().trim()
    if (!name) continue
    const t = tally[name] || { P: 0, A: 0, WO: 0, WOP: 0, NA: 0 }
    const monthly = parseFloat(salVals[i][2]) || 0
    const advance = parseFloat(salVals[i][3]) || 0
    const perDay = workDays > 0 ? monthly / workDays : 0
    const paidDays = t.P + t.WOP
    const gross = Math.round(paidDays * perDay)
    const net = Math.max(gross - advance, 0)
    const warning = t.A > 3 ? 'EXCESS ABSENT' : 'OK'

    salSh.getRange(i + 1, 5).setValue(workDays)   // Total Days
    salSh.getRange(i + 1, 6).setValue(t.P)         // P Count
    salSh.getRange(i + 1, 7).setValue(t.A)         // A Count
    salSh.getRange(i + 1, 8).setValue(t.WO)        // WO Count
    salSh.getRange(i + 1, 9).setValue(t.WOP)       // WOP Count
    salSh.getRange(i + 1, 10).setValue(paidDays)   // Paid Days
    salSh.getRange(i + 1, 11).setValue(perDay)     // Per Day Salary
    salSh.getRange(i + 1, 12).setValue(gross)      // Gross Salary
    salSh.getRange(i + 1, 13).setValue(net)        // Net Salary
    salSh.getRange(i + 1, 14).setValue(warning)    // Warning
    salSh.getRange(i + 1, 15).setValue(t.NA)       // NA Count
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
  const ym = currentYM()
  const isPermission = request.type === 'permission'

  if (isPermission) {
    const sh = getSS().getSheetByName(permTabName(ym.year, ym.month))
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

// Run this ONCE after deploying this version, to create the Logs tab immediately
// instead of waiting for the next attendance mark.
function initLogsTab() {
  getLogsSheet_()
  Logger.log('✅ Logs tab ready')
}
