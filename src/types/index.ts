import type { Timestamp } from 'firebase/firestore'

export interface Job {
  id: string
  name: string
  address: string
  color?: string
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

export interface TodoItem {
  id: string
  jobId: string
  jobName?: string
  text: string
  details?: string
  isDone: boolean
  priority?: number
  createdAt: Timestamp
}
