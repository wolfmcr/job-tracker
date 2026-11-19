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
