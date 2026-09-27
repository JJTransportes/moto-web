import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="mo-root flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
