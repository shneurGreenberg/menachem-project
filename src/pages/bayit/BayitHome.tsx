import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { formatMoney } from '../../utils/dates'

export function BayitHome() {
  const openTasks = useLiveQuery(
    () => db.homeTasks.where('status').equals('open').count(),
    [],
  )
  const txs = useLiveQuery(() => db.homeTransactions.toArray(), [])
  const income = (txs ?? [])
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expense = (txs ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="grid grid-3">
      <Link to="/bayit/tasks" className="shortcut bayit">
        <h3>משימות בית</h3>
        <p>{openTasks ?? 0} פתוחות</p>
      </Link>
      <Link to="/bayit/finance" className="shortcut bayit">
        <h3>הכנסות</h3>
        <p>{formatMoney(income)}</p>
      </Link>
      <Link to="/bayit/finance" className="shortcut bayit">
        <h3>הוצאות / יתרה</h3>
        <p>
          {formatMoney(expense)} · יתרה {formatMoney(income - expense)}
        </p>
      </Link>
    </div>
  )
}
