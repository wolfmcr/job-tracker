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
export function abbreviateStreet(street: string) {
  const words = street.split(' ')
  if (words.length > 1 && DIRECTIONS[words[0]]) words[0] = DIRECTIONS[words[0]]
  const last = words.length - 1
  if (last > 0 && DIRECTIONS[words[last]]) words[last] = DIRECTIONS[words[last]]
  const typeIndex = DIRECTIONS[street.split(' ')[last]] ? last - 1 : last
  if (typeIndex > 0 && SUFFIXES[words[typeIndex]]) words[typeIndex] = SUFFIXES[words[typeIndex]]
  return words.join(' ')
}

export interface PhotonProperties {
  name?: string
  housenumber?: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  countrycode?: string
}

// "4644 NE Everett St, Camas, WA 98607"
export function formatAddress(p: PhotonProperties) {
  const street = p.street ? abbreviateStreet(p.street) : p.name
  const line1 = [p.housenumber, street].filter(Boolean).join(' ')
  const region = [p.state && (STATES[p.state] ?? p.state), p.postcode].filter(Boolean).join(' ')
  return [line1, p.city, region].filter(Boolean).join(', ')
}
