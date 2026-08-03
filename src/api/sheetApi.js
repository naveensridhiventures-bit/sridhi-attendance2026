// src/api/sheetApi.js
// JSONP approach — bypasses CORS completely for Google Apps Script.
// No fetch() used — injects a <script> tag instead, which browsers allow cross-origin.

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwdKtB5hsn2KIrTEG4NrjHWqK0j_M5N2zds06UMd7WqXbA9THmEnm4hWsoiHbVg05rh/exec'

function callApi(action, payload = {}, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const cbName = '__gs_cb_' + Date.now() + '_' + Math.floor(Math.random() * 99999)

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Request timed out — check your internet connection'))
    }, timeoutMs)

    function cleanup() {
      clearTimeout(timeout)
      // Leave a harmless no-op behind instead of deleting the callback
      // outright — if the Apps Script response arrives after we've
      // already given up waiting on it, it still tries to call this
      // function by name. Deleting it entirely turns that into a visible
      // "ReferenceError: ... is not defined" in the console even though
      // nothing is actually broken; a no-op just quietly absorbs it.
      window[cbName] = () => {}
      setTimeout(() => { delete window[cbName] }, 120000)
      const el = document.getElementById(cbName)
      if (el) el.remove()
    }

    window[cbName] = (data) => {
      cleanup()
      if (data && data.success === false) {
        reject(new Error(data.message || 'Request failed'))
      } else {
        resolve(data)
      }
    }

    const params = new URLSearchParams({
      action,
      payload: JSON.stringify(payload),
      callback: cbName
    })

    const script = document.createElement('script')
    script.id = cbName
    script.src = `${WEB_APP_URL}?${params.toString()}`
    script.onerror = () => {
      cleanup()
      reject(new Error('Failed to reach Apps Script — check deployment URL'))
    }
    document.head.appendChild(script)
  })
}

// ---------- Employees ----------
export const getEmployees         = (type)                       => callApi('getEmployees', { type })
export const addEmployee          = (employee)                   => callApi('addEmployee', { employee })
export const getEmployeeById      = (employeeId)                 => callApi('getEmployeeById', { employeeId })
export const updateEmployee       = (employeeId, updates)        => callApi('updateEmployee', { employeeId, updates })

// ---------- Attendance ----------
export const markAttendance       = ({ employeeId, status, mode, supervisorName, location }) =>
  callApi('markAttendance', { employeeId, status, mode, supervisorName, location })
export const markAttendanceBulk   = ({ entries, mode, supervisorName, location }) =>
  callApi('markAttendanceBulk', { entries, mode, supervisorName, location }, 45000)
export const markAttendanceForDate = ({ date, entries, markedBy }) =>
  callApi('markAttendanceForDate', { date, entries, markedBy }, 45000)
export const getAttendanceForDate = ({ date }) =>
  callApi('getAttendanceForDate', { date })
export const getTodaySummary      = ()                           => callApi('getTodaySummary')
export const getAttendanceHistory = (employeeId)                 => callApi('getAttendanceHistory', { employeeId })
export const getMonthlyAttendance = (employeeId, year, month)    => callApi('getMonthlyAttendance', { employeeId, year, month })

// ---------- Dashboard auth ----------
export const dashboardLogin       = (employeeId, password)       => callApi('dashboardLogin', { employeeId, password })

// ---------- Leave & Permission ----------
export const applyLeave           = (request)                    => callApi('applyLeave', { request })
export const getLeaveRequests     = (employeeId)                 => callApi('getLeaveRequests', { employeeId })
export const getAllLeaveRequests   = (status)                     => callApi('getAllLeaveRequests', { status })
export const updateLeaveStatus    = (requestId, status, remarks) => callApi('updateLeaveStatus', { requestId, status, remarks })

// ---------- HR Hero Image ----------
export const getHeroImage         = ()                           => callApi('getHeroImage')
export const setHeroImage         = (imageUrl, caption)          => callApi('setHeroImage', { imageUrl, caption })

// ---------- HR Announcements ----------
export const getAnnouncement      = ()                           => callApi('getAnnouncement')
export const setAnnouncement      = (message, type, authorName)  => callApi('setAnnouncement', { message, type, authorName })
export const clearAnnouncement    = ()                           => callApi('clearAnnouncement')

// ---------- HR / Salary ----------
export const getAllEmployeesFull   = ()                           => callApi('getAllEmployeesFull')
export const updateSalary         = (employeeId, salary)         => callApi('updateSalary', { employeeId, salary })
export const getMonthlySalary     = (year, month)                => callApi('getMonthlySalary', { year, month })
export const getEmployeeSalary    = (employeeId, year, month)    => callApi('getEmployeeSalary', { employeeId, year, month })
export const getMonthlyTabsList   = ()                           => callApi('getMonthlyTabsList')

// ---------- Logs (every attendance mark, name/role/location/date/time) ----------
export const getLogs              = (limit, employeeId)          => callApi('getLogs', { limit, employeeId })

// ---------- Absentee WhatsApp Alerts ----------
export const getAbsenteesToday    = ()                           => callApi('getAbsenteesToday')
export const getHrWhatsappNumber  = ()                           => callApi('getHrWhatsappNumber')
export const setHrWhatsappNumber  = (number)                     => callApi('setHrWhatsappNumber', { number })
