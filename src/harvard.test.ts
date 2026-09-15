import { expect, test } from 'bun:test'

import {
  HARVARD_FULL,
  HARVARD_QUICK,
  firstPromptSlice,
  joinParagraphs,
  joinPromptText,
  paragraphsFor,
  phrasesFor,
} from './harvard'

function fold(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

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

test('paragraph scripts still carry every Harvard sentence', () => {
  expect(paragraphsFor('quick')).toHaveLength(1)
  expect(paragraphsFor('page')).toHaveLength(4)
  expect(paragraphsFor('lines')).toEqual([])
  expect(phrasesFor('lines')).toEqual(HARVARD_FULL)
  const quick = fold(joinParagraphs(paragraphsFor('quick')))
  const full = fold(joinParagraphs(paragraphsFor('page')))
  for (const phrase of HARVARD_QUICK) {
    expect(quick).toContain(fold(phrase.text))
  }
  for (const phrase of HARVARD_FULL) {
    expect(full).toContain(fold(phrase.text))
  }
})

test('firstPromptSlice is the opening paragraph', () => {
  expect(firstPromptSlice(joinParagraphs(paragraphsFor('page')))).toBe(paragraphsFor('page')[0])
})
