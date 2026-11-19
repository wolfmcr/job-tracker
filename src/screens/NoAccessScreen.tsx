import { signOut } from 'firebase/auth'
import { LockIcon } from 'lucide-react'
import { auth } from '../lib/firebase'

// Signed in, but the account isn't on the allow-list in firestore.rules
export function NoAccessScreen({ email }: { email: string | null }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 min-h-dvh px-8 text-center">
      <LockIcon size={40} className="text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900">No access</h2>
      <p className="text-sm text-gray-500">
        {email ? <><span className="font-medium text-gray-700">{email}</span> isn’t</> : 'This account isn’t'} set up to use Job Tracker.
      </p>
      <button
        type="button"
        onClick={() => signOut(auth)}
        className="mt-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold active:opacity-80"
      >
        Sign out
      </button>
    </div>
  )
}
