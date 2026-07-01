// src/api/sheetApi.js
// All communication with the Google Sheet backend (Google Apps Script Web App)
// goes through this file. Change WEB_APP_URL after you deploy the Apps Script.

const WEB_APP_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec'

async function callApi(action, payload = {}) {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight against Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  })
  if (!res.ok) throw new Error('Network error: ' + res.status)
  const data = await res.json()
  if (data.success === false) throw new Error(data.message || 'Request failed')
  return data
}

// ---------- Employees ----------
export const getEmployees = (type) => callApi('getEmployees', { type })
export const addEmployee = (employee) => callApi('addEmployee', { employee })
export const getEmployeeById = (employeeId) => callApi('getEmployeeById', { employeeId })
export const updateEmployee = (employeeId, updates) => callApi('updateEmployee', { employeeId, updates })

// ---------- Attendance ----------
// status: 'present' | 'weekoff' | 'na' | 'absent'
export const markAttendance = ({ employeeId, status, mode, supervisorName, location }) =>
  callApi('markAttendance', { employeeId, status, mode, supervisorName, location })

export const getTodaySummary = () => callApi('getTodaySummary')

export const getAttendanceHistory = (employeeId) => callApi('getAttendanceHistory', { employeeId })

export const getMonthlyAttendance = (employeeId, year, month) =>
  callApi('getMonthlyAttendance', { employeeId, year, month })

// ---------- Dashboard auth ----------
export const dashboardLogin = (employeeId, password) => callApi('dashboardLogin', { employeeId, password })

// ---------- Leave & Permission ----------
export const applyLeave = (request) => callApi('applyLeave', { request })
export const getLeaveRequests = (employeeId) => callApi('getLeaveRequests', { employeeId })
export const getAllLeaveRequests = (status) => callApi('getAllLeaveRequests', { status })
export const updateLeaveStatus = (requestId, status, remarks) => callApi('updateLeaveStatus', { requestId, status, remarks })

// ---------- HR Hero Image (Cloudinary URL stored in Settings sheet) ----------
export const getHeroImage = () => callApi('getHeroImage')
export const setHeroImage = (imageUrl, caption) => callApi('setHeroImage', { imageUrl, caption })

// ---------- HR Announcement (shown on Home page) ----------
export const getAnnouncement = () => callApi('getAnnouncement')
export const setAnnouncement = (message, type, authorName) => callApi('setAnnouncement', { message, type, authorName })
export const clearAnnouncement = () => callApi('clearAnnouncement')
export const getAllEmployeesFull = () => callApi('getAllEmployeesFull')
export const updateSalary = (employeeId, salary) => callApi('updateSalary', { employeeId, salary })
export const getMonthlySalary = (year, month) => callApi('getMonthlySalary', { year, month })
export const getEmployeeSalary = (employeeId, year, month) => callApi('getEmployeeSalary', { employeeId, year, month })
export const getMonthlyTabsList = () => callApi('getMonthlyTabsList')
