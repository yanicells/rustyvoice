import { expect, test } from 'bun:test'

import { HARVARD_FULL, HARVARD_QUICK, joinPromptText, phrasesFor } from './harvard'

test('quick script is the first three Harvard sentences', () => {
  expect(phrasesFor('quick')).toEqual(HARVARD_QUICK)
  expect(HARVARD_QUICK).toHaveLength(3)
  expect(HARVARD_FULL).toHaveLength(40)
  expect(new Set(HARVARD_FULL.map((phrase) => phrase.id)).size).toBe(40)
  expect(new Set(HARVARD_FULL.map((phrase) => phrase.text)).size).toBe(40)
})

test('joinPromptText concatenates recorded lines', () => {
  expect(joinPromptText(HARVARD_QUICK.slice(0, 2))).toBe(
    'The birch canoe slid on the smooth planks. Glue the sheet to the dark blue background.',
  )
})
