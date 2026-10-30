import { doc, getDoc } from 'firebase/firestore'
import { getMetadata, ref } from 'firebase/storage'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearEmulator } from '../test/emulatorDb'
import type { ReceiptItem } from '../types'
import { addReceipt, deleteReceipt, newReceiptId, updateReceipt, uploadReceiptPhoto, type ReceiptFields } from './receiptService'

vi.mock('../lib/firebase', async () => {
  const { createEmulatorDb } = await import('../test/emulatorDb')
  return { ...createEmulatorDb(), auth: {} }
})

const { db, storage } = await import('../lib/firebase')

async function data(path: string) {
  return (await getDoc(doc(db, path))).data()
}

const photoExists = (path: string) => getMetadata(ref(storage, path)).then(() => true, () => false)

const items: ReceiptItem[] = [
  { name: 'Studs', amount: 60, jobId: 'alder' },
  { name: 'Screws', amount: 25, jobId: 'alder' },
  { name: 'Roller', amount: 15, jobId: 'shop' },
  { name: 'Gloves', amount: 0, jobId: null },
]
const fields: ReceiptFields = { store: 'Hardware Co', date: '2026-10-29', tax: 8, total: 108, items, note: '' }
const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })

beforeEach(clearEmulator)

describe('receipt service', () => {
  it('uploads the photo, then saves the receipt with its job IDs', async () => {
    const id = newReceiptId()
    const photoPath = await uploadReceiptPhoto(id, jpeg)
    expect(photoPath).toBe(`receipts/${id}.jpg`)
    expect(await addReceipt(id, fields, photoPath)).toBe(true)
    expect(await data(`receipts/${id}`)).toMatchObject({ ...fields, jobIds: ['alder', 'shop'], photoPath })
    expect(await photoExists(photoPath!)).toBe(true)
  })

  it('saves a receipt typed in without a photo', async () => {
    const id = newReceiptId()
    expect(await addReceipt(id, fields, null)).toBe(true)
    expect(await data(`receipts/${id}`)).not.toHaveProperty('photoPath')
  })

  it('re-tagging lines updates the job IDs', async () => {
    const id = newReceiptId()
    await addReceipt(id, fields, null)
    const retagged = items.map(i => ({ ...i, jobId: i.jobId === 'shop' ? 'oak' : i.jobId }))
    expect(await updateReceipt(id, { ...fields, items: retagged, note: 'Fixed' })).toBe(true)
    expect(await data(`receipts/${id}`)).toMatchObject({ jobIds: ['alder', 'oak'], note: 'Fixed' })
  })

  it('deleting a receipt removes its photo too', async () => {
    const id = newReceiptId()
    const photoPath = await uploadReceiptPhoto(id, jpeg)
    await addReceipt(id, fields, photoPath)
    expect(await deleteReceipt({ id, photoPath: photoPath! })).toBe(true)
    expect(await data(`receipts/${id}`)).toBeUndefined()
    expect(await photoExists(photoPath!)).toBe(false)
  })
})
