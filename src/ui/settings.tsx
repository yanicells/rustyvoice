import { existsSync } from 'node:fs'
import { useEffect, useState } from 'react'

import { listAudioDevices, type AudioDevice } from '../lib/audio'
import type { Settings } from '../types'
import { C } from '../theme'
import { Button, Column, Field, Header, Icon, Pane, Scroller, SectionLabel } from './primitives'

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
      <Scroller>
        <Column gap={14}>
          <SectionLabel>Models</SectionLabel>
          <PathField
            label="voxcpm2-cli"
            value={settings.cliPath}
            onChange={(cliPath) => patch({ cliPath })}
          />
          <PathField
            label="BaseLM GGUF"
            value={settings.baseLmPath}
            onChange={(baseLmPath) => patch({ baseLmPath })}
          />
          <PathField
            label="Acoustic GGUF"
            value={settings.acousticPath}
            onChange={(acousticPath) => patch({ acousticPath })}
          />

          <SectionLabel>Microphone</SectionLabel>
          <PathField
            label="ffmpeg"
            value={settings.ffmpegPath}
            onChange={(ffmpegPath) => patch({ ffmpegPath })}
          />
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
            {deviceError && (
              <text style={{ fontSize: 12, lineHeight: 16, color: C.danger, whiteSpace: 'normal' }}>
                {deviceError}
              </text>
            )}
          </div>

          <SectionLabel>Synthesis</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 3, gap: 10 }}>
            <NumField label="Seed" value={settings.seed} onChange={(seed) => patch({ seed })} />
            <NumField label="CFG" value={settings.cfg} onChange={(cfg) => patch({ cfg })} />
            <NumField label="Timesteps" value={settings.timesteps} onChange={(timesteps) => patch({ timesteps })} />
            <NumField label="Temperature" value={settings.temperature} onChange={(temperature) => patch({ temperature })} />
            <NumField label="Max steps" value={settings.maxSteps} onChange={(maxSteps) => patch({ maxSteps })} />
            <NumField label="GPU layers" value={settings.nGpuLayers} onChange={(nGpuLayers) => patch({ nGpuLayers })} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
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
        </Column>
      </Scroller>
    </Pane>
  )
}

function PathField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const found = existsSync(value)
  return (
    <Field
      label={label}
      value={value}
      onChange={onChange}
      hint={found ? 'Found' : 'Missing'}
      hintTone={found ? 'ok' : 'danger'}
    />
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
        gap: 8,
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
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: active ? C.accent : C.ghost,
          flexShrink: 0,
        }}
      />
      <text
        style={{
          fontSize: 13,
          color: active ? C.text : C.secondary,
          flexGrow: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}
      >
        {label}
      </text>
    </div>
  )
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      style={{
        height: 32,
        paddingLeft: 10,
        paddingRight: 12,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: active ? C.accentDim : C.item,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {active ? <Icon name="check" size={12} color={C.accent} /> : null}
      <text style={{ fontSize: 13, color: active ? C.accent : C.secondary }}>{label}</text>
    </div>
  )
}
