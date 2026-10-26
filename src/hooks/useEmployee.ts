import { collection, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Employee, Payment, TimeEntry } from '../types'
import { useLiveQuery, withId } from './useLive'

// Single-employee for now: the first employee created.
export function useEmployee() {
  const { items, loading } = useLiveQuery(
    'employee',
    () => query(collection(db, 'employees'), orderBy('createdAt', 'asc'), limit(1)),
    withId<Employee>,
  )
  return { employee: items[0] ?? null, loading }
}

export function useEmployeeLedger(employeeId: string | undefined) {
  const { items: timeEntries } = useLiveQuery(
    employeeId ? `timeEntries:${employeeId}` : null,
    () => collection(db, 'employees', employeeId!, 'timeEntries'),
    withId<TimeEntry>,
  )
  const { items: payments } = useLiveQuery(
    employeeId ? `payments:${employeeId}` : null,
    () => collection(db, 'employees', employeeId!, 'payments'),
    withId<Payment>,
  )
  return { timeEntries, payments }
}
