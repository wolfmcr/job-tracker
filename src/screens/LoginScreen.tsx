import { signInWithEmailAndPassword } from 'firebase/auth'
import { BriefcaseIcon } from 'lucide-react'
import { useState } from 'react'
import { Field } from '../components/ui/Field'
import { auth } from '../lib/firebase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Wrong email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 text-white rounded-2xl p-4">
            <BriefcaseIcon size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Job Tracker</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email" required>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </Field>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:bg-blue-700"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
