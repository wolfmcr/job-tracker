const MAX_SIDE = 1600
const QUALITY = 0.8

// Phone photos are several MB; this is plenty to read a receipt and keeps uploads small.
// Always JPEG, whatever was picked, so Storage only ever holds one kind of file.
export async function shrinkImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Couldn’t convert the photo'))), 'image/jpeg', QUALITY)
  })
}
