import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { BrandImageProvider } from './auth/BrandImageContext'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

// WEB-10: o bundle inicial carregava as ~25 páginas do painel de uma vez,
// mesmo as que exigem GlobalAdmin e a maioria dos usuários nunca abre numa
// sessão. `lazy` separa cada página em seu próprio chunk, baixado só quando
// a rota é navegada. `LoginPage` fica eager (é a primeira tela de quem não
// está autenticado, não faz sentido esperar um chunk extra pra ela).
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DriverCreationPage = lazy(() => import('./pages/DriverCreationPage'))
const DriverDetailPage = lazy(() => import('./pages/DriverDetailPage'))
const DriverEditPage = lazy(() => import('./pages/DriverEditPage'))
const FleetCreationPage = lazy(() => import('./pages/FleetCreationPage'))
const FleetDetailPage = lazy(() => import('./pages/FleetDetailPage'))
const FleetEditPage = lazy(() => import('./pages/FleetEditPage'))
const FleetListPage = lazy(() => import('./pages/FleetListPage'))
const PartitionCreationPage = lazy(() => import('./pages/PartitionCreationPage'))
const PartitionDetailPage = lazy(() => import('./pages/PartitionDetailPage'))
const PartitionEditPage = lazy(() => import('./pages/PartitionEditPage'))
const PartitionListPage = lazy(() => import('./pages/PartitionListPage'))
const PassengerCreationPage = lazy(() => import('./pages/PassengerCreationPage'))
const PassengerDetailPage = lazy(() => import('./pages/PassengerDetailPage'))
const PassengerEditPage = lazy(() => import('./pages/PassengerEditPage'))
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const TravelDetailPage = lazy(() => import('./pages/TravelDetailPage'))
const TravelListPage = lazy(() => import('./pages/TravelListPage'))
const UsageTermsPage = lazy(() => import('./pages/UsageTermsPage'))
const PublicUsageTermsPage = lazy(() => import('./pages/PublicUsageTermsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">Carregando...</p>
    </div>
  )
}

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
          <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/users/drivers/:driverId/edit" element={<DriverEditPage />} />
                  <Route path="/users/passengers/:passengerId" element={<PassengerDetailPage />} />
                  <Route path="/users/passengers/:passengerId/edit" element={<PassengerEditPage />} />
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
          </Suspense>
        </BrandImageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
