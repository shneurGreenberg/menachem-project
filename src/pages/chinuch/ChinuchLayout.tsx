import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/chinuch', label: 'סקירה', end: true },
  { to: '/chinuch/students', label: 'תלמידים' },
  { to: '/chinuch/materials', label: 'חומרי לימוד' },
  { to: '/chinuch/plans', label: 'תוכניות הוראה' },
]

export function ChinuchLayout() {
  return <DeptLayout title="חינוך" deptClass="dept-chinuch" links={links} />
}
