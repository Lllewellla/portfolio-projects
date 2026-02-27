export type Stakeholder =
  | 'client'
  | 'marketing'
  | 'production'
  | 'finance'
  | 'legal'
  | 'users'
  | 'internal'

export interface ProjectMeta {
  id: string
  title: string
  clientName: string
  productName: string
  mainImageUrl: string
  timeframe: string // например "3 месяца"
  scope: string // "концепт + конструкторская документация"
}

export type ProjectArtifactType =
  | 'quote'
  | 'insight'
  | 'constraint'
  | 'pivot'
  | 'task'

export interface ProjectArtifact {
  id: string
  type: ProjectArtifactType
  stakeholder: Stakeholder
  text: string
  weight: number // важность 1–5
  timestamp?: string // если есть дата/время из чата
}

