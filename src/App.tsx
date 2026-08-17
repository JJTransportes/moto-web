import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { BrandImageProvider } from './auth/BrandImageContext'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import DriverCreationPage from './pages/DriverCreationPage'
import DriverDetailPage from './pages/DriverDetailPage'
import FleetCreationPage from './pages/FleetCreationPage'
import FleetDetailPage from './pages/FleetDetailPage'
import FleetEditPage from './pages/FleetEditPage'
import FleetListPage from './pages/FleetListPage'
import LoginPage from './pages/LoginPage'
import PartitionCreationPage from './pages/PartitionCreationPage'
import PartitionDetailPage from './pages/PartitionDetailPage'
import PartitionEditPage from './pages/PartitionEditPage'
import PartitionListPage from './pages/PartitionListPage'
import PassengerCreationPage from './pages/PassengerCreationPage'
import PassengerDetailPage from './pages/PassengerDetailPage'
import PasswordResetPage from './pages/PasswordResetPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import TravelDetailPage from './pages/TravelDetailPage'
import TravelListPage from './pages/TravelListPage'
import UsageTermsPage from './pages/UsageTermsPage'
import PublicUsageTermsPage from './pages/PublicUsageTermsPage'
import UsersPage from './pages/UsersPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-500">403</h1>
        <p className="mt-2 text-gray-400">Acesso negado.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandImageProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="/terms-privacy" element={<PublicUsageTermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route element={<ProtectedRoute requiredRole="GlobalAdmin" />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/drivers/:driverId" element={<DriverDetailPage />} />
                  <Route path="/users/passengers/:passengerId" element={<PassengerDetailPage />} />
                  <Route path="/users/passengers/new" element={<PassengerCreationPage />} />
                  <Route path="/users/drivers/new" element={<DriverCreationPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/partitions" element={<PartitionListPage />} />
                  <Route path="/partitions/new" element={<PartitionCreationPage />} />
                  <Route path="/partitions/:partitionId" element={<PartitionDetailPage />} />
                  <Route path="/partitions/:partitionId/edit" element={<PartitionEditPage />} />
                  <Route path="/routes" element={<TravelListPage />} />
                  <Route path="/routes/:travelId" element={<TravelDetailPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/fleets" element={<FleetListPage />} />
                  <Route path="/fleets/new" element={<FleetCreationPage />} />
                  <Route path="/fleets/:vehicleId" element={<FleetDetailPage />} />
                  <Route path="/fleets/:vehicleId/edit" element={<FleetEditPage />} />
                  <Route path="/usage-terms" element={<UsageTermsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrandImageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
