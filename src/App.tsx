import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { useAuthStore, useToastStore } from '@/store'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Requirements from '@/pages/Requirements'
import RequirementDetail from '@/pages/RequirementDetail'
import Inquiries from '@/pages/Inquiries'
import InquiryDetail from '@/pages/InquiryDetail'
import Approvals from '@/pages/Approvals'
import ApprovalDetail from '@/pages/ApprovalDetail'
import Contracts from '@/pages/Contracts'
import ContractDetail from '@/pages/ContractDetail'
import ContractUpload from '@/pages/ContractUpload'
import Acceptance from '@/pages/Acceptance'
import AcceptanceDetail from '@/pages/AcceptanceDetail'
import Payments from '@/pages/Payments'
import PaymentDetail from '@/pages/PaymentDetail'
import Reports from '@/pages/Reports'
import Suppliers from '@/pages/Suppliers'
import SupplierDetail from '@/pages/SupplierDetail'
import Logs from '@/pages/Logs'
import Alerts from '@/pages/Alerts'

function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm cursor-pointer transition-all min-w-[240px] ${
            t.type === 'success'
              ? 'bg-emerald-400 text-white'
              : t.type === 'error'
              ? 'bg-coral-400 text-white'
              : 'bg-primary-500 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-primary-500">加载中...</div>
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/requirements/:id" element={<RequirementDetail />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/inquiries/:id" element={<InquiryDetail />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/approvals/:id" element={<ApprovalDetail />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/contracts/upload" element={<ContractUpload />} />
          <Route path="/acceptance" element={<Acceptance />} />
          <Route path="/acceptance/:id" element={<AcceptanceDetail />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/:id" element={<PaymentDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </Router>
  )
}
