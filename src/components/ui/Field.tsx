import type { ReactNode } from 'react'

interface LabelProps {
  children: ReactNode
  required?: boolean
}

export function FieldLabel({ children, required = false }: LabelProps) {
  return (
    <span className="text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-gray-400 ml-0.5" aria-hidden>*</span>}
    </span>
  )
}

interface Props {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}

// Wraps a single input so the label is visible above it and tied to it
export function Field({ label, required = false, className = '', children }: Props) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </label>
  )
}
