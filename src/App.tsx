import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { SettingsPage } from './pages/SettingsPage'
import { ShlichutLayout } from './pages/shlichut/ShlichutLayout'
import { ShlichutHome } from './pages/shlichut/ShlichutHome'
import { ContactsPage } from './pages/shlichut/ContactsPage'
import { ContactDetailPage } from './pages/shlichut/ContactDetailPage'
import { ContactsMapPage } from './pages/shlichut/ContactsMapPage'
import { RemindersPage } from './pages/shlichut/RemindersPage'
import { PlansPage } from './pages/shlichut/PlansPage'
import { PlanDetailPage } from './pages/shlichut/PlanDetailPage'
import { StatsPage } from './pages/shlichut/StatsPage'
import { ChabadFinancePage } from './pages/shlichut/ChabadFinancePage'
import { ChinuchLayout } from './pages/chinuch/ChinuchLayout'
import { ChinuchHome } from './pages/chinuch/ChinuchHome'
import { StudentsPage } from './pages/chinuch/StudentsPage'
import { StudentDetailPage } from './pages/chinuch/StudentDetailPage'
import { MaterialsPage } from './pages/chinuch/MaterialsPage'
import { TeachingPlansPage } from './pages/chinuch/TeachingPlansPage'
import { BayitLayout } from './pages/bayit/BayitLayout'
import { BayitHome } from './pages/bayit/BayitHome'
import { HomeFinancePage } from './pages/bayit/HomeFinancePage'
import { HomeTasksPage } from './pages/bayit/HomeTasksPage'

export default function App() {
  return (
    <BrowserRouter basename="/menachem-project">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="shlichut" element={<ShlichutLayout />}>
            <Route index element={<ShlichutHome />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="map" element={<ContactsMapPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="plans/:id" element={<PlanDetailPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="finance" element={<ChabadFinancePage />} />
          </Route>

          <Route path="chinuch" element={<ChinuchLayout />}>
            <Route index element={<ChinuchHome />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="plans" element={<TeachingPlansPage />} />
          </Route>

          <Route path="bayit" element={<BayitLayout />}>
            <Route index element={<BayitHome />} />
            <Route path="finance" element={<HomeFinancePage />} />
            <Route path="tasks" element={<HomeTasksPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
