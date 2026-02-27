import { useState } from 'react'
import { motion } from 'motion/react'
import type { ProjectArtifact, ProjectMeta, ProjectArtifactType } from '../types/project'
import { ArtifactsOrbit } from './ArtifactsOrbit'
import { ProjectInfoPanel } from './ProjectInfoPanel'
import styles from './ProjectCommandCenter.module.css'

export type CategoryMode = ProjectArtifactType | 'story' | null

const CATEGORY_LABELS: { value: CategoryMode; label: string }[] = [
  { value: null, label: 'Все' },
  { value: 'quote', label: 'Цитаты' },
  { value: 'insight', label: 'Инсайты' },
  { value: 'constraint', label: 'Ограничения' },
  { value: 'pivot', label: 'Пивоты' },
  { value: 'task', label: 'Задачи' },
  { value: 'story', label: 'О проекте' },
]

export interface ProjectCommandCenterProps {
  projectMeta: ProjectMeta
  artifacts: ProjectArtifact[]
}

export function ProjectCommandCenter({ projectMeta, artifacts }: ProjectCommandCenterProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryMode>(null)

  const filteredArtifacts =
    activeCategory && activeCategory !== 'story'
      ? artifacts.filter((a) => a.type === activeCategory)
      : artifacts

  const isGrouped = activeCategory != null && activeCategory !== 'story'
  const showStory = activeCategory === 'story'

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        {CATEGORY_LABELS.map(({ value, label }) => (
          <button
            key={value ?? 'all'}
            type="button"
            className={styles.categoryBtn}
            data-active={activeCategory === value}
            onClick={() => setActiveCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <motion.main
        className={styles.main}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        <div className={styles.heroOrbitWrapper} data-story={showStory}>
          {showStory ? (
            <div className={styles.storyOverlay}>
              <ProjectInfoPanel projectMeta={projectMeta} artifacts={artifacts} />
            </div>
          ) : (
            <>
              <motion.section
                className={styles.hero}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.9, ease: 'easeOut' },
                  },
                }}
              >
                <div className={styles.heroImageWrapper}>
                  {projectMeta.mainImageUrl?.trim() ? (
                    <motion.img
                      src={projectMeta.mainImageUrl}
                      alt={projectMeta.title}
                      className={styles.heroImage}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 1.2, ease: 'easeOut' }}
                    />
                  ) : null}
                  <div className={styles.heroOverlay} />
                </div>

                <motion.div
                  className={styles.heroHeader}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                >
                  <div className={styles.badgeRow}>
                    <span className={styles.dot} />
                    <span>Проектный контур · Industrial design</span>
                  </div>
                  <h1 className={styles.title}>{projectMeta.title}</h1>
                  <p className={styles.subtitle}>
                    {projectMeta.clientName} · {projectMeta.productName}
                  </p>
                  <div className={styles.metaRow}>
                    <span className={styles.metaChip}>{projectMeta.timeframe}</span>
                    <span className={styles.metaChip}>{projectMeta.scope}</span>
                  </div>
                </motion.div>
              </motion.section>

              <div className={styles.orbitLayer}>
                <ArtifactsOrbit
                  artifacts={filteredArtifacts}
                  layout={isGrouped ? 'grouped' : 'orbit'}
                />
              </div>
            </>
          )}
        </div>
      </motion.main>
    </div>
  )
}

