export interface Phrase {
  id: string
  text: string
}

/** IEEE Harvard Sentences, Lists 1–4 — phonetically balanced, about two minutes spoken. */
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
  { id: 'h11', text: 'The boy was there when the sun rose.' },
  { id: 'h12', text: 'A rod is used to catch pink salmon.' },
  { id: 'h13', text: 'The source of the huge river is the clear spring.' },
  { id: 'h14', text: 'Kick the ball straight and follow through.' },
  { id: 'h15', text: 'Help the woman get back to her feet.' },
  { id: 'h16', text: 'A pot of tea helps to pass the evening.' },
  { id: 'h17', text: 'Smoky fires lack flame and heat.' },
  { id: 'h18', text: "The soft cushion broke the man's fall." },
  { id: 'h19', text: 'The salt breeze came across from the sea.' },
  { id: 'h20', text: 'The girl at the booth sold fifty bonds.' },
  { id: 'h21', text: 'The small pup gnawed a hole in the sock.' },
  { id: 'h22', text: 'The fish twisted and turned on the bent hook.' },
  { id: 'h23', text: 'Press the pants and sew a button on the vest.' },
  { id: 'h24', text: 'The swan dive was far short of perfect.' },
  { id: 'h25', text: 'The beauty of the view stunned the young boy.' },
  { id: 'h26', text: 'Two blue fish swam in the tank.' },
  { id: 'h27', text: 'Her purse was full of useless trash.' },
  { id: 'h28', text: 'The colt reared and threw the tall rider.' },
  { id: 'h29', text: 'It snowed, rained, and hailed the same morning.' },
  { id: 'h30', text: 'Read verse out loud for pleasure.' },
  { id: 'h31', text: 'Hoist the load to your left shoulder.' },
  { id: 'h32', text: 'Take the winding path to reach the lake.' },
  { id: 'h33', text: 'Note closely the size of the gas tank.' },
  { id: 'h34', text: 'Wipe the grease off his dirty face.' },
  { id: 'h35', text: 'Mend the coat before you go out.' },
  { id: 'h36', text: 'The wrist was badly strained and hung limp.' },
  { id: 'h37', text: 'The stray cat gave birth to kittens.' },
  { id: 'h38', text: 'The young girl gave no clear response.' },
  { id: 'h39', text: 'The meal was cooked before the bell rang.' },
  { id: 'h40', text: 'What joy there is in living.' },
]

/** Three-sentence set that still covers a useful mix of vowels and consonants. */
export const HARVARD_QUICK: Phrase[] = HARVARD_FULL.slice(0, 3)

export type ScriptId = 'quick' | 'page' | 'lines'

export function phrasesFor(script: ScriptId): Phrase[] {
  return script === 'quick' ? HARVARD_QUICK : HARVARD_FULL
}

export function joinPromptText(phrases: Phrase[]): string {
  return phrases.map((phrase) => phrase.text.trim()).filter(Boolean).join(' ')
}

/** Same Harvard lines, written as prose so a single take can flow. */
export const HARVARD_QUICK_PARAS: string[] = [
  "The birch canoe slid on the smooth planks, so glue the sheet to the dark blue background. It's easy to tell the depth of a well.",
]

export const HARVARD_FULL_PARAS: string[] = [
  "The birch canoe slid on the smooth planks, so glue the sheet to the dark blue background. It's easy to tell the depth of a well. These days a chicken leg is a rare dish, and rice is often served in round bowls. The juice of lemons makes fine punch. The box was thrown beside the parked truck, and the hogs were fed chopped corn and garbage. Four hours of steady work faced us, and a large size in stockings is hard to sell.",
  "The boy was there when the sun rose. A rod is used to catch pink salmon, and the source of the huge river is the clear spring. Kick the ball straight and follow through. Help the woman get back to her feet. A pot of tea helps to pass the evening. Smoky fires lack flame and heat. The soft cushion broke the man's fall. The salt breeze came across from the sea, and the girl at the booth sold fifty bonds.",
  'The small pup gnawed a hole in the sock, and the fish twisted and turned on the bent hook. Press the pants and sew a button on the vest. The swan dive was far short of perfect. The beauty of the view stunned the young boy. Two blue fish swam in the tank. Her purse was full of useless trash. The colt reared and threw the tall rider. It snowed, rained, and hailed the same morning. Read verse out loud for pleasure.',
  'Hoist the load to your left shoulder, then take the winding path to reach the lake. Note closely the size of the gas tank. Wipe the grease off his dirty face, and mend the coat before you go out. The wrist was badly strained and hung limp. The stray cat gave birth to kittens. The young girl gave no clear response. The meal was cooked before the bell rang. What joy there is in living.',
]

export function paragraphsFor(script: ScriptId): string[] {
  if (script === 'quick') return HARVARD_QUICK_PARAS
  if (script === 'page') return HARVARD_FULL_PARAS
  return []
}

export function isLineScript(script: ScriptId): boolean {
  return script === 'lines'
}

export function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean).join('\n\n')
}

export function firstPromptSlice(promptText: string): string {
  return promptText.split(/\n\n+/).map((part) => part.trim()).filter(Boolean)[0] ?? ''
}
