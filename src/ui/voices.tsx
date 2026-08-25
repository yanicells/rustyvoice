import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { importWav, pickAudioFile, playWav, revealInFinder, wavDurationSec } from '../lib/audio'
import { voiceDir } from '../lib/paths'
import { newId } from '../lib/store'
import { formatDuration } from '../lib/wav'
import type { StudioData, Voice } from '../types'
import { C, THEME } from '../theme'
import { Button, EmptyState, Header, IconButton, Pane } from './primitives'

export function VoicesPage({
  data,
  onCreate,
  onImported,
  onDelete,
  onRename,
  onSelect,
  onError,
}: {
  data: StudioData
  onCreate: () => void
  onImported: (voice: Voice) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onSelect: (id: string) => void
  onError: (message: string) => void
}) {
  const importFile = async () => {
    try {
      const src = await pickAudioFile()
      if (!src) return
      const id = newId('voice')
      mkdirSync(join(voiceDir(id), 'takes'), { recursive: true })
      const dest = join(voiceDir(id), 'reference.wav')
      await importWav(data.settings.ffmpegPath, src, dest)
      const now = new Date().toISOString()
      onImported({
        id,
        name: src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Imported',
        createdAt: now,
        updatedAt: now,
        referencePath: dest,
        promptText: '',
        takes: [],
        source: 'import',
        durationSec: wavDurationSec(dest),
      })
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <Pane>
      <Header title="Voices">
        <Button label="Import" icon="upload" onClick={() => void importFile()} />
        <Button label="Record" icon="mic" variant="primary" onClick={onCreate} />
      </Header>
      {data.voices.length === 0 ? (
        <EmptyState
          icon="users"
          title="No voices yet"
          body="Record Harvard sentences, or import a clean WAV of your own voice."
          action={<Button label="Record a voice" icon="mic" variant="primary" onClick={onCreate} />}
        />
      ) : (
        <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'scroll', paddingLeft: 20, paddingRight: 20, paddingBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
            {data.voices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                selected={voice.id === data.selectedVoiceId}
                onSelect={() => onSelect(voice.id)}
                onDelete={() => onDelete(voice.id)}
                onRename={(name) => onRename(voice.id, name)}
              />
            ))}
          </div>
        </div>
      )}
    </Pane>
  )
}

function VoiceCard({
  voice,
  selected,
  onSelect,
  onDelete,
  onRename,
}: {
  voice: Voice
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: C.raised,
        borderWidth: 1,
        borderColor: selected ? C.borderStrong : C.border,
        cursor: 'pointer',
      }}
      onClick={onSelect}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: C.accentDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <text style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>
          {voice.name.slice(0, 1).toUpperCase()}
        </text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1, minWidth: 0 }}>
        <input
          value={voice.name}
          theme={THEME}
          style={{
            width: '100%',
            height: 22,
            fontSize: 14,
            color: C.text,
            backgroundColor: '#00000000',
            borderWidth: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          onChange={(event) => onRename((event.value ?? voice.name).trim() || voice.name)}
        />
        <text style={{ fontSize: 12, color: C.ghost }}>
          {formatDuration(voice.durationSec)} · {voice.takes.length > 0 ? `${voice.takes.length} takes` : voice.source}
        </text>
      </div>
      <IconButton icon="play" onClick={() => void playWav(voice.referencePath)} />
      <IconButton icon="external" onClick={() => revealInFinder(voice.referencePath)} />
      <IconButton icon="trash" danger onClick={onDelete} />
    </div>
  )
}
