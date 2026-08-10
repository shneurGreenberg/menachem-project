import { DeptLayout } from '../../components/DeptLayout'

const links = [
  { to: '/shlichut', label: 'סקירה', end: true },
  { to: '/shlichut/contacts', label: 'אנשי קשר' },
  { to: '/shlichut/map', label: 'מפה' },
  { to: '/shlichut/reminders', label: 'תזכורות' },
  { to: '/shlichut/plans', label: 'תוכניות' },
  { to: '/shlichut/stats', label: 'סטטיסטיקות' },
  { to: '/shlichut/finance', label: 'כספי חב״ד' },
]

export function ShlichutLayout() {
  return (
    <DeptLayout title="שליחות בשכונה" deptClass="dept-shlichut" links={links} />
  )
}
