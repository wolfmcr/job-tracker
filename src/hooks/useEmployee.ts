import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Employee, Payment, TimeEntry } from '../types'

// Single-employee for now: the first employee created.
export function useEmployee() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'), limit(1))
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      const doc = snap.docs[0]
      setEmployee(doc ? ({ id: doc.id, ...doc.data() } as Employee) : null)
      if (!snap.metadata.fromCache || doc) setLoading(false)
    })
  }, [])

  return { employee, loading }
}

export function useEmployeeLedger(employeeId: string | undefined) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (!employeeId) return
    const unsubEntries = onSnapshot(collection(db, 'employees', employeeId, 'timeEntries'), (snap) => {
      setTimeEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TimeEntry))
    })
    const unsubPayments = onSnapshot(collection(db, 'employees', employeeId, 'payments'), (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment))
    })
    return () => {
      unsubEntries()
      unsubPayments()
    }
  }, [employeeId])

  return { timeEntries, payments }
}
