/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║          SRIDHI BATTERY CO. — ATTENDANCE BACKEND v2.0                  ║
 * ║          Google Apps Script Web App · Auto Monthly Tabs                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * HOW MONTHLY TABS WORK
 * ─────────────────────
 * Every month the system automatically creates 4 tabs named like:
 *   📅 Attendance-Jul-2025
 *   💰 Salary-Jul-2025
 *   🏖 Leave-Jul-2025
 *   ⏱ Permission-Jul-2025
 *
 * Salary-Jul is auto-calculated from Attendance-Jul:
 *   - Counts Present, WOP, WeekOff, NA, Absent for each employee
 *   - Calculates: (DailyRate × Present days) + (DailyRate × WOP days)
 *   - DailyRate = MonthlySalary ÷ working days in that month
 *
 * Tabs are created on the FIRST request of each new month (lazy creation).
 * A time-based trigger can also call ensureMonthlyTabs() at month start.
 *
 * SHEET STRUCTURE (permanent tabs — create these once):
 * ─────────────────────────────────────────────────────
 *   Employees  → EmployeeID|Name|Type|IsHR|Phone|Role|JoinDate|Salary|Password|CreatedAt
 *   Counters   → Type|LastNumber  (rows: office|0  and  production|0)
 *   Settings   → Key|Value|Extra|UpdatedAt
 *
 * Monthly tabs are auto-created. DO NOT create Attendance/Leave/etc manually.
 *
 * SETUP
 * ─────
 * 1. Replace SHEET_ID below with your Sheet ID.
 * 2. Deploy as Web App (Execute as Me, Anyone can access).
 * 3. Paste Web App URL into src/api/sheetApi.js as WEB_APP_URL.
 * 4. Optional: set up a monthly trigger → onMonthStart() runs at midnight on the 1st.
 */

const SHEET_ID    = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID'
const TZ          = 'Asia/Kolkata'
const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Routing ────────────────────────────────────────────────────────────────

function doPost(e) {
  let body
  try { body = JSON.parse(e.postData.contents) }
  catch (_) { return json({ success:false, message:'Invalid JSON' }) }

  try {
    ensureMonthlyTabs()  // create this month's tabs if not yet done
    const a = body.action
    if (a === 'getEmployees')          return json(getEmployees(body.type))
    if (a === 'getAllEmployeesFull')    return json(getAllEmployeesFull())
    if (a === 'addEmployee')           return json(addEmployee(body.employee))
    if (a === 'updateEmployee')        return json(updateEmployee(body.employeeId, body.updates))
    if (a === 'updateSalary')          return json(updateSalary(body.employeeId, body.salary))
    if (a === 'getEmployeeById')       return json(getEmployeeById(body.employeeId))
    if (a === 'markAttendance')        return json(markAttendance(body))
    if (a === 'getTodaySummary')       return json(getTodaySummary())
    if (a === 'getMonthlyAttendance')  return json(getMonthlyAttendance(body.employeeId, body.year, body.month))
    if (a === 'getAttendanceHistory')  return json(getAttendanceHistory(body.employeeId))
    if (a === 'getMonthlySalary')      return json(getMonthlySalary(body.year, body.month))
    if (a === 'getEmployeeSalary')     return json(getEmployeeSalary(body.employeeId, body.year, body.month))
    if (a === 'dashboardLogin')        return json(dashboardLogin(body.employeeId, body.password))
    if (a === 'applyLeave')            return json(applyLeave(body.request))
    if (a === 'getLeaveRequests')      return json(getLeaveRequests(body.employeeId))
    if (a === 'getAllLeaveRequests')    return json(getAllLeaveRequests(body.status))
    if (a === 'updateLeaveStatus')     return json(updateLeaveStatus(body.requestId, body.status, body.remarks))
    if (a === 'getHeroImage')          return json(getHeroImage())
    if (a === 'setHeroImage')          return json(setHeroImage(body.imageUrl, body.caption))
    if (a === 'getAnnouncement')       return json(getAnnouncement())
    if (a === 'setAnnouncement')       return json(setAnnouncement(body.message, body.type, body.authorName))
    if (a === 'clearAnnouncement')     return json(clearAnnouncement())
    if (a === 'getMonthlyTabsList')    return json(getMonthlyTabsList())
    return json({ success:false, message:'Unknown action: ' + a })
  } catch (err) {
    return json({ success:false, message: err.message })
  }
}

function doGet(e) {
  // Handle API calls via GET (avoids CORS preflight from browser)
  if (e && e.parameter && e.parameter.action) {
    let body = {}
    try {
      body = e.parameter.payload ? JSON.parse(e.parameter.payload) : {}
    } catch (_) { body = {} }
    body.action = e.parameter.action

    try {
      ensureMonthlyTabs()
      const a = body.action
      if (a === 'getEmployees')          return json(getEmployees(body.type))
      if (a === 'getAllEmployeesFull')    return json(getAllEmployeesFull())
      if (a === 'addEmployee')           return json(addEmployee(body.employee))
      if (a === 'updateEmployee')        return json(updateEmployee(body.employeeId, body.updates))
      if (a === 'updateSalary')          return json(updateSalary(body.employeeId, body.salary))
      if (a === 'getEmployeeById')       return json(getEmployeeById(body.employeeId))
      if (a === 'markAttendance')        return json(markAttendance(body))
      if (a === 'getTodaySummary')       return json(getTodaySummary())
      if (a === 'getMonthlyAttendance')  return json(getMonthlyAttendance(body.employeeId, body.year, body.month))
      if (a === 'getAttendanceHistory')  return json(getAttendanceHistory(body.employeeId))
      if (a === 'getMonthlySalary')      return json(getMonthlySalary(body.year, body.month))
      if (a === 'getEmployeeSalary')     return json(getEmployeeSalary(body.employeeId, body.year, body.month))
      if (a === 'dashboardLogin')        return json(dashboardLogin(body.employeeId, body.password))
      if (a === 'applyLeave')            return json(applyLeave(body.request))
      if (a === 'getLeaveRequests')      return json(getLeaveRequests(body.employeeId))
      if (a === 'getAllLeaveRequests')    return json(getAllLeaveRequests(body.status))
      if (a === 'updateLeaveStatus')     return json(updateLeaveStatus(body.requestId, body.status, body.remarks))
      if (a === 'getHeroImage')          return json(getHeroImage())
      if (a === 'setHeroImage')          return json(setHeroImage(body.imageUrl, body.caption))
      if (a === 'getAnnouncement')       return json(getAnnouncement())
      if (a === 'setAnnouncement')       return json(setAnnouncement(body.message, body.type, body.authorName))
      if (a === 'clearAnnouncement')     return json(clearAnnouncement())
      if (a === 'getMonthlyTabsList')    return json(getMonthlyTabsList())
      return json({ success: false, message: 'Unknown action: ' + a })
    } catch (err) {
      return json({ success: false, message: err.message })
    }
  }
  // Health check
  return ContentService.createTextOutput('Sridhi Battery Co. Attendance API v2 — OK').setMimeType(ContentService.MimeType.TEXT)
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function getSS() { return SpreadsheetApp.openById(SHEET_ID) }

// ─── Month helpers ───────────────────────────────────────────────────────────

function monthLabel(year, month) {
  // month = 1-12
  return MONTHS[month - 1] + '-' + year  // e.g. "Jul-2025"
}

function currentYM() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
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

function workingDaysInMonth(year, month) {
  const days = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0) count++ // exclude Sundays (adjust if needed)
  }
  return count
}

// ─── Auto Monthly Tab Creation ───────────────────────────────────────────────

function tabName(prefix, year, month) {
  return prefix + '-' + monthLabel(year, month)
}

function ensureMonthlyTabs(year, month) {
  const ss = getSS()
  const ym = year && month ? { year, month } : currentYM()
  const y = ym.year, m = ym.month
  const label = monthLabel(y, m)

  const tabs = [
    {
      name: '📅 Attendance-' + label,
      headers: ['Date','EmployeeID','Name','Type','Status','Mode','MarkedBy','Time','Latitude','Longitude']
    },
    {
      name: '🏖 Leave-' + label,
      headers: ['RequestID','EmployeeID','Name','EmpType','FromDate','ToDate','Reason','Status','AppliedAt','Remarks']
    },
    {
      name: '⏱ Permission-' + label,
      headers: ['RequestID','EmployeeID','Name','EmpType','Date','Hours','Reason','Status','AppliedAt','Remarks']
    },
    {
      name: '💰 Salary-' + label,
      headers: ['EmployeeID','Name','Type','MonthlySalary','WorkingDays','Present','Absent','WeekOff','WOP','NA','EarnedSalary','Deduction','FinalSalary','CalculatedOn']
    }
  ]

  tabs.forEach(t => {
    if (!ss.getSheetByName(t.name)) {
      const sh = ss.insertSheet(t.name)
      sh.appendRow(t.headers)
      sh.setFrozenRows(1)
      sh.getRange(1, 1, 1, t.headers.length)
        .setBackground('#0F6630').setFontColor('#FFFFFF').setFontWeight('bold')
      SpreadsheetApp.flush()
    }
  })

  // After creating attendance tab, populate salary template if not done
  recalculateMonthlySalary_(y, m)
}

// Called by time-based trigger at midnight on the 1st of each month
function onMonthStart() {
  const ym = currentYM()
  ensureMonthlyTabs(ym.year, ym.month)
}

// Returns list of all monthly tab sets that exist
function getMonthlyTabsList() {
  const ss = getSS()
  const sheets = ss.getSheets().map(s => s.getName())
  const months = []
  sheets.forEach(name => {
    const m = name.match(/📅 Attendance-(\w{3}-\d{4})/)
    if (m) months.push(m[1])
  })
  return { success: true, months: months.sort().reverse() }
}

// ─── Employees ───────────────────────────────────────────────────────────────

function getEmployeeSheet() { return getSS().getSheetByName('Employees') }

function rows2obj(values) {
  const h = values[0]
  return values.slice(1).filter(r => r[0]).map(r => {
    const o = {}; h.forEach((k,i) => o[k] = r[i]); return o
  })
}

function toBool(v) { return v === true || String(v).toUpperCase() === 'TRUE' }

function getEmployees(type) {
  const sh = getEmployeeSheet()
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success:true, employees:[] }

  let emps = rows2obj(vals).map(e => ({
    employeeId: String(e.EmployeeID),
    name: e.Name, type: e.Type, isHR: toBool(e.IsHR),
    phone: e.Phone, role: e.Role, joinDate: fmtDate(e.JoinDate)
  }))
  if (type) emps = emps.filter(e => e.type === type)

  // attach today status
  const today = todayStr()
  const ym = currentYM()
  const attSheet = getSS().getSheetByName('📅 Attendance-' + monthLabel(ym.year, ym.month))
  const todayRecs = {}
  if (attSheet) {
    const av = attSheet.getDataRange().getValues()
    if (av.length > 1) rows2obj(av).forEach(r => {
      if (fmtDate(r.Date) === today) todayRecs[String(r.EmployeeID)] = r.Status
    })
  }
  return { success:true, employees: emps.map(e => ({ ...e, todayStatus: todayRecs[e.employeeId] || null })) }
}

function getAllEmployeesFull() {
  const vals = getEmployeeSheet().getDataRange().getValues()
  if (vals.length < 2) return { success:true, employees:[] }
  return {
    success:true,
    employees: rows2obj(vals).map(e => ({
      employeeId: String(e.EmployeeID), name: e.Name, type: e.Type,
      isHR: toBool(e.IsHR), phone: e.Phone, role: e.Role,
      joinDate: fmtDate(e.JoinDate), salary: e.Salary || ''
    }))
  }
}

function getEmployeeById(employeeId) {
  const found = rows2obj(getEmployeeSheet().getDataRange().getValues())
    .find(e => String(e.EmployeeID) === String(employeeId))
  if (!found) return { success:false, message:'Employee not found' }
  return { success:true, employee: {
    employeeId: String(found.EmployeeID), name: found.Name,
    type: found.Type, isHR: toBool(found.IsHR),
    phone: found.Phone, role: found.Role,
    joinDate: fmtDate(found.JoinDate), salary: found.Salary || ''
  }}
}

function addEmployee(employee) {
  if (!employee?.name || !employee?.type) return { success:false, message:'Name and type required' }
  const id = generateId_(employee.type)
  const pwd = Math.floor(100000 + Math.random() * 900000).toString()
  getEmployeeSheet().appendRow([
    id, employee.name, employee.type, !!employee.isHR,
    employee.phone||'', employee.role||'', employee.joinDate||'',
    employee.salary||'', pwd, new Date()
  ])
  return { success:true, employeeId:id, password:pwd }
}

function updateEmployee(employeeId, updates) {
  const sh = getEmployeeSheet()
  const vals = sh.getDataRange().getValues()
  const hdrs = vals[0]
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(employeeId)) {
      Object.keys(updates||{}).forEach(k => {
        const ci = hdrs.indexOf(k)
        if (ci > -1) sh.getRange(i+1, ci+1).setValue(updates[k])
      })
      return { success:true }
    }
  }
  return { success:false, message:'Employee not found' }
}

function updateSalary(employeeId, salary) {
  return updateEmployee(employeeId, { Salary: salary })
}

function generateId_(type) {
  const sh = getSS().getSheetByName('Counters')
  const vals = sh.getDataRange().getValues()
  const prefix = type === 'office' ? 'SV-OFC-' : 'SV-PRD-'
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === type) {
      const next = Number(vals[i][1]) + 1
      sh.getRange(i+1, 2).setValue(next)
      return prefix + String(next).padStart(4,'0')
    }
  }
  sh.appendRow([type, 1])
  return prefix + '0001'
}

// ─── Attendance ───────────────────────────────────────────────────────────────

function getAttSheet(year, month) {
  return getSS().getSheetByName('📅 Attendance-' + monthLabel(year, month))
}

function markAttendance(body) {
  const { employeeId, status, mode, supervisorName, location } = body
  const empRes = getEmployeeById(employeeId)
  if (!empRes.success) return { success:false, message:'Employee ID not found / Invalid QR' }
  const emp = empRes.employee

  const today = todayStr()
  const ym = currentYM()
  const sh = getAttSheet(ym.year, ym.month)
  if (!sh) return { success:false, message:'Attendance sheet not ready — try again in a moment' }

  const vals = sh.getDataRange().getValues()
  const lat = location?.lat || ''
  const lng = location?.lng || ''
  const finalStatus = status || 'present'

  if (vals.length > 1) {
    const objs = rows2obj(vals)
    for (let i = 0; i < objs.length; i++) {
      if (String(objs[i].EmployeeID) === String(employeeId) && fmtDate(objs[i].Date) === today) {
        const r = i + 2
        sh.getRange(r,5).setValue(finalStatus)
        sh.getRange(r,6).setValue(mode)
        sh.getRange(r,7).setValue(supervisorName||'')
        sh.getRange(r,8).setValue(timeStr())
        sh.getRange(r,9).setValue(lat)
        sh.getRange(r,10).setValue(lng)
        recalculateMonthlySalary_(ym.year, ym.month)
        return { success:true, employeeName:emp.name, time:timeStr(), updated:true }
      }
    }
  }

  sh.appendRow([new Date(), employeeId, emp.name, emp.type, finalStatus, mode, supervisorName||'', timeStr(), lat, lng])
  recalculateMonthlySalary_(ym.year, ym.month)
  return { success:true, employeeName:emp.name, time:timeStr() }
}

function getTodaySummary() {
  const today = todayStr()
  const ym = currentYM()
  const empAll = rows2obj(getEmployeeSheet().getDataRange().getValues())
  const officeTotal = empAll.filter(e => e.Type==='office').length
  const productionTotal = empAll.filter(e => e.Type==='production').length

  const sh = getAttSheet(ym.year, ym.month)
  let officePresent=0, productionPresent=0
  if (sh) {
    const av = sh.getDataRange().getValues()
    if (av.length > 1) rows2obj(av).forEach(r => {
      if (fmtDate(r.Date)===today && r.Status==='present') {
        if (r.Type==='office') officePresent++
        else if (r.Type==='production') productionPresent++
      }
    })
  }
  return { success:true, officeTotal, productionTotal, officePresent, productionPresent,
    officeAbsent: Math.max(officeTotal-officePresent,0),
    productionAbsent: Math.max(productionTotal-productionPresent,0) }
}

function getMonthlyAttendance(employeeId, year, month) {
  const sh = getAttSheet(year, month)
  const records = {}
  if (sh) {
    const vals = sh.getDataRange().getValues()
    if (vals.length > 1) rows2obj(vals).forEach(r => {
      if (String(r.EmployeeID)===String(employeeId)) records[fmtDate(r.Date)] = r.Status
    })
  }
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = []
  for (let d=1; d<=daysInMonth; d++) {
    const ds = year+'-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0')
    days.push({ date:ds, status:records[ds]||null })
  }
  return { success:true, days }
}

function getAttendanceHistory(employeeId) {
  // last 3 months
  const history = []
  const ym = currentYM()
  for (let offset=0; offset<3; offset++) {
    let m = ym.month - offset, y = ym.year
    if (m <= 0) { m += 12; y-- }
    const sh = getAttSheet(y, m)
    if (!sh) continue
    const vals = sh.getDataRange().getValues()
    if (vals.length < 2) continue
    rows2obj(vals)
      .filter(r => String(r.EmployeeID)===String(employeeId))
      .forEach(r => history.push({ date:fmtDate(r.Date), status:r.Status, time:r.Time }))
  }
  history.sort((a,b) => a.date < b.date ? 1:-1)
  return { success:true, history: history.slice(0,60) }
}

// ─── Salary Calculation ───────────────────────────────────────────────────────

function recalculateMonthlySalary_(year, month) {
  const salaryShName = '💰 Salary-' + monthLabel(year, month)
  const attShName    = '📅 Attendance-' + monthLabel(year, month)
  const ss = getSS()
  const salSh  = ss.getSheetByName(salaryShName)
  const attSh  = ss.getSheetByName(attShName)
  if (!salSh || !attSh) return

  const empVals = getEmployeeSheet().getDataRange().getValues()
  const employees = rows2obj(empVals)
  const attVals = attSh.getDataRange().getValues()
  const attRows = attVals.length > 1 ? rows2obj(attVals) : []

  const workDays = workingDaysInMonth(year, month)

  // Build per-employee tally
  const tally = {}
  employees.forEach(e => {
    tally[String(e.EmployeeID)] = { present:0, absent:0, weekoff:0, wop:0, na:0 }
  })
  attRows.forEach(r => {
    const id = String(r.EmployeeID)
    if (!tally[id]) tally[id] = { present:0, absent:0, weekoff:0, wop:0, na:0 }
    const s = (r.Status||'').toLowerCase()
    if (s === 'present')     tally[id].present++
    else if (s === 'absent') tally[id].absent++
    else if (s === 'weekoff' || s === 'wo') tally[id].weekoff++
    else if (s === 'wop')    tally[id].wop++
    else if (s === 'na')     tally[id].na++
  })

  // Rebuild salary sheet data rows (keep header)
  const rows = [['EmployeeID','Name','Type','MonthlySalary','WorkingDays','Present','Absent','WeekOff','WOP','NA','EarnedSalary','Deduction','FinalSalary','CalculatedOn']]
  employees.forEach(e => {
    const id = String(e.EmployeeID)
    const monthly = parseFloat(e.Salary) || 0
    const t = tally[id] || { present:0, absent:0, weekoff:0, wop:0, na:0 }
    const dailyRate = workDays > 0 ? monthly / workDays : 0
    const earned    = Math.round((t.present + t.wop) * dailyRate)
    const deduction = Math.round(t.absent * dailyRate)
    const final     = Math.max(earned - deduction, 0)
    rows.push([
      id, e.Name, e.Type, monthly, workDays,
      t.present, t.absent, t.weekoff, t.wop, t.na,
      earned, deduction, final,
      Utilities.formatDate(new Date(), TZ, 'dd-MMM-yyyy HH:mm')
    ])
  })

  // Write all at once (fast)
  salSh.clearContents()
  salSh.getRange(1, 1, rows.length, rows[0].length).setValues(rows)
  // Reformat header
  salSh.getRange(1, 1, 1, rows[0].length)
    .setBackground('#0F6630').setFontColor('#FFFFFF').setFontWeight('bold')
}

function getMonthlySalary(year, month) {
  const sh = getSS().getSheetByName('💰 Salary-' + monthLabel(year, month))
  if (!sh) return { success:true, rows:[] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success:true, rows:[] }
  return { success:true, rows: rows2obj(vals) }
}

function getEmployeeSalary(employeeId, year, month) {
  const res = getMonthlySalary(year, month)
  const row = (res.rows||[]).find(r => String(r.EmployeeID)===String(employeeId))
  return { success:true, salary: row || null }
}

// ─── Leave & Permission ───────────────────────────────────────────────────────

function getLeaveSheet(year, month) {
  return getSS().getSheetByName('🏖 Leave-' + monthLabel(year, month))
}

function getPermSheet(year, month) {
  return getSS().getSheetByName('⏱ Permission-' + monthLabel(year, month))
}

function applyLeave(request) {
  if (!request?.employeeId || !request?.fromDate) return { success:false, message:'Employee and fromDate required' }
  const ym = currentYM()
  const isPermission = request.type === 'permission'

  if (isPermission) {
    const sh = getPermSheet(ym.year, ym.month)
    if (!sh) return { success:false, message:'Permission sheet not ready' }
    const id = 'PM-' + Date.now()
    sh.appendRow([id, request.employeeId, request.name||'', request.empType||'',
      request.fromDate, request.hours||'', request.reason||'', 'pending', new Date(), ''])
    return { success:true, requestId:id }
  } else {
    const sh = getLeaveSheet(ym.year, ym.month)
    if (!sh) return { success:false, message:'Leave sheet not ready' }
    const id = 'LV-' + Date.now()
    sh.appendRow([id, request.employeeId, request.name||'', request.empType||'',
      request.fromDate, request.toDate||'', request.reason||'', 'pending', new Date(), ''])
    return { success:true, requestId:id }
  }
}

function getLeaveRequests(employeeId) {
  const reqs = []
  const ym = currentYM()
  for (let offset=0; offset<3; offset++) {
    let m = ym.month - offset, y = ym.year
    if (m <= 0) { m += 12; y-- }
    const sh = getLeaveSheet(y, m)
    if (!sh) continue
    const vals = sh.getDataRange().getValues()
    if (vals.length < 2) continue
    rows2obj(vals).filter(r => String(r.EmployeeID)===String(employeeId))
      .forEach(r => reqs.push(mapLeave_(r,'leave')))
  }
  return { success:true, requests: reqs.sort((a,b) => a.appliedAt<b.appliedAt?1:-1) }
}

function getAllLeaveRequests(status) {
  const ym = currentYM()
  const sh = getLeaveSheet(ym.year, ym.month)
  if (!sh) return { success:true, requests:[] }
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return { success:true, requests:[] }
  let rows = rows2obj(vals).map(r => mapLeave_(r,'leave'))
  if (status) rows = rows.filter(r => r.status===status)
  return { success:true, requests: rows.sort((a,b) => a.appliedAt<b.appliedAt?1:-1) }
}

function mapLeave_(r, type) {
  return {
    requestId: r.RequestID, employeeId: String(r.EmployeeID),
    name: r.Name, type: r.EmpType||type,
    fromDate: fmtDate(r.FromDate), toDate: fmtDate(r.ToDate),
    reason: r.Reason, status: r.Status, appliedAt: r.AppliedAt
  }
}

function updateLeaveStatus(requestId, status, remarks) {
  const ym = currentYM()
  // search current + last 2 months
  for (let offset=0; offset<3; offset++) {
    let m = ym.month - offset, y = ym.year
    if (m <= 0) { m += 12; y-- }
    const sh = getLeaveSheet(y, m)
    if (!sh) continue
    const vals = sh.getDataRange().getValues()
    for (let i=1; i<vals.length; i++) {
      if (vals[i][0] === requestId) {
        sh.getRange(i+1, 8).setValue(status)
        sh.getRange(i+1, 10).setValue(remarks||'')
        return { success:true }
      }
    }
  }
  return { success:false, message:'Request not found' }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function dashboardLogin(employeeId, password) {
  const found = rows2obj(getEmployeeSheet().getDataRange().getValues())
    .find(e => String(e.EmployeeID) === String(employeeId))
  if (!found) return { success:false, message:'Employee ID not found' }
  if (String(found.Password) !== String(password)) return { success:false, message:'Incorrect password' }
  return { success:true, employee: {
    employeeId: String(found.EmployeeID), name: found.Name,
    type: found.Type, isHR: toBool(found.IsHR),
    phone: found.Phone, role: found.Role,
    joinDate: fmtDate(found.JoinDate), salary: found.Salary||''
  }}
}

// ─── Settings (Hero Image + Announcements) ───────────────────────────────────

function getSettingsSheet() {
  const ss = getSS()
  let sh = ss.getSheetByName('Settings')
  if (!sh) {
    sh = ss.insertSheet('Settings')
    sh.appendRow(['Key','Value','Extra','UpdatedAt'])
    sh.setFrozenRows(1)
    sh.getRange(1,1,1,4).setBackground('#0F6630').setFontColor('#FFFFFF').setFontWeight('bold')
  }
  return sh
}

function settingsGet(key) {
  const vals = getSettingsSheet().getDataRange().getValues()
  for (let i=1; i<vals.length; i++) if (vals[i][0]===key) return { value:vals[i][1], extra:vals[i][2] }
  return null
}

function settingsSet(key, value, extra) {
  const sh = getSettingsSheet()
  const vals = sh.getDataRange().getValues()
  for (let i=1; i<vals.length; i++) {
    if (vals[i][0]===key) {
      sh.getRange(i+1,2).setValue(value)
      sh.getRange(i+1,3).setValue(extra||'')
      sh.getRange(i+1,4).setValue(new Date().toLocaleString())
      return
    }
  }
  sh.appendRow([key, value, extra||'', new Date().toLocaleString()])
}

function getHeroImage() {
  const row = settingsGet('heroImage')
  return { success:true, heroImage: row ? { imageUrl:row.value, caption:row.extra } : null }
}

function setHeroImage(imageUrl, caption) {
  settingsSet('heroImage', imageUrl||'', caption||'')
  return { success:true }
}

function getAnnouncement() {
  const row = settingsGet('announcement')
  if (!row?.value) return { success:true, announcement:null }
  try { return { success:true, announcement: JSON.parse(row.value) } }
  catch(_) { return { success:true, announcement:null } }
}

function setAnnouncement(message, type, authorName) {
  const payload = JSON.stringify({ message, type:type||'announcement',
    authorName:authorName||'HR', postedAt:new Date().toISOString() })
  settingsSet('announcement', payload, '')
  return { success:true }
}

function clearAnnouncement() {
  settingsSet('announcement', '', '')
  return { success:true }
}

// ─── Time-based trigger installer (run once manually) ────────────────────────
// In Apps Script editor: Run → installMonthlyTrigger → authorize
function installMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onMonthStart') ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('onMonthStart')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create()
  Logger.log('✅ Monthly trigger installed — onMonthStart() will run on the 1st of each month.')
}
