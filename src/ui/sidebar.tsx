import { formatDuration } from '../lib/wav'
import type { Page, StudioData, Voice } from '../types'
import { C, SIDEBAR_WIDTH, TRAFFIC_LIGHT_CLEARANCE } from '../theme'
import { Icon, IconButton } from './primitives'

export function Sidebar({
  page,
  data,
  status,
  onPage,
  onSelectVoice,
  onNewVoice,
}: {
  page: Page
  data: StudioData
  status: { ok: boolean; detail: string }
  onPage: (page: Page) => void
  onSelectVoice: (id: string) => void
  onNewVoice: () => void
}) {
  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: C.sidebar,
        userSelect: 'none',
      }}
    >
      <div style={{ height: TRAFFIC_LIGHT_CLEARANCE, flexShrink: 0 }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 14,
          paddingRight: 10,
          paddingBottom: 10,
        }}
      >
        <Icon name="audio" size={15} color={C.accent} />
        <text style={{ fontSize: 14, fontWeight: 600, color: C.text, flexGrow: 1 }}>Clone</text>
        <IconButton icon="plus" onClick={onNewVoice} testId="new-voice" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 8, paddingRight: 8 }}>
        <NavItem icon="message" label="Speak" active={page === 'speak'} onClick={() => onPage('speak')} testId="nav-speak" />
        <NavItem icon="users" label="Voices" active={page === 'voices' || page === 'create'} onClick={() => onPage('voices')} testId="nav-voices" />
        <NavItem icon="settings" label="Settings" active={page === 'settings'} onClick={() => onPage('settings')} testId="nav-settings" />
      </div>

      <div style={{ height: 14, flexShrink: 0 }} />
      <text style={{ fontSize: 11, fontWeight: 500, color: C.ghost, paddingLeft: 16, paddingBottom: 6 }}>
        Voices
      </text>
      <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'scroll', paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}>
        {data.voices.length === 0 ? (
          <div style={{ paddingLeft: 8, paddingTop: 6, paddingRight: 8 }}>
            <text style={{ fontSize: 12.5, lineHeight: 18, color: C.ghost, whiteSpace: 'normal' }}>
              None yet. Record a reference.
            </text>
          </div>
        ) : (
          data.voices.map((voice) => (
            <VoiceRow
              key={voice.id}
              voice={voice}
              active={voice.id === data.selectedVoiceId && page !== 'settings'}
              onSelect={() => onSelectVoice(voice.id)}
            />
          ))
        )}
      </div>

      <div style={{ height: 1, backgroundColor: C.sidebarBorder, flexShrink: 0 }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 10,
          paddingBottom: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: status.ok ? C.ok : C.danger,
            flexShrink: 0,
          }}
        />
        <text
          style={{
            fontSize: 11.5,
            color: status.ok ? C.tertiary : C.danger,
            flexGrow: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {status.ok ? 'VoxCPM2 ready' : 'Model missing'}
        </text>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  testId,
}: {
  icon: 'message' | 'users' | 'settings'
  label: string
  active: boolean
  onClick: () => void
  testId?: string
}) {
  return (
    <div
      testId={testId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 32,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 7,
        cursor: 'pointer',
        backgroundColor: active ? C.item : '#00000000',
        hover: { backgroundColor: C.item },
      }}
      onClick={onClick}
    >
      <Icon name={icon} size={14} color={active ? C.text : C.secondary} />
      <text style={{ fontSize: 13, color: active ? C.text : C.secondary }}>{label}</text>
    </div>
  )
}

function VoiceRow({
  voice,
  active,
  onSelect,
}: {
  voice: Voice
  active: boolean
  onSelect: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 7,
        paddingBottom: 7,
        borderRadius: 7,
        cursor: 'pointer',
        backgroundColor: active ? C.item : '#00000000',
        hover: { backgroundColor: C.item },
      }}
      onClick={onSelect}
    >
      <div
        style={{
          width: 3,
          height: 28,
          borderRadius: 2,
          backgroundColor: active ? C.accent : '#00000000',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minWidth: 0 }}>
        <text
          style={{
            fontSize: 13,
            color: C.text,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {voice.name}
        </text>
        <text style={{ fontSize: 11.5, color: C.ghost }}>
          {`${formatDuration(voice.durationSec)} · ${voice.source === 'import' ? 'imported' : 'recorded'}`}
        </text>
      </div>
    </div>
  )
}
