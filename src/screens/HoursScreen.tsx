import { BanknoteIcon, ClockIcon, PencilIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmployeeForm } from '../components/hours/EmployeeForm'
import { LedgerChart } from '../components/hours/LedgerChart'
import { LedgerEntrySheet } from '../components/hours/LedgerEntrySheet'
import { BottomSheet } from '../components/ui/BottomSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useEmployee, useEmployeeLedger } from '../hooks/useEmployee'
import { formatDate, formatHours, formatMoney } from '../lib/format'
import {
  addEmployee,
  addPayment,
  addTimeEntry,
  deletePayment,
  deleteTimeEntry,
  updateEmployee,
  updatePayment,
  updateTimeEntry,
} from '../services/employeeService'
import type { Employee, Payment, TimeEntry } from '../types'

type LedgerRow =
  | { kind: 'hours'; entry: TimeEntry }
  | { kind: 'payment'; entry: Payment }

export function HoursScreen() {
  const { employee, loading } = useEmployee()

  if (loading) return <LoadingSpinner />

  return (
    <div className="pb-8">
      <ScreenHeader title="Hours" />
      {employee ? (
        <EmployeeLedger employee={employee} />
      ) : (
        <div className="px-4 pt-2 flex flex-col gap-4">
          <p className="text-sm text-gray-500">Add your employee and their hourly rate to start tracking hours and payments.</p>
          <EmployeeForm submitLabel="Save" onSave={(name, rate) => addEmployee(name, rate)} />
        </div>
      )}
    </div>
  )
}

function EmployeeLedger({ employee }: { employee: Employee }) {
  const { timeEntries, payments } = useEmployeeLedger(employee.id)
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false)
  const [logHoursOpen, setLogHoursOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [editing, setEditing] = useState<LedgerRow | null>(null)

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0)
  const earned = timeEntries.reduce((sum, e) => sum + e.hours * e.rate, 0)
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  const owed = earned - paid
  const owedHours = employee.hourlyRate > 0 ? owed / employee.hourlyRate : 0

  const rows = useMemo<LedgerRow[]>(() => {
    const all: LedgerRow[] = [
      ...timeEntries.map(entry => ({ kind: 'hours' as const, entry })),
      ...payments.map(entry => ({ kind: 'payment' as const, entry })),
    ]
    return all.sort((a, b) =>
      b.entry.date.localeCompare(a.entry.date)
      || (b.entry.createdAt?.toMillis?.() ?? Infinity) - (a.entry.createdAt?.toMillis?.() ?? Infinity),
    )
  }, [timeEntries, payments])

  const editingInitial = useMemo(() => {
    if (!editing) return undefined
    return editing.kind === 'hours'
      ? { date: editing.entry.date, value: editing.entry.hours, note: editing.entry.note, rate: editing.entry.rate }
      : { date: editing.entry.date, value: editing.entry.amount, note: editing.entry.note }
  }, [editing])

  return (
    <>
      {/* Employee + balance */}
      <div className="mx-4 mt-2 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={() => setEditEmployeeOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white text-left active:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
            <p className="text-sm text-gray-400">{formatMoney(employee.hourlyRate)}/hr</p>
          </div>
          <PencilIcon size={16} className="text-gray-300 shrink-0" />
        </button>
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {owed < 0 ? 'Paid ahead' : 'Owed'}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(Math.abs(owed))}</p>
          {employee.hourlyRate > 0 && owed !== 0 && (
            <p className="text-sm text-gray-500 mt-0.5">≈ {formatHours(Math.abs(owedHours))} at current rate</p>
          )}
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>{formatHours(totalHours)} total</span>
            <span>Earned {formatMoney(earned)}</span>
            <span>Paid {formatMoney(paid)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-3">
        <button
          type="button"
          onClick={() => setLogHoursOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl text-base active:opacity-80"
          style={{ backgroundColor: '#111827' }}
        >
          <ClockIcon size={18} />
          Log hours
        </button>
        <button
          type="button"
          onClick={() => setAddPaymentOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-base border border-gray-300 text-gray-800 active:bg-gray-50"
        >
          <BanknoteIcon size={18} />
          Add payment
        </button>
      </div>

      {rows.length > 0 && <LedgerChart timeEntries={timeEntries} payments={payments} />}

      <SectionHeader title="History" />
      {rows.length === 0 ? (
        <EmptyState icon={<ClockIcon size={40} />} message="No hours or payments yet." />
      ) : (
        rows.map(row => (
          <button
            type="button"
            key={`${row.kind}-${row.entry.id}`}
            onClick={() => setEditing(row)}
            className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-100 text-left active:bg-gray-50"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${row.kind === 'hours' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'}`}>
              {row.kind === 'hours' ? <ClockIcon size={18} /> : <BanknoteIcon size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base text-gray-800">{formatDate(row.entry.date)}</p>
              {row.entry.note && <p className="text-sm text-gray-400 truncate">{row.entry.note}</p>}
            </div>
            {row.kind === 'hours' ? (
              <div className="text-right shrink-0">
                <p className="text-base font-semibold text-gray-800">{formatHours(row.entry.hours)}</p>
                <p className="text-xs text-gray-400">{formatMoney(row.entry.hours * row.entry.rate)}</p>
              </div>
            ) : (
              <p className="text-base font-semibold text-green-600 shrink-0">−{formatMoney(row.entry.amount)}</p>
            )}
          </button>
        ))
      )}

      <BottomSheet open={editEmployeeOpen} onClose={() => setEditEmployeeOpen(false)} title="Edit Employee">
        <div className="flex flex-col gap-3">
          <EmployeeForm
            initialName={employee.name}
            initialRate={employee.hourlyRate}
            resetKey={editEmployeeOpen}
            submitLabel="Save"
            onSave={(name, rate) => {
              updateEmployee(employee.id, name, rate)
              setEditEmployeeOpen(false)
            }}
          />
          <p className="text-xs text-gray-400 text-center">Changing the rate only affects hours logged from now on.</p>
        </div>
      </BottomSheet>

      <LedgerEntrySheet
        open={logHoursOpen}
        onClose={() => setLogHoursOpen(false)}
        kind="hours"
        onSave={(date, hours, note) => addTimeEntry(employee.id, date, hours, employee.hourlyRate, note)}
      />
      <LedgerEntrySheet
        open={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        kind="payment"
        onSave={(date, amount, note) => addPayment(employee.id, date, amount, note)}
      />
      <LedgerEntrySheet
        open={!!editing}
        onClose={() => setEditing(null)}
        kind={editing?.kind ?? 'hours'}
        initial={editingInitial}
        onSave={(date, value, note) => {
          if (!editing) return
          if (editing.kind === 'hours') updateTimeEntry(employee.id, editing.entry.id, date, value, note)
          else updatePayment(employee.id, editing.entry.id, date, value, note)
        }}
        onDelete={() => {
          if (!editing) return
          if (editing.kind === 'hours') deleteTimeEntry(employee.id, editing.entry.id)
          else deletePayment(employee.id, editing.entry.id)
        }}
      />
    </>
  )
}
