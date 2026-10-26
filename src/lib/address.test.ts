import { describe, expect, it } from 'vitest'
import { abbreviateStreet, formatAddress } from './address'

describe('abbreviateStreet', () => {
  it('abbreviates a leading direction and the street type', () => {
    expect(abbreviateStreet('Northeast Everett Street')).toBe('NE Everett St')
    expect(abbreviateStreet('Southeast Division Street')).toBe('SE Division St')
  })

  it('abbreviates a trailing direction and the type before it', () => {
    expect(abbreviateStreet('Main Street North')).toBe('Main St N')
  })

  it('leaves single words and unknown types alone', () => {
    expect(abbreviateStreet('Broadway')).toBe('Broadway')
    expect(abbreviateStreet('North')).toBe('North')
    expect(abbreviateStreet('Avenue')).toBe('Avenue')
    expect(abbreviateStreet('Northeast Alameda')).toBe('NE Alameda')
  })

  it('only abbreviates the type in last position, not mid-name', () => {
    expect(abbreviateStreet('Court Street')).toBe('Court St')
  })
})

describe('formatAddress', () => {
  it('builds a one-line US address with the state abbreviated', () => {
    expect(formatAddress({ housenumber: '4644', street: 'Northeast Everett Street', city: 'Camas', state: 'Washington', postcode: '98607' }))
      .toBe('4644 NE Everett St, Camas, WA 98607')
  })

  it('falls back to the place name when there is no street', () => {
    expect(formatAddress({ name: 'Pioneer Courthouse Square', city: 'Portland', state: 'Oregon' }))
      .toBe('Pioneer Courthouse Square, Portland, OR')
  })

  it('skips missing parts and keeps unknown states as given', () => {
    expect(formatAddress({ street: 'Main Street', state: 'Ontario' })).toBe('Main St, Ontario')
    expect(formatAddress({})).toBe('')
  })
})
