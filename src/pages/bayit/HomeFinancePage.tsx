import { FinanceLedger } from '../../components/FinanceLedger'

const INCOME = ['משכורת', 'מתנות', 'אחר']
const EXPENSE = ['מזון', 'דיור', 'תחבורה', 'בריאות', 'חינוך', 'אחר']

export function HomeFinancePage() {
  return (
    <FinanceLedger
      table="homeTransactions"
      heading="רשומה חדשה — כספי בית"
      buttonClass="bayit"
      incomeSetting="homeIncomeCategories"
      expenseSetting="homeExpenseCategories"
      incomeFallback={INCOME}
      expenseFallback={EXPENSE}
    />
  )
}
