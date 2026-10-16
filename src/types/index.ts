import type { Timestamp } from 'firebase/firestore'

export interface Job {
  id: string
  name: string
  address: string
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
  createdAt: Timestamp
}

export interface TodoItem {
  id: string
  jobId: string
  jobName?: string
  text: string
  isDone: boolean
  createdAt: Timestamp
}
