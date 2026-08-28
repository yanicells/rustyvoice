export interface Phrase {
  id: string
  text: string
}

/** IEEE Harvard Sentences, List 1 — phonetically balanced, standard for voice work. */
export const HARVARD_FULL: Phrase[] = [
  { id: 'h01', text: 'The birch canoe slid on the smooth planks.' },
  { id: 'h02', text: 'Glue the sheet to the dark blue background.' },
  { id: 'h03', text: "It's easy to tell the depth of a well." },
  { id: 'h04', text: 'These days a chicken leg is a rare dish.' },
  { id: 'h05', text: 'Rice is often served in round bowls.' },
  { id: 'h06', text: 'The juice of lemons makes fine punch.' },
  { id: 'h07', text: 'The box was thrown beside the parked truck.' },
  { id: 'h08', text: 'The hogs were fed chopped corn and garbage.' },
  { id: 'h09', text: 'Four hours of steady work faced us.' },
  { id: 'h10', text: 'A large size in stockings is hard to sell.' },
]

/** Three-sentence set that still covers a useful mix of vowels and consonants. */
export const HARVARD_QUICK: Phrase[] = HARVARD_FULL.slice(0, 3)

export type ScriptId = 'quick' | 'full'

export function phrasesFor(script: ScriptId): Phrase[] {
  return script === 'quick' ? HARVARD_QUICK : HARVARD_FULL
}

export function joinPromptText(phrases: Phrase[]): string {
  return phrases.map((phrase) => phrase.text.trim()).filter(Boolean).join(' ')
}
