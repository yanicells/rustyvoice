import { existsSync } from 'node:fs'
import { useEffect, useState } from 'react'

import { listAudioDevices, type AudioDevice } from '../lib/audio'
import type { Settings } from '../types'
import { C } from '../theme'
import { Button, Field, Header, Pane } from './primitives'

export function SettingsPage({
  settings,
  onChange,
}: {
  settings: Settings
  onChange: (settings: Settings) => void
}) {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [deviceError, setDeviceError] = useState<string | null>(null)

  useEffect(() => {
    void listAudioDevices(settings.ffmpegPath)
      .then((list) => {
        setDevices(list)
        setDeviceError(null)
      })
      .catch((error: unknown) => {
        setDeviceError(error instanceof Error ? error.message : String(error))
      })
  }, [settings.ffmpegPath])

  const patch = (partial: Partial<Settings>) => onChange({ ...settings, ...partial })

  return (
    <Pane>
      <Header title="Settings" />
      <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'scroll', paddingLeft: 20, paddingRight: 20, paddingBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <text style={{ fontSize: 12, fontWeight: 500, color: C.ghost }}>Models</text>
          <Field
            label="voxcpm2-cli"
            value={settings.cliPath}
            onChange={(cliPath) => patch({ cliPath })}
            hint={existsSync(settings.cliPath) ? 'Found' : 'Missing'}
          />
          <Field
            label="BaseLM GGUF"
            value={settings.baseLmPath}
            onChange={(baseLmPath) => patch({ baseLmPath })}
            hint={existsSync(settings.baseLmPath) ? 'Found' : 'Missing'}
          />
          <Field
            label="Acoustic GGUF"
            value={settings.acousticPath}
            onChange={(acousticPath) => patch({ acousticPath })}
            hint={existsSync(settings.acousticPath) ? 'Found' : 'Missing'}
          />

          <text style={{ fontSize: 12, fontWeight: 500, color: C.ghost, paddingTop: 8 }}>Microphone</text>
          <Field label="ffmpeg" value={settings.ffmpegPath} onChange={(ffmpegPath) => patch({ ffmpegPath })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <text style={{ fontSize: 11.5, fontWeight: 500, color: C.ghost }}>Input</text>
            <MicRow
              label="Auto"
              active={settings.micDevice === 'auto'}
              onClick={() => patch({ micDevice: 'auto' })}
            />
            {devices.map((device) => (
              <MicRow
                key={device.index}
                label={`${device.index}  ${device.name}`}
                active={settings.micDevice === String(device.index)}
                onClick={() => patch({ micDevice: String(device.index) })}
              />
            ))}
            {deviceError && <text style={{ fontSize: 12, color: C.danger }}>{deviceError}</text>}
          </div>

          <text style={{ fontSize: 12, fontWeight: 500, color: C.ghost, paddingTop: 8 }}>Synthesis</text>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
            <NumField label="Seed" value={settings.seed} onChange={(seed) => patch({ seed })} />
            <NumField label="CFG" value={settings.cfg} onChange={(cfg) => patch({ cfg })} />
            <NumField label="Timesteps" value={settings.timesteps} onChange={(timesteps) => patch({ timesteps })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
            <NumField label="Temperature" value={settings.temperature} onChange={(temperature) => patch({ temperature })} />
            <NumField label="Max steps" value={settings.maxSteps} onChange={(maxSteps) => patch({ maxSteps })} />
            <NumField label="GPU layers" value={settings.nGpuLayers} onChange={(nGpuLayers) => patch({ nGpuLayers })} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <Toggle
              label="Auto-play"
              active={settings.autoPlay}
              onClick={() => patch({ autoPlay: !settings.autoPlay })}
            />
            <Toggle label="CPU only" active={settings.useCpu} onClick={() => patch({ useCpu: !settings.useCpu })} />
          </div>
          <Button
            label="Reset seed"
            onClick={() => patch({ seed: Math.floor(Math.random() * 10_000) })}
          />
        </div>
      </div>
    </Pane>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Field
      label={label}
      value={String(value)}
      onChange={(next) => {
        const parsed = Number(next)
        if (Number.isFinite(parsed)) onChange(parsed)
      }}
    />
  )
}

function MicRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 8,
        backgroundColor: active ? C.item : C.raised,
        cursor: 'pointer',
        hover: { backgroundColor: C.item },
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 13, color: active ? C.text : C.secondary }}>{label}</text>
    </div>
  )
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      style={{
        height: 32,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: active ? C.accentDim : C.item,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 13, color: active ? C.accent : C.secondary }}>{label}</text>
    </div>
  )
}
