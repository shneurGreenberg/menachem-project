export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'done'
export type ModuleId = 'shlichut' | 'chinuch' | 'bayit'
export type FinanceType = 'income' | 'expense'
export type PlanStatus = 'active' | 'completed' | 'archived'
export type FieldType = 'text' | 'number' | 'select'

export interface Contact {
  id?: number
  name: string
  address: string
  phone?: string
  notes?: string
  lat?: number
  lng?: number
  /**
   * תמונת איש קשר במחרוזת DataURL (דחוס לקובץ JPEG בצד הלקוח).
   * נשמרת רק בדפדפן (IndexedDB).
   */
  imageDataUrl?: string
  customFields: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface CustomFieldDef {
  id?: number
  key: string
  label: string
  type: FieldType
  options?: string[]
  order: number
}

export interface Plan {
  id?: number
  title: string
  description?: string
  targetDate: string
  budget?: number
  status: PlanStatus
  createdAt: string
  updatedAt: string
}

export interface PlanTask {
  id?: number
  planId: number
  title: string
  done: boolean
  order: number
}

export interface ShoppingItem {
  id?: number
  planId: number
  name: string
  quantity?: string
  estimatedCost?: number
  purchased: boolean
}

export interface PlanSummary {
  id?: number
  planId: number
  year: number
  whatWorked: string
  whatDidnt: string
  notesForNextYear: string
  createdAt: string
}

export interface ActivityType {
  id?: number
  name: string
  color?: string
}

export interface Activity {
  id?: number
  contactId?: number
  activityTypeId: number
  date: string
  participants?: number
  cost?: number
  notes?: string
  improvementNotes?: string
  reminderId?: number
  createdAt: string
}

export interface Reminder {
  id?: number
  title: string
  description?: string
  contactId?: number
  dueDate?: string
  priority: Priority
  status: TaskStatus
  module: ModuleId
  completedAt?: string
  createdAt: string
}

export interface ChabadFinance {
  id?: number
  type: FinanceType
  amount: number
  category: string
  description?: string
  date: string
  createdAt: string
}

export interface Student {
  id?: number
  name: string
  phone?: string
  parentName?: string
  parentPhone?: string
  notes?: string
  topicsLearned?: string
  createdAt: string
}

export interface Grade {
  id?: number
  studentId: number
  subject: string
  score: number
  maxScore: number
  date: string
  notes?: string
}

export interface LessonMaterial {
  id?: number
  title: string
  content?: string
  url?: string
  notes?: string
  tags: string[]
  createdAt: string
}

export interface TeachingPlan {
  id?: number
  title: string
  topic: string
  date?: string
  materialIds: number[]
  studentIds: number[]
  notes?: string
  status: 'planned' | 'done'
  createdAt: string
}

export interface HomeTransaction {
  id?: number
  type: FinanceType
  amount: number
  category: string
  description?: string
  date: string
  createdAt: string
}

export interface HomeTask {
  id?: number
  title: string
  description?: string
  dueDate?: string
  priority: Priority
  status: TaskStatus
  completedAt?: string
  createdAt: string
}

export interface AppSetting {
  id?: number
  key: string
  value: string
}

export interface ContactActivityLog {
  id?: number
  contactId: number
  kind: 'reminder' | 'activity' | 'note'
  title: string
  details?: string
  date: string
  createdAt: string
}
