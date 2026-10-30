import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

// Not implemented by jsdom; BottomSheet calls it when a field gets focus
Element.prototype.scrollIntoView = () => {}

// Unit tests never talk to a real Firebase project (CI has no config); emulator tests use their own
vi.mock('../lib/firebase', () => ({ app: {}, db: {}, auth: {}, storage: {} }))
