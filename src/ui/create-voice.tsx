import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { useEffect, useState, type ReactNode } from 'react'

import {
  isLineScript,
  joinParagraphs,
  joinPromptText,
  paragraphsFor,
  phrasesFor,
  type ScriptId,
} from '../harvard'
import { concatWavs, playWav, resolveMicIndex, startRecording, stopPlayback, stopRecording, wavDurationSec } from '../lib/audio'
import { voiceDir } from '../lib/paths'
import { newId } from '../lib/store'
import { formatClock } from '../lib/wav'
import type { Settings, Take, Voice } from '../types'
import { C } from '../theme'
import { Button, Column, Field, Header, Meter, Pane, Scroller } from './primitives'

export function CreateVoicePage({
  settings,
  onCancel,
  onSaved,
  onError,
}: {
  settings: Settings
  onCancel: () => void
  onSaved: (voice: Voice) => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [script, setScript] = useState<ScriptId>('quick')
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [takes, setTakes] = useState<Record<string, Take>>({})
  const [pageTake, setPageTake] = useState<Take | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tick, setTick] = useState(0)
  const [saving, setSaving] = useState(false)

  const lineMode = isLineScript(script)
  const phrases = phrasesFor('lines')
  const phrase = phrases[index]
  const paragraphs = paragraphsFor(script)
  const promptText = joinParagraphs(paragraphs)
  const started = voiceId != null
  const recordedCount = Object.keys(takes).length
  const lineTake = phrase ? takes[phrase.id] : undefined
  const last = index >= phrases.length - 1

  useEffect(() => {
    if (!recording) return
    const startedAt = Date.now()
    const id = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000)
      setTick((value) => value + 0.08)
    }, 80)
    return () => clearInterval(id)
  }, [recording])

  const begin = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      onError('Name the voice first')
      return
    }
    const id = newId('voice')
    mkdirSync(join(voiceDir(id), 'takes'), { recursive: true })
    setVoiceId(id)
    setIndex(0)
    setTakes({})
    setPageTake(null)
  }

  const takePath = (id: string) => join(voiceDir(id), 'takes', lineMode ? `${phrase?.id ?? 'line'}.wav` : 'script.wav')

  const record = async () => {
    if (!voiceId || recording) return
    if (lineMode && !phrase) return
    try {
      stopPlayback()
      const mic = await resolveMicIndex(settings.ffmpegPath, settings.micDevice)
      await startRecording({ ffmpegPath: settings.ffmpegPath, deviceIndex: mic.index, outPath: takePath(voiceId) })
      setElapsed(0)
      setRecording(true)
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const stop = async () => {
    if (!voiceId) return
    try {
      await stopRecording()
      setRecording(false)
      const path = takePath(voiceId)
      const durationSec = wavDurationSec(path)
      const minSec = lineMode ? 0.6 : 2
      if (durationSec < minSec) {
        onError(
          lineMode
            ? 'That take was too short. Hold record while you read the line.'
            : 'That take was too short. Hold record while you read the whole script.',
        )
        return
      }
      if (lineMode && phrase) {
        setTakes((current) => ({
          ...current,
          [phrase.id]: { phraseId: phrase.id, path, durationSec },
        }))
        return
      }
      setPageTake({ phraseId: 'script', path, durationSec })
    } catch (error) {
      setRecording(false)
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const save = async () => {
    if (!voiceId || saving) return
    const ordered = lineMode ? phrases.map((item) => takes[item.id]).filter(Boolean) : pageTake ? [pageTake] : []
    if (ordered.length === 0) {
      onError(lineMode ? 'Record at least one line' : 'Record the script first')
      return
    }
    setSaving(true)
    try {
      const referencePath = join(voiceDir(voiceId), 'reference.wav')
      await concatWavs(
        settings.ffmpegPath,
        ordered.map((item) => item.path),
        referencePath,
      )
      const used = lineMode ? phrases.filter((item) => takes[item.id]) : []
      const now = new Date().toISOString()
      const durationSec = wavDurationSec(referencePath)
      onSaved({
        id: voiceId,
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
        referencePath,
        promptText: lineMode ? joinPromptText(used) : promptText,
        takes: lineMode
          ? ordered
          : [{ ...ordered[0], path: referencePath, durationSec }],
        source: 'record',
        durationSec,
      })
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
      setSaving(false)
    }
  }

  return (
    <Pane>
      <Header title="New voice">
        <Button label="Cancel" onClick={onCancel} />
      </Header>
      <Scroller>
        <Column gap={18}>
          {!started ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <text style={{ fontSize: 22, fontWeight: 500, color: C.text }}>Record a reference</text>
                <text style={{ fontSize: 13.5, lineHeight: 20, color: C.secondary, whiteSpace: 'normal' }}>
                  Read Harvard sentences in a quiet room. Quick and Paragraph are one take. Sentences is one short line at a time. VoxCPM2 still clones from about 25 seconds.
                </text>
              </div>
              <Field label="Name" value={name} placeholder="Voice name" onChange={setName} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ScriptCard
                  title="Quick"
                  body="One short paragraph · about 20 seconds"
                  active={script === 'quick'}
                  onClick={() => setScript('quick')}
                />
                <ScriptCard
                  title="Paragraph"
                  body="Long Harvard prose · one take"
                  active={script === 'page'}
                  onClick={() => setScript('page')}
                />
                <ScriptCard
                  title="Sentences"
                  body="40 short lines · one at a time"
                  active={script === 'lines'}
                  onClick={() => setScript('lines')}
                />
              </div>
              <Button label="Start recording" icon="mic" variant="primary" testId="start-record" onClick={begin} />
            </>
          ) : lineMode && phrase ? (
            <>
              <text style={{ fontSize: 12, color: C.ghost }}>
                {`Line ${index + 1} of ${phrases.length} · ${recordedCount} saved`}
              </text>
              <Dots
                index={index}
                takes={takes}
                phrases={phrases}
                onJump={(next) => !recording && setIndex(next)}
              />
              <ScriptPanel recording={recording}>
                <text style={{ fontSize: 22, lineHeight: 32, color: C.text, whiteSpace: 'normal' }}>
                  {phrase.text}
                </text>
              </ScriptPanel>
              <RecordStatus
                recording={recording}
                tick={tick}
                elapsed={elapsed}
                saved={Boolean(lineTake)}
                savedLabel={lineTake ? `Saved ${formatClock(lineTake.durationSec)}` : undefined}
                idle="Read it naturally. Stop when the line is done."
              />
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {recording ? (
                  <Button label="Stop" icon="square" variant="accent" onClick={() => void stop()} />
                ) : (
                  <Button
                    label={lineTake ? 'Re-record' : 'Record'}
                    icon="mic"
                    variant={lineTake ? 'ghost' : 'primary'}
                    onClick={() => void record()}
                  />
                )}
                <Button
                  label="Listen"
                  icon="play"
                  disabled={!lineTake || recording}
                  onClick={() => lineTake && void playWav(lineTake.path)}
                />
                <Button
                  label="Back"
                  disabled={recording || index === 0}
                  onClick={() => setIndex((value) => Math.max(0, value - 1))}
                />
                {last ? (
                  <Button
                    label={saving ? 'Saving…' : 'Save voice'}
                    variant="primary"
                    disabled={recording || recordedCount === 0 || saving}
                    onClick={() => void save()}
                  />
                ) : (
                  <Button
                    label="Next line"
                    variant={lineTake && !recording ? 'primary' : 'ghost'}
                    disabled={recording}
                    onClick={() => setIndex((value) => Math.min(phrases.length - 1, value + 1))}
                  />
                )}
              </div>
            </>
          ) : !lineMode ? (
            <>
              <text style={{ fontSize: 12, color: C.ghost }}>
                {pageTake ? `Saved ${formatClock(pageTake.durationSec)}` : 'One take · read it like a page, not a list'}
              </text>
              <ScriptPanel recording={recording}>
                {paragraphs.map((paragraph) => (
                  <text
                    key={paragraph.slice(0, 24)}
                    style={{ fontSize: 16, lineHeight: 24, color: C.text, whiteSpace: 'normal' }}
                  >
                    {paragraph}
                  </text>
                ))}
              </ScriptPanel>
              <RecordStatus
                recording={recording}
                tick={tick}
                elapsed={elapsed}
                saved={Boolean(pageTake)}
                idle="Read it naturally. Stop when the last paragraph is done."
              />
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {recording ? (
                  <Button label="Stop" icon="square" variant="accent" onClick={() => void stop()} />
                ) : (
                  <Button
                    label={pageTake ? 'Re-record' : 'Record'}
                    icon="mic"
                    variant={pageTake ? 'ghost' : 'primary'}
                    onClick={() => void record()}
                  />
                )}
                <Button
                  label="Listen"
                  icon="play"
                  disabled={!pageTake || recording}
                  onClick={() => pageTake && void playWav(pageTake.path)}
                />
                <Button
                  label={saving ? 'Saving…' : 'Save voice'}
                  variant="primary"
                  disabled={recording || !pageTake || saving}
                  onClick={() => void save()}
                />
              </div>
            </>
          ) : null}
        </Column>
      </Scroller>
    </Pane>
  )
}

function ScriptPanel({ recording, children }: { recording: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 20,
        borderRadius: 14,
        backgroundColor: C.raised,
        borderWidth: 1,
        borderColor: recording ? C.accent : C.border,
      }}
    >
      {children}
    </div>
  )
}

function RecordStatus({
  recording,
  tick,
  elapsed,
  saved,
  savedLabel,
  idle,
}: {
  recording: boolean
  tick: number
  elapsed: number
  saved: boolean
  savedLabel?: string
  idle: string
}) {
  if (recording) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Meter t={tick} />
        <text style={{ fontSize: 18, color: C.accent }}>{formatClock(elapsed)}</text>
      </div>
    )
  }
  return (
    <text style={{ fontSize: 13, color: saved ? C.ok : C.tertiary, whiteSpace: 'normal' }}>
      {saved ? savedLabel ?? 'Keep this take, or record again.' : idle}
    </text>
  )
}

function ScriptCard({
  title,
  body,
  active,
  onClick,
}: {
  title: string
  body: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexGrow: 1,
        minWidth: 0,
        padding: 14,
        borderRadius: 10,
        backgroundColor: active ? C.accentDim : C.raised,
        borderWidth: 1,
        borderColor: active ? C.accent : C.border,
        cursor: 'pointer',
        hover: { borderColor: active ? C.accent : C.borderStrong },
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</text>
      <text style={{ fontSize: 12, lineHeight: 16, color: C.tertiary, whiteSpace: 'normal' }}>{body}</text>
    </div>
  )
}

function Dot({
  filled,
  current,
  onClick,
}: {
  filled: boolean
  current: boolean
  onClick: () => void
}) {
  return (
    <div
      style={{
        width: current ? 16 : 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: filled ? C.accent : current ? C.text : C.ghost,
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={onClick}
    />
  )
}

function Dots({
  index,
  takes,
  phrases,
  onJump,
}: {
  index: number
  takes: Record<string, Take>
  phrases: { id: string }[]
  onJump: (index: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {phrases.map((item, i) => (
        <Dot
          key={item.id}
          filled={Boolean(takes[item.id])}
          current={i === index}
          onClick={() => onJump(i)}
        />
      ))}
    </div>
  )
}
