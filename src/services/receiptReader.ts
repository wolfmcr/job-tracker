import { app } from '../lib/firebase'
import { normalizeReading, type ReceiptReading } from '../lib/receipts'

// Newer Flash models replace older ones every few months; check Firebase AI Logic's model list
// when this starts failing (https://firebase.google.com/docs/ai-logic/models)
export const MODEL = 'gemini-3.8-flash'
export const READ_TIMEOUT_MS = 30_000

const PROMPT = `Read this store receipt and return:
- store: the store's name as printed
- date: the purchase date as YYYY-MM-DD
- items: every purchased line, top to bottom. A discount or return is its own line with a negative amount. Leave out subtotals, payments, change and loyalty points. For each:
  - printed: the item's text exactly as printed, on one line
  - name: what the item is, written the way a person would: brand and product spelled out, size kept, sentence case, e.g. "SHW PNT EGSHL 1G" becomes "Sherwin-Williams eggshell paint, 1 gal". If more than one was bought, end with the count, e.g. "× 3"; leave out unit prices. Where you can't tell what an abbreviation means, keep that part as printed rather than guess.
  - amount: the line's total in dollars
- tax: the total tax, 0 if none
- total: the amount paid`

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Gemini through Firebase AI Logic. Resolves to a draft for the form, or null if the photo
// couldn't be read, in which case the user types the receipt in instead.
export async function readReceipt(photo: Blob, timeoutMs = READ_TIMEOUT_MS): Promise<ReceiptReading | null> {
  try {
    // Loaded only when a receipt is read, so the rest of the app doesn't carry it
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema, ThinkingLevel } = await import('firebase/ai')
    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: MODEL,
      generationConfig: {
        // Reading a receipt needs little reasoning; low thinking halves the wait (about 2s instead of 5s)
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: Schema.object({
          properties: {
            store: Schema.string(),
            date: Schema.string({ description: 'YYYY-MM-DD' }),
            items: Schema.array({
              items: Schema.object({ properties: { printed: Schema.string(), name: Schema.string(), amount: Schema.number() } }),
            }),
            tax: Schema.number(),
            total: Schema.number(),
          },
        }),
      },
    })
    const request = model.generateContent([PROMPT, { type: 'inlineData', inlineData: { data: await toBase64(photo), mimeType: 'image/jpeg' } }])
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timed out')), timeoutMs))
    const result = await Promise.race([request, timeout])
    return normalizeReading(JSON.parse(result.response.text()))
  } catch (error) {
    console.error('[receipts] couldn’t read receipt', error)
    return null
  }
}
