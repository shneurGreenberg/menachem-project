import Dexie, { type Table } from 'dexie'
import type {
  Activity,
  ActivityType,
  AppSetting,
  ChabadFinance,
  Contact,
  ContactActivityLog,
  CustomFieldDef,
  Grade,
  HomeTask,
  HomeTransaction,
  LessonMaterial,
  Plan,
  PlanSummary,
  PlanTask,
  Reminder,
  ShoppingItem,
  Student,
  TeachingPlan,
} from '../types'

export class AppDatabase extends Dexie {
  contacts!: Table<Contact, number>
  customFieldDefs!: Table<CustomFieldDef, number>
  plans!: Table<Plan, number>
  planTasks!: Table<PlanTask, number>
  planSummaries!: Table<PlanSummary, number>
  shoppingItems!: Table<ShoppingItem, number>
  activityTypes!: Table<ActivityType, number>
  activities!: Table<Activity, number>
  reminders!: Table<Reminder, number>
  chabadFinance!: Table<ChabadFinance, number>
  students!: Table<Student, number>
  grades!: Table<Grade, number>
  lessonMaterials!: Table<LessonMaterial, number>
  teachingPlans!: Table<TeachingPlan, number>
  homeTransactions!: Table<HomeTransaction, number>
  homeTasks!: Table<HomeTask, number>
  settings!: Table<AppSetting, number>
  contactActivityLogs!: Table<ContactActivityLog, number>

  constructor() {
    super('menachemPersonalApp')
    this.version(1).stores({
      contacts: '++id, name, address',
      customFieldDefs: '++id, key, order',
      plans: '++id, targetDate, status',
      planTasks: '++id, planId, order',
      planSummaries: '++id, planId, year',
      shoppingItems: '++id, planId',
      activityTypes: '++id, name',
      activities: '++id, contactId, activityTypeId, date',
      reminders: '++id, status, module, contactId, dueDate, priority',
      chabadFinance: '++id, type, date, category',
      students: '++id, name',
      grades: '++id, studentId, date',
      lessonMaterials: '++id, title',
      teachingPlans: '++id, date, status',
      homeTransactions: '++id, type, date, category',
      homeTasks: '++id, status, dueDate, priority',
      settings: '++id, &key',
      contactActivityLogs: '++id, contactId, date',
    })
    this.version(2).stores({
      lessonMaterials: '++id, title, createdAt',
      homeTasks: '++id, status, dueDate, priority, createdAt',
    })
    this.use({
      stack: 'dbcore',
      name: 'cloudSync',
      create(down) {
        return {
          ...down,
          table(tableName) {
            const table = down.table(tableName)
            return {
              ...table,
              mutate(req) {
                return table.mutate(req).then((res) => {
                  queueMicrotask(() => {
                    window.dispatchEvent(new CustomEvent('menachem-data-changed'))
                  })
                  return res
                })
              },
            }
          },
        }
      },
    })
  }
}

export const db = new AppDatabase()

const DEFAULT_SETTINGS: Record<string, string> = {
  planResurfaceLeadDays: '45',
  homeExpenseCategories: JSON.stringify([
    'מזון',
    'דיור',
    'תחבורה',
    'בריאות',
    'חינוך',
    'אחר',
  ]),
  homeIncomeCategories: JSON.stringify(['משכורת', 'מתנות', 'אחר']),
  chabadExpenseCategories: JSON.stringify([
    'אירועים',
    'ציוד',
    'מזון',
    'תחבורה',
    'אחר',
  ]),
  chabadIncomeCategories: JSON.stringify(['תרומות', 'מכירות', 'אחר']),
}

async function seedIfEmpty() {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.bulkAdd(
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })),
    )
  }

  const typesCount = await db.activityTypes.count()
  if (typesCount === 0) {
    await db.activityTypes.bulkAdd([
      { name: 'ביקור בית', color: '#2f6f5e' },
      { name: 'התוועדות', color: '#3d6b8c' },
      { name: 'מזוזה', color: '#8b6914' },
      { name: 'שיעור', color: '#6b4f3a' },
      { name: 'חג / אירוע', color: '#7a3e3e' },
    ])
  }

  const fieldsCount = await db.customFieldDefs.count()
  if (fieldsCount === 0) {
    await db.customFieldDefs.bulkAdd([
      { key: 'childrenCount', label: 'מספר ילדים', type: 'number', order: 1 },
      {
        key: 'occupation',
        label: 'עיסוק',
        type: 'text',
        order: 2,
      },
      {
        key: 'affiliation',
        label: 'זיקה',
        type: 'select',
        options: ['קרוב', 'בינוני', 'רחוק', 'לא ידוע'],
        order: 3,
      },
    ])
  }
}

seedIfEmpty().catch(console.error)

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.settings.where('key').equals(key).first()
  return row?.value ?? DEFAULT_SETTINGS[key] ?? fallback
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing?.id != null) {
    await db.settings.update(existing.id, { value })
  } else {
    await db.settings.add({ key, value })
  }
}
