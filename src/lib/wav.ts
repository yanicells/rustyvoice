export function pcmWavDurationSec(bytes: Uint8Array): number {
  if (bytes.length < 44) return 0
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'RIFF') return 0
  const channels = view.getUint16(22, true)
  const sampleRate = view.getUint32(24, true)
  const bitsPerSample = view.getUint16(34, true)
  if (!channels || !sampleRate || !bitsPerSample) return 0

  let offset = 12
  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )
    const size = view.getUint32(offset + 4, true)
    if (id === 'data') {
      const bytesPerSample = (bitsPerSample / 8) * channels
      if (!bytesPerSample) return 0
      return size / bytesPerSample / sampleRate
    }
    offset += 8 + size + (size % 2)
  }
  return 0
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const whole = Math.round(seconds)
  const m = Math.floor(whole / 60)
  const s = whole % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const m = Math.floor(whole / 60)
  const s = whole % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
