import type { ReactNode } from 'react'

import { ICONS, type IconName } from '../lib/icons'
import { C, THEME } from '../theme'

export function Icon({ name, size = 14, color }: { name: IconName; size?: number; color: string }) {
  return <svg src={ICONS[name]} style={{ width: size, height: size, flexShrink: 0, color }} />
}

export function IconButton({
  icon,
  onClick,
  dimmed,
  size = 14,
  testId,
  danger,
}: {
  icon: IconName
  onClick?: () => void
  dimmed?: boolean
  size?: number
  testId?: string
  danger?: boolean
}) {
  const color = danger ? C.danger : C.tertiary
  return (
    <div
      testId={testId}
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: dimmed ? 'default' : 'pointer',
        opacity: dimmed ? 0.35 : 1,
        hover: dimmed ? undefined : { backgroundColor: C.overlay },
        active: dimmed ? undefined : { backgroundColor: C.overlayStrong },
      }}
      onClick={dimmed ? undefined : onClick}
    >
      <Icon name={icon} size={size} color={color} />
    </div>
  )
}

export function Button({
  label,
  icon,
  onClick,
  variant = 'ghost',
  disabled,
  testId,
}: {
  label: string
  icon?: IconName
  onClick?: () => void
  variant?: 'ghost' | 'primary' | 'danger' | 'accent'
  disabled?: boolean
  testId?: string
}) {
  const palette = {
    ghost: { bg: C.item, fg: C.text, hover: C.overlayStrong },
    primary: { bg: C.inverse, fg: C.onInverse, hover: '#F4F5F7' },
    danger: { bg: '#3A2424', fg: C.danger, hover: '#4A2C2C' },
    accent: { bg: C.accent, fg: C.onInverse, hover: '#EA8A6A' },
  }[variant]
  return (
    <div
      testId={testId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 32,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
        backgroundColor: disabled ? C.item : palette.bg,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        userSelect: 'none',
        hover: disabled ? undefined : { backgroundColor: palette.hover },
      }}
      onClick={disabled ? undefined : onClick}
    >
      {icon && <Icon name={icon} size={13} color={disabled ? C.ghost : palette.fg} />}
      <text style={{ fontSize: 13, fontWeight: 500, color: disabled ? C.ghost : palette.fg }}>{label}</text>
    </div>
  )
}

export function Field({
  label,
  value,
  placeholder,
  onChange,
  hint,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1, minWidth: 160 }}>
      <text style={{ fontSize: 11.5, fontWeight: 500, color: C.ghost }}>{label}</text>
      <input
        value={value}
        placeholder={placeholder}
        theme={THEME}
        style={{
          width: '100%',
          height: 34,
          paddingLeft: 10,
          paddingRight: 10,
          fontSize: 13,
          color: C.text,
          backgroundColor: C.raised,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
        }}
        onChange={(event) => onChange(event.value ?? '')}
      />
      {hint && <text style={{ fontSize: 11.5, color: C.ghost }}>{hint}</text>}
    </div>
  )
}

export function Header({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: TITLEBAR,
        paddingLeft: 20,
        paddingRight: 16,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <text style={{ fontSize: 13, fontWeight: 500, color: C.secondary }}>{title}</text>
      <div style={{ flexGrow: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

const TITLEBAR = 48

export function Pane({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        minWidth: 0,
        height: '100%',
        backgroundColor: C.canvas,
      }}
    >
      {children}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexGrow: 1,
        padding: 40,
      }}
    >
      <Icon name={icon} size={22} color={C.ghost} />
      <text style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{title}</text>
      <text style={{ fontSize: 13, color: C.tertiary, textAlign: 'center', maxWidth: 360 }}>{body}</text>
      {action}
    </div>
  )
}

function MeterBar({ height }: { height: number }) {
  return (
    <div
      style={{
        width: 4,
        height,
        borderRadius: 2,
        backgroundColor: C.accent,
        flexShrink: 0,
      }}
    />
  )
}

export function Meter({ t }: { t: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'end', gap: 3, height: 32 }}>
      {Array.from({ length: 18 }, (_, i) => (
        <MeterBar key={i} height={5 + Math.abs(Math.sin(t * 7 + i * 0.48)) * 24} />
      ))}
    </div>
  )
}
