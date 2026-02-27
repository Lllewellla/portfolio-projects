import type { ProjectArtifact, ProjectMeta, Stakeholder } from '../types/project'
import { mockProjectMeta } from './mock'

const STAKEHOLDERS: Stakeholder[] = [
  'client',
  'marketing',
  'production',
  'finance',
  'legal',
  'users',
  'internal',
]

const ARTIFACT_TYPES = ['quote', 'insight', 'constraint', 'pivot', 'task'] as const

function parseMetaBlock(lines: string[]): Partial<ProjectMeta> {
  const meta: Record<string, string> = {}
  for (const line of lines) {
    const m = line.match(/^\s*[-*]?\s*\*\*(.+?)\*\*:\s*(.+)$/) || line.match(/^\s*[-*]?\s*(.+?):\s*(.+)$/)
    if (m) {
      const key = m[1].trim().toLowerCase()
      const value = m[2].trim()
      if (key.includes('название')) meta.title = value
      else if (key.includes('клиент')) meta.clientName = value
      else if (key.includes('продукт')) meta.productName = value
      else if (key.includes('картинка')) meta.mainImageUrl = value
      else if (key.includes('срок')) meta.timeframe = value
      else if (key.includes('объём')) meta.scope = value
    }
  }
  return {
    id: meta.title ? meta.title.replace(/\s+/g, '-').slice(0, 40) : 'project',
    title: meta.title ?? '',
    clientName: meta.clientName ?? '',
    productName: meta.productName ?? '',
    mainImageUrl: meta.mainImageUrl ?? '',
    timeframe: meta.timeframe ?? '',
    scope: meta.scope ?? '',
  }
}

function parseArtifactsBlock(text: string): ProjectArtifact[] {
  const artifacts: ProjectArtifact[] = []
  // Блоки артефактов: ### type ; stakeholder ; weight\n\nтекст
  const blockRe = /^###\s+(.+?)\s*;\s*(.+?)\s*;\s*(\d+)\s*$/gm
  let match: RegExpExecArray | null
  const blocks: { type: string; stakeholder: string; weight: number; start: number; end: number }[] = []
  while ((match = blockRe.exec(text)) !== null) {
    const type = match[1].trim().toLowerCase()
    const stakeholder = match[2].trim().toLowerCase()
    const weight = Math.min(5, Math.max(1, parseInt(match[3], 10)))
    const start = match.index + match[0].length
    blocks.push({ type, stakeholder, weight, start, end: 0 })
    if (blocks.length >= 2) {
      blocks[blocks.length - 2].end = match.index
    }
  }
  if (blocks.length >= 1) {
    blocks[blocks.length - 1].end = text.length
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const rawText = text.slice(b.start, b.end).trim()
    const textContent = rawText.replace(/^\s*\n+|\n+\s*$/g, '').trim()
    const type = ARTIFACT_TYPES.includes(b.type as (typeof ARTIFACT_TYPES)[number])
      ? (b.type as ProjectArtifact['type'])
      : 'quote'
    const stakeholder = STAKEHOLDERS.includes(b.stakeholder as Stakeholder)
      ? (b.stakeholder as Stakeholder)
      : 'internal'
    artifacts.push({
      id: `artifact-${i + 1}`,
      type,
      stakeholder,
      text: textContent,
      weight: b.weight,
    })
  }
  return artifacts
}

export function parseProjectMd(md: string): { meta: ProjectMeta; artifacts: ProjectArtifact[] } {
  let metaBlock = ''
  let afterMeta = md
  const metaHead = md.indexOf('## Метаданные')
  if (metaHead >= 0) {
    const nextH2 = md.indexOf('\n## ', metaHead + 1)
    metaBlock = nextH2 >= 0 ? md.slice(metaHead, nextH2) : md.slice(metaHead)
    afterMeta = nextH2 >= 0 ? md.slice(nextH2) : ''
  }
  const metaLines = metaBlock
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  const metaParsed = parseMetaBlock(metaLines)
  const meta: ProjectMeta = {
    id: metaParsed.id ?? mockProjectMeta.id,
    title: metaParsed.title?.trim() || mockProjectMeta.title,
    clientName: metaParsed.clientName?.trim() || mockProjectMeta.clientName,
    productName: metaParsed.productName?.trim() || mockProjectMeta.productName,
    mainImageUrl: metaParsed.mainImageUrl?.trim() || mockProjectMeta.mainImageUrl,
    timeframe: metaParsed.timeframe?.trim() || mockProjectMeta.timeframe,
    scope: metaParsed.scope?.trim() || mockProjectMeta.scope,
  }

  const artifacts = parseArtifactsBlock(afterMeta)
  return { meta, artifacts }
}

export async function loadProjectContent(
  url = '/content/project.md',
): Promise<{ meta: ProjectMeta; artifacts: ProjectArtifact[] }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load content: ${res.status}`)
  const md = await res.text()
  return parseProjectMd(md)
}
