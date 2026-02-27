import { useEffect, useState } from 'react'
import './App.css'
import { ProjectCommandCenter } from './components/ProjectCommandCenter'
import { loadProjectContent } from './data/parseProjectMd'
import type { ProjectArtifact, ProjectMeta } from './types/project'
import { mockArtifacts, mockProjectMeta } from './data/mock'

function App() {
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>(mockProjectMeta)
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>(mockArtifacts)

  useEffect(() => {
    loadProjectContent()
      .then(({ meta, artifacts: a }) => {
        setProjectMeta((prev) => {
          const str = (s: string | undefined) => (s && s.trim() ? s.trim() : '')
          const title = str(meta.title) || prev.title
          const client = str(meta.clientName) || prev.clientName
          const product = str(meta.productName) || prev.productName
          const timeframe = str(meta.timeframe) || prev.timeframe
          const scope = str(meta.scope) || prev.scope
          return {
            ...prev,
            // mainImageUrl намеренно берём только из первоначального состояния (mock),
            // чтобы внешние источники/парсинг не могли "сломать" хиро-картинку.
            mainImageUrl: prev.mainImageUrl,
            title,
            clientName: client,
            productName: product,
            timeframe,
            scope,
          }
        })
        setArtifacts((prev) => (a.length > 0 ? a : prev))
      })
      .catch(() => {
        // Оставляем mock при ошибке загрузки (например, в dev без public)
      })
  }, [])

  return <ProjectCommandCenter projectMeta={projectMeta} artifacts={artifacts} />
}

export default App
