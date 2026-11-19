import { auth } from '../../lib/firebase'
import { currentBusiness } from '../../lib/business'
import { signOutAndReload } from '../../lib/session'
import { BottomSheet } from '../ui/BottomSheet'

interface Props {
  open: boolean
  onClose: () => void
}

// Who's signed in and for which business, and the way out
export function AccountSheet({ open, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Account">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Business</p>
          <p className="text-base text-gray-900 mt-0.5">{currentBusiness().name || 'Your business'}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Signed in as</p>
          <p className="text-base text-gray-900 mt-0.5 break-all">{auth.currentUser?.email ?? ''}</p>
        </div>
        <button
          type="button"
          onClick={signOutAndReload}
          className="w-full py-3 font-semibold rounded-xl text-base border border-gray-300 text-gray-800 active:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </BottomSheet>
  )
}
