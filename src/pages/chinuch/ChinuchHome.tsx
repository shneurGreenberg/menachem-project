import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, ClipboardList, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_LG } from '../../components/icons'
import { db } from '../../db'

export function ChinuchHome() {
  const students = useLiveQuery(() => db.students.count(), [])
  const materials = useLiveQuery(() => db.lessonMaterials.count(), [])
  const plans = useLiveQuery(
    () => db.teachingPlans.where('status').equals('planned').count(),
    [],
  )

  return (
    <div className="grid grid-3">
      <Link to="/chinuch/students" className="shortcut chinuch">
        <h3>
          <Icon icon={Users} size={ICON_SIZE_LG} />
          תלמידים
        </h3>
        <p>{students ?? 0} תלמידים</p>
      </Link>
      <Link to="/chinuch/materials" className="shortcut chinuch">
        <h3>
          <Icon icon={BookOpen} size={ICON_SIZE_LG} />
          חומרי לימוד
        </h3>
        <p>{materials ?? 0} פריטים</p>
      </Link>
      <Link to="/chinuch/plans" className="shortcut chinuch">
        <h3>
          <Icon icon={ClipboardList} size={ICON_SIZE_LG} />
          תוכניות הוראה
        </h3>
        <p>{plans ?? 0} מתוכננות</p>
      </Link>
    </div>
  )
}
