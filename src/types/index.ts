import type { Timestamp } from 'firebase/firestore'

export interface Job {
  id: string
  name: string
  address: string
  color?: string
  clientName?: string
  clientPhone?: string
  notes?: string
  isDone: boolean
  isArchived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ShoppingItem {
  id: string
  jobId: string
  jobName?: string
  qty: string
  name: string
  taskId?: string // set when the item belongs to a task's shopping list
  isGot: boolean
  priority?: number
  createdAt: Timestamp
}

export interface Employee {
  id: string
  name: string
  hourlyRate: number
  createdAt: Timestamp
}

export interface TimeEntry {
  id: string
  date: string // YYYY-MM-DD
  hours: number
  rate: number // hourly rate when logged, so later rate changes don't rewrite history
  note: string
  createdAt: Timestamp
}

export interface Payment {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  note: string
  createdAt: Timestamp
}

export interface ReceiptItem {
  name: string
  amount: number // dollars; negative for discounts
  jobId: string | null // null = not for a job
}

export interface Receipt {
  id: string
  store: string
  date: string // YYYY-MM-DD
  tax: number
  total: number // what was paid; job shares are split from this
  items: ReceiptItem[]
  jobIds: string[] // distinct item jobIds, so a job's receipts can be queried
  photoPath?: string // Storage path, receipts/{id}.jpg
  note: string
  createdAt: Timestamp
}

export interface Task {
  id: string
  jobId: string
  jobName?: string
  text: string
  // Plain bullet points for now; may become a checkable checklist later
  bullets?: string[]
  isDone: boolean
  completedAt?: Timestamp
  dueDate?: string // YYYY-MM-DD
  priority?: number
  createdAt: Timestamp
}
