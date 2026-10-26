import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// Not implemented by jsdom; BottomSheet calls it when a field gets focus
Element.prototype.scrollIntoView = () => {}
