import { MapPinIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { FieldLabel } from './Field'

// Free OpenStreetMap geocoder that allows search-as-you-type (no API key)
const PHOTON_URL = 'https://photon.komoot.io/api/'
// Rank results near Portland first; results outside the US are dropped
const BIAS = { lat: 45.55, lon: -122.6 }
const MIN_CHARS = 4
const DEBOUNCE_MS = 300

const STATES: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
}

const DIRECTIONS: Record<string, string> = {
  North: 'N', South: 'S', East: 'E', West: 'W', Northeast: 'NE', Northwest: 'NW', Southeast: 'SE', Southwest: 'SW',
}

const SUFFIXES: Record<string, string> = {
  Street: 'St', Avenue: 'Ave', Road: 'Rd', Drive: 'Dr', Boulevard: 'Blvd', Lane: 'Ln', Court: 'Ct', Place: 'Pl',
  Highway: 'Hwy', Parkway: 'Pkwy', Terrace: 'Ter', Circle: 'Cir', Square: 'Sq', Trail: 'Trl',
}

// "Northeast Everett Street" → "NE Everett St" (only the leading/trailing direction and the street type)
function abbreviateStreet(street: string) {
  const words = street.split(' ')
  if (words.length > 1 && DIRECTIONS[words[0]]) words[0] = DIRECTIONS[words[0]]
  const last = words.length - 1
  if (last > 0 && DIRECTIONS[words[last]]) words[last] = DIRECTIONS[words[last]]
  const typeIndex = DIRECTIONS[street.split(' ')[last]] ? last - 1 : last
  if (typeIndex > 0 && SUFFIXES[words[typeIndex]]) words[typeIndex] = SUFFIXES[words[typeIndex]]
  return words.join(' ')
}

interface PhotonProperties {
  name?: string
  housenumber?: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  countrycode?: string
}

// "4644 NE Everett St, Camas, WA 98607"
function formatAddress(p: PhotonProperties) {
  const street = p.street ? abbreviateStreet(p.street) : p.name
  const line1 = [p.housenumber, street].filter(Boolean).join(' ')
  const region = [p.state && (STATES[p.state] ?? p.state), p.postcode].filter(Boolean).join(' ')
  return [line1, p.city, region].filter(Boolean).join(', ')
}

interface Props {
  value: string
  onChange: (value: string) => void
}

// Free-text address with suggestions; typing anything is still allowed
export function AddressInput({ value, onChange }: Props) {
  const id = useId()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  // Only search after the user types, not when the field is pre-filled or a suggestion was picked
  const shouldSearch = useRef(false)

  useEffect(() => {
    const query = value.trim()
    if (!shouldSearch.current || query.length < MIN_CHARS) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: '8', lang: 'en', lat: String(BIAS.lat), lon: String(BIAS.lon) })
        params.append('layer', 'house')
        params.append('layer', 'street')
        const res = await fetch(`${PHOTON_URL}?${params}`, { signal: controller.signal })
        const data: { features: { properties: PhotonProperties }[] } = await res.json()
        const addresses = data.features
          .map(f => f.properties)
          .filter(p => p.countrycode === 'US')
          // Typed a house number? Only suggest actual addresses, not bare streets
          .filter(p => !/^\d/.test(query) || p.housenumber)
          .map(formatAddress)
        setSuggestions([...new Set(addresses)].slice(0, 5))
      } catch {
        // Aborted or offline: keep the field usable as plain text
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  function pick(address: string) {
    shouldSearch.current = false
    onChange(address)
    setSuggestions([])
  }

  const showSuggestions = focused && value.trim().length >= MIN_CHARS && suggestions.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}><FieldLabel>Address</FieldLabel></label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => {
            shouldSearch.current = true
            onChange(e.target.value)
          }}
          onFocus={() => setFocused(true)}
          // Delay so a tap on a suggestion lands before the list disappears
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={`${id}-list`}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showSuggestions && (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map(address => (
              <li key={address} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pick(address)}
                  className="w-full flex items-start gap-2 px-4 py-3 text-left text-sm text-gray-800 border-b border-gray-100 last:border-b-0 active:bg-gray-50"
                >
                  <MapPinIcon size={16} className="shrink-0 mt-0.5 text-gray-400" />
                  {address}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
