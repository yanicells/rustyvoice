import { useState } from 'react'

import { playWav, revealInFinder, stopPlayback } from '../lib/audio'
import { formatAgo, formatDuration } from '../lib/wav'
import type { Generation, GenerationMode, StudioData, Voice } from '../types'
import { C, CONTENT_MAX_WIDTH, THEME } from '../theme'
import { Column, EmptyState, Header, Icon, IconButton, Pane, Scroller } from './primitives'

const SAMPLES = [
  { label: 'Hello, this is a clone', text: 'Hello, this is a clone of my voice.' },
  { label: 'Birch canoe', text: 'The birch canoe slid on the smooth planks.' },
  { label: 'Leave a message', text: 'Leave a message after the tone, I will call you back.' },
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
      <Header
        title="Speak"
        subtitle={mode === 'clone' ? (voice ? voice.name : 'No voice yet') : 'Voice design'}
      >
        <ModeSwitch mode={mode} onChange={setMode} />
      </Header>

      {data.generations.length === 0 ? (
        <EmptyState
          icon="volume"
          title={mode === 'clone' ? 'Type something. Hear it back.' : 'Describe a voice, then speak'}
          body={
            mode === 'clone'
              ? voice
                ? `Using ${voice.name}. Enter sends. Shift+enter for a new line.`
                : 'Create a voice first, or switch to Design and describe one.'
              : 'Design prepends a short voice description. No reference clip needed.'
          }
        />
      ) : (
        <Scroller>
          <Column gap={10}>
            {data.generations.map((item) => (
              <GenerationRow key={item.id} item={item} onDelete={() => onDelete(item.id)} />
            ))}
          </Column>
        </Scroller>
      )}

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
}: {
  mode: GenerationMode
  onChange: (mode: GenerationMode) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, backgroundColor: C.item, borderRadius: 8, padding: 3 }}>
      <Seg label="Clone" active={mode === 'clone'} onClick={() => onChange('clone')} />
      <Seg label="Design" active={mode === 'design'} onClick={() => onChange('design')} />
    </div>
  )
}

function Seg({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
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
        cursor: 'pointer',
        backgroundColor: active ? C.raised : '#00000000',
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 12, color: active ? C.text : C.tertiary }}>{label}</text>
    </div>
  )
}

function GenerationRow({ item, onDelete }: { item: Generation; onDelete: () => void }) {
  const ago = formatAgo(item.createdAt)
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
        <text
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: C.accent,
            flexShrink: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {item.voiceName}
        </text>
        <text style={{ fontSize: 12, color: C.ghost, flexShrink: 0 }}>
          {`${formatDuration(item.durationSec)} audio · ${(item.elapsedMs / 1000).toFixed(1)}s gen${ago ? ` · ${ago}` : ''}`}
        </text>
        <div style={{ flexGrow: 1 }} />
        <IconButton icon="play" onClick={() => void playWav(item.path)} />
        <IconButton icon="external" onClick={() => revealInFinder(item.path)} />
        <IconButton icon="trash" danger onClick={onDelete} />
      </div>
      <text style={{ fontSize: 14, lineHeight: 20, color: C.text, whiteSpace: 'normal' }}>{item.text}</text>
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
  const status = busy
    ? busy
    : mode === 'clone'
      ? voice
        ? voice.name
        : 'No voice selected'
      : 'Voice design'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        paddingLeft: 24,
        paddingRight: 24,
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
          borderColor: busy ? C.accentDim : C.border,
          paddingTop: 10,
          paddingBottom: 10,
          overflow: 'visible',
        }}
      >
        {mode === 'design' && (
          <>
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
            <div
              style={{
                height: 1,
                backgroundColor: C.border,
                marginLeft: 10,
                marginRight: 10,
                marginTop: 2,
                marginBottom: 6,
              }}
            />
          </>
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
          <Icon name={mode === 'design' ? 'sparkle' : 'audio'} size={12} color={busy ? C.accent : C.tertiary} />
          <text
            style={{
              fontSize: 12.5,
              color: busy ? C.accent : C.secondary,
              flexShrink: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {status}
          </text>
          {logLine && !busy && (
            <text style={{ fontSize: 11.5, color: C.ghost, flexShrink: 0 }}>{logLine}</text>
          )}
          <div style={{ flexGrow: 1 }} />
          <IconButton icon="square" onClick={stopPlayback} />
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
            <Icon name="send" size={12} color={ready ? C.onInverse : C.ghost} />
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          paddingTop: 8,
          alignItems: 'center',
        }}
      >
        {SAMPLES.map((sample) => (
          <SampleChip key={sample.text} sample={sample.label} onClick={() => onSample(sample.text)} />
        ))}
      </div>
    </div>
  )
}

function SampleChip({ sample, onClick }: { sample: string; onClick: () => void }) {
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
        flexShrink: 0,
        cursor: 'pointer',
        hover: { backgroundColor: C.overlayStrong },
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 11.5, color: C.tertiary }}>{sample}</text>
    </div>
  )
}
