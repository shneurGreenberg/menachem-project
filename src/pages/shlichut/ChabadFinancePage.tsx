import { FinanceLedger } from '../../components/FinanceLedger'

const INCOME = ['תרומות', 'מכירות', 'אחר']
const EXPENSE = ['אירועים', 'ציוד', 'מזון', 'תחבורה', 'אחר']

export function ChabadFinancePage() {
  return (
    <FinanceLedger
      table="chabadFinance"
      heading="רשומה חדשה — כספי בית חב״ד"
      intro="נפרד מכספי הבית הפרטי."
      buttonClass="shlichut"
      incomeSetting="chabadIncomeCategories"
      expenseSetting="chabadExpenseCategories"
      incomeFallback={INCOME}
      expenseFallback={EXPENSE}
    />
  )
}
