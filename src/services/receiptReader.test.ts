import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MODEL, readReceipt } from './receiptReader'

const ai = vi.hoisted(() => ({ generateContent: vi.fn(), getGenerativeModel: vi.fn() }))

vi.mock('firebase/ai', () => {
  const schema = () => ({})
  return {
    getAI: () => ({}),
    GoogleAIBackend: class {},
    Schema: { object: schema, array: schema, string: schema, number: schema },
    getGenerativeModel: (...args: unknown[]) => {
      ai.getGenerativeModel(...args)
      return { generateContent: ai.generateContent }
    },
  }
})

const photo = new Blob([new Uint8Array([0xff, 0xd8])], { type: 'image/jpeg' })
const replies = (text: string) => ai.generateContent.mockResolvedValue({ response: { text: () => text } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('readReceipt', () => {
  it('sends the photo to the configured model and returns a cleaned-up draft', async () => {
    replies(JSON.stringify({ store: ' Hardware Co ', date: '2026-10-29', tax: '2.52', total: 34.01, items: [{ name: 'Primer', amount: 24.99 }, { name: '', amount: 1 }] }))
    const reading = await readReceipt(photo)
    expect(reading).toEqual({ store: 'Hardware Co', date: '2026-10-29', tax: 2.52, total: 34.01, items: [{ name: 'Primer', amount: 24.99 }] })
    expect(ai.getGenerativeModel).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ model: MODEL }))
    const [, image] = ai.generateContent.mock.calls[0][0]
    expect(image).toMatchObject({ type: 'inlineData', inlineData: { mimeType: 'image/jpeg', data: '/9g=' } })
  })

  it('gives up with null when the model fails or replies with junk', async () => {
    ai.generateContent.mockRejectedValue(new Error('quota'))
    expect(await readReceipt(photo)).toBeNull()
    replies('not json')
    expect(await readReceipt(photo)).toBeNull()
  })

  it('gives up with null when it takes too long', async () => {
    ai.generateContent.mockReturnValue(new Promise(() => {}))
    const reading = readReceipt(photo, 50)
    expect(await reading).toBeNull()
  })
})
