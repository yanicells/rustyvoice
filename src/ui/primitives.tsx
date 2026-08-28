import type { ReactNode } from 'react'

import { ICONS, type IconName } from '../lib/icons'
import { C, CONTENT_MAX_WIDTH, THEME, TITLEBAR_HEIGHT } from '../theme'

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
        flexShrink: 0,
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
  hintTone,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  hint?: string
  hintTone?: 'ok' | 'danger' | 'muted'
}) {
  const hintColor = hintTone === 'ok' ? C.ok : hintTone === 'danger' ? C.danger : C.ghost
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <text style={{ fontSize: 11.5, fontWeight: 500, color: C.tertiary, flexGrow: 1 }}>{label}</text>
        {hint ? <text style={{ fontSize: 11.5, color: hintColor }}>{hint}</text> : null}
      </div>
      <input
        value={value}
        placeholder={placeholder}
        theme={THEME}
        style={{
          width: '100%',
          minWidth: 0,
          height: 34,
          paddingLeft: 10,
          paddingRight: 10,
          fontSize: 13,
          color: C.text,
          backgroundColor: C.raised,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          whiteSpace: 'nowrap',
        }}
        onChange={(event) => onChange(event.value ?? '')}
      />
    </div>
  )
}

export function Header({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: TITLEBAR_HEIGHT,
        paddingLeft: 24,
        paddingRight: 20,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <text style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</text>
      {subtitle ? (
        <div
          style={{
            marginLeft: 10,
            paddingLeft: 8,
            paddingRight: 8,
            height: 22,
            borderRadius: 6,
            backgroundColor: C.item,
            display: 'flex',
            alignItems: 'center',
            maxWidth: 240,
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <text
            style={{
              fontSize: 12,
              color: C.secondary,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </text>
        </div>
      ) : null}
      <div style={{ flexGrow: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

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

export function Scroller({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flexGrow: 1,
        minHeight: 0,
        overflowY: 'scroll',
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 28,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}

export function Column({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <text style={{ fontSize: 12, fontWeight: 600, color: C.secondary, paddingTop: 4 }}>{children}</text>
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
        minHeight: 0,
        padding: 40,
      }}
    >
      <Icon name={icon} size={22} color={C.ghost} />
      <text style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{title}</text>
      <text
        style={{
          fontSize: 13,
          lineHeight: 18,
          color: C.tertiary,
          textAlign: 'center',
          maxWidth: 360,
          whiteSpace: 'normal',
        }}
      >
        {body}
      </text>
      {action}
    </div>
  )
}

export function Banner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 16,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: '#2A1C1C',
      }}
    >
      <text
        style={{
          fontSize: 12.5,
          lineHeight: 18,
          color: C.danger,
          flexGrow: 1,
          minWidth: 0,
          whiteSpace: 'normal',
        }}
      >
        {message}
      </text>
      <IconButton icon="x" danger onClick={onDismiss} testId="dismiss-banner" />
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
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'end', gap: 3, height: 28, flexShrink: 0 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <MeterBar key={i} height={5 + Math.abs(Math.sin(t * 7 + i * 0.48)) * 22} />
      ))}
    </div>
  )
}
