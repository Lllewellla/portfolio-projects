import type { ProjectArtifact, ProjectMeta, Stakeholder } from '../types/project'
import { mockProjectMeta } from '../data/mock'

const TASK_KEYWORDS = ['срочно', '!']
const CONSTRAINT_KEYWORDS = ['ограничение', 'нельзя', 'запрет', 'себестоимость']
const INSIGHT_KEYWORDS = ['выяснили', 'оказалось', 'по тестам', 'инсайт']
const PIVOT_KEYWORDS = ['меняем', 'переезжаем', 'делаем по-другому']

const STAKEHOLDER_KEYWORDS: Array<{ key: Stakeholder; patterns: string[] }> = [
  { key: 'client', patterns: ['клиент', 'заказчик'] },
  { key: 'marketing', patterns: ['маркетинг', 'бренд', 'бренда'] },
  { key: 'production', patterns: ['производство', 'цех', 'технолог'] },
  { key: 'finance', patterns: ['финансы', 'бюджет', 'экономист'] },
  { key: 'legal', patterns: ['юрист', 'legal', 'юридический'] },
  { key: 'users', patterns: ['оператор', 'пользователь', 'юзер'] },
  { key: 'internal', patterns: ['команда', 'мы', 'внутри'] },
]

export function parseProjectDescription(text: string): Partial<ProjectMeta> {
  if (!text.trim()) {
    return mockProjectMeta
  }

  const titleMatch = text.match(/Название[:\-]\s*(.+)/i)
  const clientMatch = text.match(/Клиент[:\-]\s*(.+)/i)
  const productMatch = text.match(/Продукт[:\-]\s*(.+)/i)
  const timeframeMatch = text.match(/Сроки[:\-]\s*(.+)/i)
  const scopeMatch = text.match(/Объём работ[:\-]\s*(.+)/i)

  return {
    id: mockProjectMeta.id,
    title: titleMatch?.[1]?.trim() ?? mockProjectMeta.title,
    clientName: clientMatch?.[1]?.trim() ?? mockProjectMeta.clientName,
    productName: productMatch?.[1]?.trim() ?? mockProjectMeta.productName,
    mainImageUrl: mockProjectMeta.mainImageUrl,
    timeframe: timeframeMatch?.[1]?.trim() ?? mockProjectMeta.timeframe,
    scope: scopeMatch?.[1]?.trim() ?? mockProjectMeta.scope,
  }
}

function detectType(line: string): ProjectArtifact['type'] {
  const lower = line.toLowerCase()

  if (TASK_KEYWORDS.some((k) => lower.includes(k))) return 'task'
  if (CONSTRAINT_KEYWORDS.some((k) => lower.includes(k))) return 'constraint'
  if (INSIGHT_KEYWORDS.some((k) => lower.includes(k))) return 'insight'
  if (PIVOT_KEYWORDS.some((k) => lower.includes(k))) return 'pivot'

  return 'quote'
}

function detectStakeholder(line: string): Stakeholder {
  const lower = line.toLowerCase()

  for (const { key, patterns } of STAKEHOLDER_KEYWORDS) {
    if (patterns.some((p) => lower.includes(p))) {
      return key
    }
  }

  return 'internal'
}

function estimateWeight(line: string): number {
  const lower = line.toLowerCase()
  let score = 1

  if (lower.includes('срочно') || lower.includes('дедлайн') || lower.includes('критично')) {
    score += 2
  }
  if (lower.includes('нельзя') || lower.includes('запрет') || lower.includes('ограничение')) {
    score += 1
  }
  if (lower.includes('по тестам') || lower.includes('оказалось') || lower.includes('выяснили')) {
    score += 1
  }

  return Math.max(1, Math.min(5, score))
}

function extractTimestamp(line: string): string | undefined {
  const dateMatch = line.match(
    /\b(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})\b/,
  )

  return dateMatch?.[1]
}

export function parseChatDump(text: string): ProjectArtifact[] {
  if (!text.trim()) return []

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.map((line, index) => {
    const type = detectType(line)
    const stakeholder = detectStakeholder(line)
    const weight = estimateWeight(line)
    const timestamp = extractTimestamp(line)

    return {
      id: `artifact-${index}`,
      type,
      stakeholder,
      text: line,
      weight,
      ...(timestamp ? { timestamp } : {}),
    }
  })
}

