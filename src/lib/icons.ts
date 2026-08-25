import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import audio from '../assets/icons/audio.svg' with { type: 'file' }
import check from '../assets/icons/check.svg' with { type: 'file' }
import chevronDown from '../assets/icons/chevron-down.svg' with { type: 'file' }
import copy from '../assets/icons/copy.svg' with { type: 'file' }
import external from '../assets/icons/external.svg' with { type: 'file' }
import folder from '../assets/icons/folder.svg' with { type: 'file' }
import message from '../assets/icons/message.svg' with { type: 'file' }
import mic from '../assets/icons/mic.svg' with { type: 'file' }
import play from '../assets/icons/play.svg' with { type: 'file' }
import plus from '../assets/icons/plus.svg' with { type: 'file' }
import rotate from '../assets/icons/rotate.svg' with { type: 'file' }
import settings from '../assets/icons/settings.svg' with { type: 'file' }
import skip from '../assets/icons/skip.svg' with { type: 'file' }
import sparkle from '../assets/icons/sparkle.svg' with { type: 'file' }
import square from '../assets/icons/square.svg' with { type: 'file' }
import trash from '../assets/icons/trash.svg' with { type: 'file' }
import upload from '../assets/icons/upload.svg' with { type: 'file' }
import users from '../assets/icons/users.svg' with { type: 'file' }
import volume from '../assets/icons/volume.svg' with { type: 'file' }

const RAW = {
  audio,
  check,
  chevronDown,
  copy,
  external,
  folder,
  message,
  mic,
  play,
  plus,
  rotate,
  settings,
  skip,
  sparkle,
  square,
  trash,
  upload,
  users,
  volume,
} as const

export type IconName = keyof typeof RAW

function realAssetPath(virtualPath: string): string {
  if (!virtualPath.includes('/$bunfs/')) return virtualPath
  const destDir = join(tmpdir(), 'voice-clone-icons')
  mkdirSync(destDir, { recursive: true })
  const dest = join(destDir, basename(virtualPath))
  writeFileSync(dest, readFileSync(virtualPath))
  return dest
}

export const ICONS: Record<IconName, string> = Object.fromEntries(
  Object.entries(RAW).map(([name, path]) => [name, realAssetPath(path)]),
) as Record<IconName, string>
