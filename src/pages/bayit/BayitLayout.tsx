import { LayoutGrid, ListTodo, Wallet } from 'lucide-react'
import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/bayit', label: 'סקירה', icon: LayoutGrid, end: true },
  { to: '/bayit/finance', label: 'כספים', icon: Wallet },
  { to: '/bayit/tasks', label: 'משימות', icon: ListTodo },
]

export function BayitLayout() {
  return <DeptLayout title="בית" deptClass="dept-bayit" links={links} />
}
