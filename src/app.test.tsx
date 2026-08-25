import { expect, test } from 'bun:test'
import { createTestRoot } from '@gpuix/react/testing'
import { App } from './app'

test('paints studio chrome', () => {
  const { render, renderer } = createTestRoot()
  render(<App />)
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('Clone')
  expect(text).toContain('Speak')
  expect(text).toContain('VoxCPM2')
})
