import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { BriefcaseIcon } from 'lucide-react'
import { useState } from 'react'
import { Field } from '../components/ui/Field'
import { resetErrorMessage, signInErrorMessage } from '../lib/authErrors'
import { auth } from '../lib/firebase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Also how invited people set their first password
  async function handleForgot() {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your email above, then tap “Forgot password?” again.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (error) {
      const message = resetErrorMessage(error)
      if (message) {
        setError(message)
        return
      }
    }
    setNotice('If that email has an account, a link to set a new password is on its way. Check your spam folder too.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError(signInErrorMessage(error))
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
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          {notice && <p role="status" className="text-gray-600 text-sm text-center">{notice}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:bg-blue-700"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <button type="button" onClick={handleForgot} className="text-sm font-medium text-blue-600 py-1">
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  )
}
