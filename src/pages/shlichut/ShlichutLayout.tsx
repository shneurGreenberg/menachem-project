import {
  BarChart3,
  Bell,
  Calendar,
  LayoutGrid,
  Map,
  Users,
  Wallet,
} from 'lucide-react'
import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/shlichut', label: 'סקירה', icon: LayoutGrid, end: true },
  { to: '/shlichut/contacts', label: 'אנשי קשר', icon: Users },
  { to: '/shlichut/map', label: 'מפה', icon: Map },
  { to: '/shlichut/reminders', label: 'תזכורות', icon: Bell },
  { to: '/shlichut/plans', label: 'תוכניות', icon: Calendar },
  { to: '/shlichut/stats', label: 'סטטיסטיקות', icon: BarChart3 },
  { to: '/shlichut/finance', label: 'כספי חב״ד', icon: Wallet },
]

export function ShlichutLayout() {
  return (
    <DeptLayout title="שליחות בשכונה" deptClass="dept-shlichut" links={links} />
  )
}
