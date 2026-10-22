import { XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { FieldLabel } from './Field'

interface Props {
  label: string
  value: string[]
  onChange: (bullets: string[]) => void
}

// One input per bullet. Enter starts a new bullet, Backspace on an empty one removes it.
// Always shows at least one (possibly empty) line; strip blanks with cleanBullets (lib/format) before saving.
export function BulletListInput({ label, value, onChange }: Props) {
  const lines = value.length > 0 ? value : ['']
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const focusIndex = useRef<number | null>(null)

  useEffect(() => {
    if (focusIndex.current === null) return
    inputRefs.current[focusIndex.current]?.focus()
    focusIndex.current = null
  }, [value])

  function setLine(i: number, text: string) {
    onChange(lines.map((line, j) => (j === i ? text : line)))
  }

  function insertAfter(i: number) {
    focusIndex.current = i + 1
    onChange([...lines.slice(0, i + 1), '', ...lines.slice(i + 1)])
  }

  function remove(i: number) {
    focusIndex.current = Math.max(0, i - 1)
    onChange(lines.length > 1 ? lines.filter((_, j) => j !== i) : [''])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      insertAfter(i)
    } else if (e.key === 'Backspace' && lines[i] === '' && lines.length > 1) {
      e.preventDefault()
      remove(i)
    }
  }

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <ul className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-gray-400 shrink-0" aria-hidden>•</span>
            <input
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              value={line}
              aria-label={`${label} bullet ${i + 1}`}
              enterKeyHint="next"
              onChange={e => setLine(i, e.target.value)}
              onKeyDown={e => handleKeyDown(e, i)}
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(lines.length > 1 || line !== '') && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove bullet ${i + 1}`}
                className="p-2 shrink-0 text-gray-400 active:opacity-60"
              >
                <XIcon size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => insertAfter(lines.length - 1)}
        className="self-start text-sm font-medium text-blue-600 py-1"
      >
        + Add bullet
      </button>
    </div>
  )
}
