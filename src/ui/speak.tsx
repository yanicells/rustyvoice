import { useState } from 'react'

import { playWav, revealInFinder, stopPlayback } from '../lib/audio'
import { formatDuration } from '../lib/wav'
import type { Generation, GenerationMode, StudioData, Voice } from '../types'
import { C, CONTENT_MAX_WIDTH, THEME } from '../theme'
import { EmptyState, Header, Icon, IconButton, Pane } from './primitives'

const SAMPLES = [
  'Hello, this is a clone of my voice.',
  'The birch canoe slid on the smooth planks.',
  'Leave a message after the tone, I will call you back.',
]

export function SpeakPage({
  data,
  busy,
  logLine,
  onSpeak,
  onDelete,
}: {
  data: StudioData
  busy: string | null
  logLine: string
  onSpeak: (input: { text: string; mode: GenerationMode; design: string }) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [design, setDesign] = useState('')
  const [mode, setMode] = useState<GenerationMode>(data.voices.length > 0 ? 'clone' : 'design')
  const voice = data.voices.find((item) => item.id === data.selectedVoiceId) ?? data.voices[0]
  const ready = draft.trim().length > 0 && !busy && (mode === 'design' || Boolean(voice))

  const send = (text: string) => {
    const next = text.trim()
    if (!next || busy) return
    onSpeak({ text: next, mode, design })
    setDraft('')
  }

  return (
    <Pane>
      <Header title="Speak">
        <ModeSwitch mode={mode} onChange={setMode} hasVoices={data.voices.length > 0} />
      </Header>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'scroll', paddingLeft: 20, paddingRight: 20 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            paddingBottom: 20,
          }}
        >
          {data.generations.length === 0 ? (
            <EmptyState
              icon="volume"
              title={mode === 'clone' ? 'Type something. Hear it back.' : 'Describe a voice, then speak'}
              body={
                mode === 'clone'
                  ? voice
                    ? `Using ${voice.name}. Enter sends. Shift+enter for a new line.`
                    : 'Create a voice first, or switch to design and describe one.'
                  : 'Design mode prepends a voice description. No reference clip needed.'
              }
            />
          ) : (
            data.generations.map((item) => (
              <GenerationRow key={item.id} item={item} onDelete={() => onDelete(item.id)} />
            ))
          )}
        </div>
      </div>

      <Composer
        voice={voice}
        mode={mode}
        design={design}
        onDesign={setDesign}
        draft={draft}
        onDraft={setDraft}
        ready={Boolean(ready)}
        busy={busy}
        logLine={logLine}
        onSend={send}
        onSample={(text) => setDraft(text)}
      />
    </Pane>
  )
}

function ModeSwitch({
  mode,
  onChange,
  hasVoices,
}: {
  mode: GenerationMode
  onChange: (mode: GenerationMode) => void
  hasVoices: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, backgroundColor: C.item, borderRadius: 8, padding: 3 }}>
      <Seg label="Clone" active={mode === 'clone'} onClick={() => hasVoices && onChange('clone')} dimmed={!hasVoices} />
      <Seg label="Design" active={mode === 'design'} onClick={() => onChange('design')} />
    </div>
  )
}

function Seg({
  label,
  active,
  onClick,
  dimmed,
}: {
  label: string
  active: boolean
  onClick: () => void
  dimmed?: boolean
}) {
  return (
    <div
      style={{
        paddingLeft: 10,
        paddingRight: 10,
        height: 24,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        cursor: dimmed ? 'default' : 'pointer',
        backgroundColor: active ? C.raised : '#00000000',
        opacity: dimmed ? 0.4 : 1,
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 12, color: active ? C.text : C.tertiary }}>{label}</text>
    </div>
  )
}

function GenerationRow({ item, onDelete }: { item: Generation; onDelete: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        backgroundColor: C.raised,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <text style={{ fontSize: 12, color: C.accent }}>{item.voiceName}</text>
        <text style={{ fontSize: 12, color: C.ghost }}>
          {formatDuration(item.durationSec)} · {(item.elapsedMs / 1000).toFixed(1)}s
        </text>
        <div style={{ flexGrow: 1 }} />
        <IconButton icon="play" onClick={() => void playWav(item.path)} />
        <IconButton icon="external" onClick={() => revealInFinder(item.path)} />
        <IconButton icon="trash" danger onClick={onDelete} />
      </div>
      <text style={{ fontSize: 14, lineHeight: 20, color: C.text }}>{item.text}</text>
    </div>
  )
}

function Composer({
  voice,
  mode,
  design,
  onDesign,
  draft,
  onDraft,
  ready,
  busy,
  logLine,
  onSend,
  onSample,
}: {
  voice?: Voice
  mode: GenerationMode
  design: string
  onDesign: (value: string) => void
  draft: string
  onDraft: (value: string) => void
  ready: boolean
  busy: string | null
  logLine: string
  onSend: (text: string) => void
  onSample: (text: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 16,
        overflow: 'visible',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          backgroundColor: C.composer,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: C.border,
          paddingTop: 10,
          paddingBottom: 10,
          overflow: 'visible',
        }}
      >
        {mode === 'design' && (
          <input
            value={design}
            placeholder="A calm male voice, slightly low, unhurried"
            theme={THEME}
            style={{
              width: '100%',
              height: 30,
              paddingLeft: 10,
              paddingRight: 10,
              fontSize: 12.5,
              color: C.secondary,
              backgroundColor: '#00000000',
              borderWidth: 0,
            }}
            onChange={(event) => onDesign(event.value ?? '')}
          />
        )}
        <textarea
          testId="composer"
          value={draft}
          placeholder={mode === 'clone' ? 'Say this…' : 'Write the line…'}
          minRows={1}
          maxRows={5}
          autoFocus
          theme={THEME}
          style={{
            width: '100%',
            minWidth: 0,
            fontSize: 14,
            lineHeight: 20,
            color: C.text,
            backgroundColor: '#00000000',
            borderWidth: 0,
            paddingLeft: 10,
            paddingRight: 10,
          }}
          onChange={(event) => onDraft(event.value ?? '')}
          onSubmit={(event) => onSend(event.value ?? draft)}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <Icon name={mode === 'design' ? 'sparkle' : 'audio'} size={12} color={C.tertiary} />
          <text style={{ fontSize: 12.5, color: C.secondary }}>
            {busy ?? (mode === 'clone' ? (voice ? voice.name : 'No voice') : 'Voice design')}
          </text>
          {logLine && !busy && <text style={{ fontSize: 11.5, color: C.ghost }}>{logLine}</text>}
          <div style={{ flexGrow: 1 }} />
          <div
            testId="speak"
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: ready ? C.inverse : C.item,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: ready ? 'pointer' : 'default',
              hover: ready ? { opacity: 0.9 } : undefined,
            }}
            onClick={() => ready && onSend(draft)}
          >
            <Icon name="play" size={12} color={ready ? C.onInverse : C.ghost} />
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 6,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          paddingTop: 8,
          paddingLeft: 4,
        }}
      >
        {SAMPLES.map((sample) => (
          <SampleChip key={sample} sample={sample} onClick={() => onSample(sample)} />
        ))}
        <div style={{ marginLeft: 4, cursor: 'pointer' }} onClick={stopPlayback}>
          <text style={{ fontSize: 11.5, color: C.ghost }}>stop audio</text>
        </div>
      </div>
    </div>
  )
}

function SampleChip({ sample, onClick }: { sample: string; onClick: () => void }) {
  const label = sample.length > 34 ? `${sample.slice(0, 32)}…` : sample
  return (
    <div
      style={{
        paddingLeft: 8,
        paddingRight: 8,
        height: 24,
        borderRadius: 6,
        backgroundColor: C.item,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        hover: { backgroundColor: C.overlayStrong },
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 11.5, color: C.tertiary }}>{label}</text>
    </div>
  )
}

