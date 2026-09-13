import { useEffect, useState } from 'react'
import { render } from '@gpuix/react'

import { playWav, wavDurationSec } from './lib/audio'
import {
  addGeneration,
  generationPath,
  loadStudio,
  newId,
  removeGeneration,
  removeVoice,
  saveStudio,
  upsertVoice,
} from './lib/store'
import { busyLabelFromLog } from './lib/prompt'
import { modelStatus, prepareClonePrompt, synthesize } from './lib/tts'
import type { GenerationMode, Page, StudioData, Voice } from './types'
import { C } from './theme'
import { Banner } from './ui/primitives'
import { CreateVoicePage } from './ui/create-voice'
import { SettingsPage } from './ui/settings'
import { Sidebar } from './ui/sidebar'
import { SpeakPage } from './ui/speak'
import { VoicesPage } from './ui/voices'

export function App() {
  const [data, setData] = useState<StudioData>(() => loadStudio())
  const [page, setPage] = useState<Page>('speak')
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [logLine, setLogLine] = useState('')

  useEffect(() => {
    saveStudio(data)
  }, [data])

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 8000)
    return () => clearTimeout(id)
  }, [flash])

  const patch = (fn: (current: StudioData) => StudioData) => {
    setData((current) => fn(current))
  }

  const fail = (message: string) => {
    setFlash(message)
    setBusy(null)
  }

  const speak = async (input: { text: string; mode: GenerationMode; design: string }) => {
    const voice = data.voices.find((item) => item.id === data.selectedVoiceId) ?? data.voices[0]
    if (input.mode === 'clone' && !voice) {
      fail('Create a voice first')
      setPage('create')
      return
    }
    const id = newId('gen')
    const outPath = generationPath(id)
    const spoken =
      input.mode === 'design' && input.design.trim()
        ? `(${input.design.trim()})${input.text}`
        : input.text
    setBusy('Loading VoxCPM2…')
    setFlash(null)
    setLogLine('')
    try {
      const prompt =
        input.mode === 'clone' && voice ? await prepareClonePrompt(data.settings, voice) : undefined
      const result = await synthesize(data.settings, {
        text: spoken,
        outPath,
        referencePath: prompt?.referencePath,
        promptText: prompt?.promptText,
        onLog: (line) => {
          const label = busyLabelFromLog(line)
          if (label) {
            setBusy(label)
            setLogLine(line)
          }
        },
      })
      const generation = {
        id,
        voiceId: input.mode === 'clone' ? (voice?.id ?? null) : null,
        voiceName: input.mode === 'clone' ? (voice?.name ?? 'Voice') : input.design.trim() || 'Design',
        text: input.text,
        path: outPath,
        createdAt: new Date().toISOString(),
        elapsedMs: result.elapsedMs,
        durationSec: wavDurationSec(outPath),
        mode: input.mode,
      }
      patch((current) => addGeneration(current, generation))
      setBusy(null)
      setLogLine(`${(result.elapsedMs / 1000).toFixed(1)}s`)
      if (data.settings.autoPlay) void playWav(outPath)
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error))
    }
  }

  const status = modelStatus(data.settings)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        fontFamily: '.SystemUIFont',
        color: C.text,
        backgroundColor: C.canvas,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, minHeight: 0 }}>
        <Sidebar
          page={page}
          data={data}
          status={status}
          onPage={setPage}
          onNewVoice={() => setPage('create')}
          onSelectVoice={(id) => {
            patch((current) => ({ ...current, selectedVoiceId: id }))
            setPage('speak')
          }}
        />
        <div style={{ width: 1, height: '100%', backgroundColor: C.sidebarBorder, flexShrink: 0 }} />
        {page === 'speak' && (
          <SpeakPage
            data={data}
            busy={busy}
            logLine={logLine}
            onSpeak={(input) => void speak(input)}
            onDelete={(id) => patch((current) => removeGeneration(current, id))}
          />
        )}
        {page === 'voices' && (
          <VoicesPage
            data={data}
            onCreate={() => setPage('create')}
            onImported={(voice) => {
              patch((current) => upsertVoice(current, voice))
              setPage('speak')
            }}
            onDelete={(id) => patch((current) => removeVoice(current, id))}
            onRename={(id, name) =>
              patch((current) => ({
                ...current,
                voices: current.voices.map((voice) =>
                  voice.id === id ? { ...voice, name, updatedAt: new Date().toISOString() } : voice,
                ),
              }))
            }
            onSelect={(id) => patch((current) => ({ ...current, selectedVoiceId: id }))}
            onUse={(id) => {
              patch((current) => ({ ...current, selectedVoiceId: id }))
              setPage('speak')
            }}
            onError={fail}
          />
        )}
        {page === 'create' && (
          <CreateVoicePage
            settings={data.settings}
            onCancel={() => setPage('voices')}
            onSaved={(voice: Voice) => {
              patch((current) => upsertVoice(current, voice))
              setPage('speak')
            }}
            onError={fail}
          />
        )}
        {page === 'settings' && (
          <SettingsPage
            settings={data.settings}
            onChange={(settings) => patch((current) => ({ ...current, settings }))}
          />
        )}
      </div>
      {flash && <Banner message={flash} onDismiss={() => setFlash(null)} />}
    </div>
  )
}

const isEntryPoint =
  typeof Bun !== 'undefined'
    ? Bun.isStandaloneExecutable || Bun.main === import.meta.path
    : Boolean(process.argv[1]?.endsWith('app.tsx'))

if (isEntryPoint) {
  render(<App />, {
    title: 'Clone',
    width: 1180,
    height: 780,
    titlebarTransparent: true,
    windowBackground: 'blurred',
    trafficLightX: 16,
    trafficLightY: 17,
  })
}
