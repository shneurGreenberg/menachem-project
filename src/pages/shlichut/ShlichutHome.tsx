import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, Calendar, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_LG } from '../../components/icons'
import { db } from '../../db'

export function ShlichutHome() {
  const contacts = useLiveQuery(() => db.contacts.count(), [])
  const openReminders = useLiveQuery(
    async () =>
      (await db.reminders.where('module').equals('shlichut').toArray()).filter(
        (r) => r.status === 'open',
      ).length,
    [],
  )
  const plans = useLiveQuery(
    () => db.plans.where('status').equals('active').count(),
    [],
  )

  return (
    <div className="grid grid-3">
      <Link to="/shlichut/contacts" className="shortcut shlichut">
        <h3>
          <Icon icon={Users} size={ICON_SIZE_LG} />
          אנשי קשר
        </h3>
        <p>{contacts ?? 0} רשומים · שדות מותאמים ומפה</p>
      </Link>
      <Link to="/shlichut/reminders" className="shortcut shlichut">
        <h3>
          <Icon icon={Bell} size={ICON_SIZE_LG} />
          תזכורות
        </h3>
        <p>{openReminders ?? 0} פתוחות</p>
      </Link>
      <Link to="/shlichut/plans" className="shortcut shlichut">
        <h3>
          <Icon icon={Calendar} size={ICON_SIZE_LG} />
          תוכניות
        </h3>
        <p>{plans ?? 0} פעילות</p>
      </Link>
    </div>
  )
}
