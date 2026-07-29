import React, { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Splash from './components/Splash.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import useGlobalRipple from './hooks/useGlobalRipple.js'
import Home from './pages/Home.jsx'
import Attendance from './pages/Attendance.jsx'
import QRGenerate from './pages/QRGenerate.jsx'
import AddEmployee from './pages/AddEmployee.jsx'
import DashboardChooser from './pages/DashboardChooser.jsx'
import PortalLogin from './pages/PortalLogin.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import HRDashboard from './pages/HRDashboard.jsx'

export default function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('sv-splash-shown'))
  const location = useLocation()
  useGlobalRipple()

  function dismissSplash() {
    sessionStorage.setItem('sv-splash-shown', '1')
    setShowSplash(false)
  }

  return (
    <div className="min-h-screen w-full bg-surface sm:bg-[radial-gradient(circle_at_20%_15%,#123420,#050e08_75%)] sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="relative w-full max-w-[480px] mx-auto min-h-screen sm:min-h-0 sm:h-[min(920px,92vh)] sm:rounded-[2.75rem] sm:shadow-2xl sm:shadow-black/50 sm:ring-1 sm:ring-white/10 sm:overflow-hidden bg-surface text-ink font-body flex flex-col">
        {showSplash && <Splash onDone={dismissSplash} />}
        <InstallPrompt />
        <div className="flex-1 pb-28 safe-top sm:overflow-y-auto">
          <div key={location.pathname} className="page-fade">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/qr-codes" element={<QRGenerate />} />
              <Route path="/add-employee" element={<AddEmployee />} />
              <Route path="/dashboard-login" element={<DashboardChooser />} />
              <Route path="/employee-login" element={<PortalLogin portal="employee" />} />
              <Route path="/hr-login" element={<PortalLogin portal="hr" />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="/hr-dashboard" element={<HRDashboard />} />
            </Routes>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
