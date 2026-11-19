// What to tell someone whose sign-in failed, from Firebase Auth's error code
export function signInErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Wrong email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, then try again.'
    case 'auth/network-request-failed':
      return 'Can’t reach the server. Check your connection and try again.'
    case 'auth/user-disabled':
      return 'This account has been turned off.'
    default:
      return 'Couldn’t sign in. Please try again.'
  }
}

// A reset request says the same thing whether or not the email has an account, so the login
// screen can't be used to find out who does. null means "tell them a link is on its way".
export function resetErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  if (code === 'auth/user-not-found') return null
  if (code === 'auth/invalid-email' || code === 'auth/missing-email') return 'That doesn’t look like an email address.'
  return signInErrorMessage(error)
}
