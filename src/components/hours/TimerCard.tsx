import { PauseIcon, PlayIcon, SquareIcon } from 'lucide-react'
import { useState } from 'react'
import { useNow } from '../../hooks/useNow'
import { toISODate } from '../../lib/format'
import { canStartAt, elapsedMs, formatElapsed, isStale } from '../../lib/timer'
import type { Timer } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  timer?: Timer
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onSetStart: (startMs: number) => void
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

function formatStart(ms: number, now: number) {
  const d = new Date(ms)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (toISODate(d) === toISODate(new Date(now))) return time
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`
}

const buttonClass = 'flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-base'
const darkButtonClass = `${buttonClass} text-white active:opacity-80`
const lightButtonClass = `${buttonClass} border border-gray-300 text-gray-800 active:bg-gray-50`

// Always the same size, so starting and stopping don't shift the page
export function TimerCard({ timer, onStart, ...props }: Props) {
  // Remounting on each change restarts the clock from now, so resuming can't briefly show a second less
  if (timer) return <RunningTimer key={`${timer.startedAt.toMillis()}:${timer.pausedAt?.toMillis()}:${timer.pausedMs}`} timer={timer} {...props} />
  return (
    <div className="mx-4 mb-4 rounded-2xl border px-4 py-4 bg-white border-gray-100 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Timer</p>
      <p className="text-4xl font-bold text-gray-300 mt-1 tabular-nums">0:00:00</p>
      <p className="text-sm text-gray-400 mt-1">Not running</p>
      <div className="flex gap-3 mt-4">
        <button type="button" onClick={onStart} className={darkButtonClass} style={{ backgroundColor: '#111827' }}>
          <PlayIcon size={18} />
          Start timer
        </button>
      </div>
    </div>
  )
}

// A running or paused session: live time, its start (tap to correct) and the controls
function RunningTimer({ timer, onPause, onResume, onStop, onSetStart }: Omit<Props, 'onStart'> & { timer: Timer }) {
  const now = useNow()
  const [editingStart, setEditingStart] = useState(false)
  const paused = timer.pausedAt !== null
  const stale = isStale(timer, now)

  return (
    <div className={`mx-4 mb-4 rounded-2xl border px-4 py-4 ${stale ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{paused ? 'Paused' : 'Timing'}</p>
      <p className="text-4xl font-bold text-gray-900 mt-1 tabular-nums" role="timer" aria-label="Time worked">
        {formatElapsed(elapsedMs(timer, now))}
      </p>
      <button type="button" onClick={() => setEditingStart(true)} className="text-sm text-gray-500 underline decoration-dotted underline-offset-4 mt-1">
        Started {formatStart(timer.startedAt.toMillis(), now)}
      </button>
      {stale && (
        <p className="text-sm text-amber-700 mt-2" role="status">Still running? It started over 12 hours ago.</p>
      )}
      <div className="flex gap-3 mt-4">
        <button type="button" onClick={paused ? onResume : onPause} className={lightButtonClass}>
          {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={onStop} className={darkButtonClass} style={{ backgroundColor: '#111827' }}>
          <SquareIcon size={16} />
          Stop
        </button>
      </div>
      {editingStart && (
        <StartTimeSheet
          timer={timer}
          onClose={() => setEditingStart(false)}
          onSave={startMs => {
            onSetStart(startMs)
            setEditingStart(false)
          }}
        />
      )}
    </div>
  )
}

// <input type="datetime-local"> reads and writes local time as YYYY-MM-DDTHH:mm
function toLocalInput(ms: number) {
  const d = new Date(ms)
  return `${toISODate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function StartTimeSheet({ timer, onClose, onSave }: { timer: Timer; onClose: () => void; onSave: (startMs: number) => void }) {
  const now = useNow()
  const [value, setValue] = useState(() => toLocalInput(timer.startedAt.toMillis()))
  const startMs = value ? new Date(value).getTime() : NaN
  const valid = canStartAt(timer, startMs, now)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (valid) onSave(startMs)
  }

  return (
    <BottomSheet open onClose={onClose} title="Change Start Time">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Started at" required>
          <input type="datetime-local" value={value} onChange={e => setValue(e.target.value)} className={inputClass} required />
        </Field>
        {value && !valid && <p className="text-sm text-amber-700 -mt-1" role="status">That’s too late. It has to be before now and before any pauses.</p>}
        <SubmitButton label="Save" disabled={!valid} />
      </form>
    </BottomSheet>
  )
}
