import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/bayit', label: 'סקירה', end: true },
  { to: '/bayit/finance', label: 'כספים' },
  { to: '/bayit/tasks', label: 'משימות' },
]

export function BayitLayout() {
  return <DeptLayout title="בית" deptClass="dept-bayit" links={links} />
}
