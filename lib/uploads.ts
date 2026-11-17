export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const imageTypes = [
  { extension: 'jpg', mime: 'image/jpeg', test: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { extension: 'png', mime: 'image/png', test: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  { extension: 'webp', mime: 'image/webp', test: (bytes: Uint8Array) => bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 },
] as const

export async function inspectImageFile(file: File) {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return null
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  return imageTypes.find((type) => type.mime === file.type && type.test(bytes)) ?? null
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}
