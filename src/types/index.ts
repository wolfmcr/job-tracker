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

export interface Task {
  id: string
  jobId: string
  jobName?: string
  text: string
  // Plain bullet points for now; may become a checkable checklist later
  bullets?: string[]
  isDone: boolean
  completedAt?: Timestamp
  priority?: number
  createdAt: Timestamp
}
