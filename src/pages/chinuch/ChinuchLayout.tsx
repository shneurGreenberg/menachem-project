import { BookOpen, ClipboardList, LayoutGrid, Users } from 'lucide-react'
import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/chinuch', label: 'סקירה', icon: LayoutGrid, end: true },
  { to: '/chinuch/students', label: 'תלמידים', icon: Users },
  { to: '/chinuch/materials', label: 'חומרי לימוד', icon: BookOpen },
  { to: '/chinuch/plans', label: 'תוכניות הוראה', icon: ClipboardList },
]

export function ChinuchLayout() {
  return <DeptLayout title="חינוך" deptClass="dept-chinuch" links={links} />
}
