import { motion } from 'motion/react'
import type { ProjectArtifact, ProjectMeta } from '../types/project'
import styles from './ProjectInfoPanel.module.css'

export interface ProjectInfoPanelProps {
  projectMeta: ProjectMeta
  artifacts: ProjectArtifact[]
}

export function ProjectInfoPanel({ projectMeta, artifacts }: ProjectInfoPanelProps) {
  const tasks = artifacts.filter((a) => a.type === 'task')
  const constraints = artifacts.filter((a) => a.type === 'constraint')
  const insights = artifacts.filter((a) => a.type === 'insight')
  const pivots = artifacts.filter((a) => a.type === 'pivot')
  const quotes = artifacts.filter((a) => a.type === 'quote')

  const mainTaskSnippet = [
    projectMeta.productName,
    projectMeta.scope,
    tasks[0]?.text ?? quotes[0]?.text,
  ]
    .filter(Boolean)
    .join(' · ')

  const solutionSnippets = [...insights.slice(0, 2), ...pivots.slice(0, 2)]
  const resultSnippet =
    quotes[1]?.text ??
    insights
      .slice(-1)
      .map((a) => a.text)
      .join(' ')

  return (
    <motion.aside
      className={styles.panel}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
    >
      <header className={styles.header}>
        <div>
          <div className={styles.title}>Командный центр проекта</div>
          <div className={styles.subtitle}>
            {projectMeta.clientName} · {projectMeta.timeframe}
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <section>
          <h3 className={styles.sectionTitle}>Задача</h3>
          <div className={styles.sectionBody}>{mainTaskSnippet}</div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Ограничения</h3>
          <div className={styles.sectionBody}>
            {constraints.slice(0, 3).map((a) => (
              <div key={a.id}>• {a.text}</div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Решение</h3>
          <div className={styles.sectionBody}>
            {solutionSnippets.map((a) => (
              <div key={a.id}>• {a.text}</div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Результат</h3>
          <div className={styles.sectionBody}>
            <div>{resultSnippet}</div>
            <div className={styles.chips}>
              <span className={styles.chip}>{projectMeta.timeframe}</span>
              <span className={styles.chip}>{projectMeta.scope}</span>
            </div>
          </div>
        </section>
      </div>
    </motion.aside>
  )
}

