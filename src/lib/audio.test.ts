import { expect, test } from 'bun:test'

import { parseAvfoundationDevices, pickDefaultMic } from './audio'
import { formatDuration, pcmWavDurationSec } from './wav'

const FFMPEG_LIST = `
[AVFoundation indev @ 0xb4b010140] AVFoundation video devices:
[AVFoundation indev @ 0xb4b010140] [0] MacBook Air Camera
[AVFoundation indev @ 0xb4b010140] AVFoundation audio devices:
[AVFoundation indev @ 0xb4b010140] [0] ZoomAudioDevice
[AVFoundation indev @ 0xb4b010140] [1] yani’s cell Microphone
[AVFoundation indev @ 0xb4b010140] [2] MacBook Air Microphone
`

test('parses avfoundation audio devices only', () => {
  expect(parseAvfoundationDevices(FFMPEG_LIST)).toEqual([
    { index: 0, name: 'ZoomAudioDevice' },
    { index: 1, name: 'yani’s cell Microphone' },
    { index: 2, name: 'MacBook Air Microphone' },
  ])
})

test('auto mic skips Zoom and prefers the MacBook microphone', () => {
  const devices = parseAvfoundationDevices(FFMPEG_LIST)
  expect(pickDefaultMic(devices)?.name).toBe('MacBook Air Microphone')
})

test('pcm wav duration reads the data chunk', () => {
  const samples = 48000
  const dataSize = samples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(48000, 24)
  buf.writeUInt32LE(96000, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  expect(pcmWavDurationSec(buf).toFixed(2)).toBe('1.00')
})

test('formatDuration is m:ss', () => {
  expect(formatDuration(0)).toBe('0:00')
  expect(formatDuration(65)).toBe('1:05')
})
