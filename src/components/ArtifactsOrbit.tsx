import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ProjectArtifact, Stakeholder } from '../types/project'
import styles from './ArtifactsOrbit.module.css'
import nodeStyles from './ArtifactNode.module.css'

/** Детерминированный псевдо-рандом по индексу (раскладка не прыгает при обновлениях). */
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const stakeholderColors: Record<Stakeholder, string> = {
  client: '#4fd1ff',
  marketing: '#ff9f5a',
  production: '#6ee7b7',
  finance: '#fde68a',
  legal: '#f97373',
  users: '#a78bfa',
  internal: '#94a3b8',
}

const typeLabels: Record<ProjectArtifact['type'], string> = {
  quote: 'Цитата',
  insight: 'Инсайт',
  constraint: 'Ограничение',
  pivot: 'Пивот',
  task: 'Задача',
}

export interface ArtifactsOrbitProps {
  artifacts: ProjectArtifact[]
  visibleCount?: number
  rotationIntervalMs?: number
  layout?: 'orbit' | 'grouped'
}

interface VisibleArtifact extends ProjectArtifact {
  slotIndex: number
}

export function ArtifactsOrbit({
  artifacts,
  visibleCount = 12,
  rotationIntervalMs = 8000,
  layout = 'orbit',
}: ArtifactsOrbitProps) {
  const [visibleArtifacts, setVisibleArtifacts] = useState<VisibleArtifact[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [measuredPositions, setMeasuredPositions] = useState<
    Record<string, { x: number; y: number }>
  >({})
  const [isDragging, setIsDragging] = useState(false)
  const measureRef = useRef<() => void>(() => {})

  const groupedByStakeholder = useMemo(() => {
    const groups = new Map<Stakeholder, ProjectArtifact[]>()

    for (const artifact of artifacts) {
      const key = artifact.stakeholder
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(artifact)
    }

    return Array.from(groups.entries())
  }, [artifacts])

  const slots = useMemo(
    () =>
      Array.from({ length: visibleCount }).map((_, index) => {
        // Кольцо-ось = контур hero (прямоугольник). Распределяем точки по периметру.
        const margin = 6 // отступ от края hero в %
        const xMin = margin
        const xMax = 100 - margin
        const yMin = margin
        const yMax = 100 - margin
        const t = (index + 0.5) / visibleCount // 0..1 вдоль периметра
        const u = t * 4 // 0..4: четыре стороны
        let x: number
        let y: number
        if (u < 1) {
          x = xMin + u * (xMax - xMin)
          y = yMin
        } else if (u < 2) {
          x = xMax
          y = yMin + (u - 1) * (yMax - yMin)
        } else if (u < 3) {
          x = xMax - (u - 2) * (xMax - xMin)
          y = yMax
        } else {
          x = xMin
          y = yMax - (u - 3) * (yMax - yMin)
        }
        // Большой jitter со смещением к центру (50, 50)
        const jitterTowardCenter = 0.10 + seeded(index, 1) * 0.10 // 10–20% смещения к центру
        const cx = 50
        const cy = 50
        const finalX = x + (cx - x) * jitterTowardCenter + (seeded(index, 2) - 0.5) * 6
        const finalY = y + (cy - y) * jitterTowardCenter + (seeded(index, 3) - 0.5) * 6
        return { x: finalX, y: finalY }
      }),
    [visibleCount],
  )

  const initialSelection = useMemo(() => {
    const flat: ProjectArtifact[] = []

    for (const [, list] of groupedByStakeholder) {
      flat.push(...list)
    }

    return flat.slice(0, visibleCount)
  }, [groupedByStakeholder, visibleCount])

  useEffect(() => {
    if (!artifacts.length) return

    setVisibleArtifacts(
      initialSelection.map((artifact, slotIndex) => ({
        ...artifact,
        slotIndex,
      })),
    )
  }, [artifacts, initialSelection])

  useEffect(() => {
    if (!artifacts.length || layout === 'grouped') return

    const interval = setInterval(() => {
      setVisibleArtifacts((current) => {
        if (!current.length) return current

        const pool = artifacts.filter(
          (artifact) => !current.some((v) => v.id === artifact.id),
        )

        if (!pool.length) return current

        const countToReplace = Math.max(2, Math.floor(current.length * 0.35))
        const indices = new Set<number>()

        while (indices.size < countToReplace) {
          indices.add(Math.floor(Math.random() * current.length))
        }

        const newArtifacts: VisibleArtifact[] = [...current]
        let poolIndex = 0

        for (const index of indices) {
          const candidate = pool[poolIndex]
          if (!candidate) break

          newArtifacts[index] = {
            ...candidate,
            slotIndex: current[index]?.slotIndex ?? index,
          }
          poolIndex += 1
        }

        return newArtifacts
      })
    }, rotationIntervalMs)

    return () => clearInterval(interval)
  }, [artifacts, rotationIntervalMs, layout])

  const positionedArtifacts = useMemo(() => {
    if (!visibleArtifacts.length || !slots.length) return []

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value))

    // Базовая выкладка: слоты уже заданы как (x, y) по контуру hero с jitter к центру
    const base = visibleArtifacts.map((artifact) => {
      const slot = slots[artifact.slotIndex % slots.length]
      const x = clamp(slot.x, 10, 90)
      const y = clamp(slot.y, 10, 90)
      return { artifact, x, y }
    })

    // Лёгкое «отталкивание» нод, чтобы они не перекрывали друг друга больше чем на ~30%
    const MIN_DIST = 10 // в процентах размеров контейнера
    const ITERATIONS = 6
    const adjusted = base.map((p) => ({ ...p }))

    for (let iter = 0; iter < ITERATIONS; iter += 1) {
      for (let i = 0; i < adjusted.length; i += 1) {
        for (let j = i + 1; j < adjusted.length; j += 1) {
          const a = adjusted[i]
          const b = adjusted[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.hypot(dx, dy)
          if (dist === 0) continue
          if (dist < MIN_DIST) {
            const overlap = MIN_DIST - dist
            const shift = (overlap / dist) * 0.5
            const offsetX = dx * shift
            const offsetY = dy * shift
            a.x = clamp(a.x - offsetX, 10, 90)
            a.y = clamp(a.y - offsetY, 10, 90)
            b.x = clamp(b.x + offsetX, 10, 90)
            b.y = clamp(b.y + offsetY, 10, 90)
          }
        }
      }
    }

    // После всех смещений центрируем «центр масс» нод обратно в (50, 50),
    // чтобы всё кольцо не уползало вправо или вниз.
    if (adjusted.length > 0) {
      const avg = adjusted.reduce(
        (acc, p) => {
          acc.x += p.x
          acc.y += p.y
          return acc
        },
        { x: 0, y: 0 },
      )
      avg.x /= adjusted.length
      avg.y /= adjusted.length

      const shiftX = 50 - avg.x
      const shiftY = 50 - avg.y

      for (const p of adjusted) {
        p.x = clamp(p.x + shiftX, 10, 90)
        p.y = clamp(p.y + shiftY, 10, 90)
      }
    }

    return adjusted
  }, [slots, visibleArtifacts])

  const links = useMemo(() => {
    if (positionedArtifacts.length < 2) return []

    const byStakeholder = new Map<Stakeholder, typeof positionedArtifacts>()
    for (const point of positionedArtifacts) {
      const key = point.artifact.stakeholder
      if (!byStakeholder.has(key)) byStakeholder.set(key, [])
      byStakeholder.get(key)!.push(point)
    }

    const result: {
      from: (typeof positionedArtifacts)[number]
      to: (typeof positionedArtifacts)[number]
      strength: number
    }[] = []

    // Связи внутри одного стейкхолдера — как ветки графа
    for (const [, nodes] of byStakeholder) {
      if (nodes.length < 2) continue

      const sorted = [...nodes].sort(
        (a, b) => b.artifact.weight - a.artifact.weight,
      )

      for (let i = 0; i < sorted.length - 1; i += 1) {
        const from = sorted[i]
        const to = sorted[i + 1]
        const strength = (from.artifact.weight + to.artifact.weight) / 2
        result.push({ from, to, strength })
      }
    }

    // Кросс-связи «клиентские цитаты → внутренние инсайты/пивоты»
    const quotes = positionedArtifacts.filter(
      (p) => p.artifact.type === 'quote',
    )
    const insightsAndPivots = positionedArtifacts.filter((p) =>
      ['insight', 'pivot'].includes(p.artifact.type),
    )

    for (const quote of quotes) {
      let best: (typeof positionedArtifacts)[number] | undefined
      let bestDist = Infinity

      for (const candidate of insightsAndPivots) {
        if (candidate.artifact.id === quote.artifact.id) continue
        const dx = candidate.x - quote.x
        const dy = candidate.y - quote.y
        const dist = dx * dx + dy * dy
        if (dist < bestDist) {
          bestDist = dist
          best = candidate
        }
      }

      if (best) {
        const strength = (quote.artifact.weight + best.artifact.weight) / 2
        result.push({ from: quote, to: best, strength })
      }
    }

    return result
  }, [positionedArtifacts])

  useLayoutEffect(() => {
    measureRef.current = () => {
      const svgEl = svgRef.current
      if (!svgEl) return
      const svgRect = svgEl.getBoundingClientRect()
      const w = svgRect.width
      const h = svgRect.height
      if (w <= 0 || h <= 0) return
      const next: Record<string, { x: number; y: number }> = {}
      for (const { artifact } of positionedArtifacts) {
        const el = nodeRefs.current[artifact.id]
        if (el) {
          const r = el.getBoundingClientRect()
          const centerX = r.left + r.width / 2
          const centerY = r.top + r.height / 2
          next[artifact.id] = {
            x: ((centerX - svgRect.left) / w) * 100,
            y: ((centerY - svgRect.top) / h) * 100,
          }
        }
      }
      if (Object.keys(next).length > 0) setMeasuredPositions(next)
    }
  }, [positionedArtifacts])

  useLayoutEffect(() => {
    const rafId = requestAnimationFrame(() => measureRef.current())
    return () => cancelAnimationFrame(rafId)
  }, [positionedArtifacts, dragOffsets])

  useEffect(() => {
    if (!isDragging) return
    let rafId: number
    const tick = () => {
      measureRef.current()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isDragging])

  if (layout === 'grouped') {
    return (
      <div className={styles.groupedRoot}>
        <div className={styles.groupedGrid}>
          {artifacts.map((artifact) => (
            <motion.div
              key={artifact.id}
              className={styles.groupedCard}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, staggerChildren: 0.05 }}
            >
              <ArtifactNode artifact={artifact} isHighlighted={artifact.weight >= 4} />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <svg
        ref={svgRef}
        className={styles.linksSvg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {links.map((link, index) => {
          const { from, to, strength } = link
          const fromPos = measuredPositions[from.artifact.id] ?? { x: from.x, y: from.y }
          const toPos = measuredPositions[to.artifact.id] ?? { x: to.x, y: to.y }
          const d = `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`
          const color = stakeholderColors[from.artifact.stakeholder]

          return (
            <motion.path
              key={`link-${from.artifact.id}-${to.artifact.id}-${index}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={0.1 + strength * 0.03}
              strokeOpacity={0.32}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.1,
                delay: 0.15 + index * 0.04,
                ease: 'easeOut',
              }}
            />
          )
        })}
      </svg>
      <div className={styles.nodeLayer}>
        <AnimatePresence>
          {positionedArtifacts.map(({ artifact, x, y }) => {
            const isHighlighted = artifact.weight >= 4

            return (
              <motion.div
                ref={(el) => {
                  if (el) nodeRefs.current[artifact.id] = el as HTMLDivElement
                  else delete nodeRefs.current[artifact.id]
                }}
                key={artifact.id}
                layout
                className={styles.node}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                drag
                dragMomentum={false}
                dragElastic={0.35}
                dragTransition={{
                  bounceStiffness: 420,
                  bounceDamping: 26,
                }}
                dragConstraints={{
                  left: -80,
                  right: 80,
                  top: -80,
                  bottom: 80,
                }}
                onDragStart={() => setIsDragging(true)}
                onDrag={(_, info) => {
                  setDragOffsets((prev) => ({
                    ...prev,
                    [artifact.id]: { x: info.offset.x, y: info.offset.y },
                  }))
                }}
                onDragEnd={() => {
                  setIsDragging(false)
                  setDragOffsets((prev) => ({
                    ...prev,
                    [artifact.id]: { x: 0, y: 0 },
                  }))
                }}
                dragSnapToOrigin
                initial={{ opacity: 0, scale: 0.75, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: 4 }}
                transition={{
                  duration: 0.55,
                  type: 'spring',
                  stiffness: 180,
                  damping: 20,
                }}
              >
                <ArtifactNode artifact={artifact} isHighlighted={isHighlighted} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ArtifactNodeProps {
  artifact: ProjectArtifact
  isHighlighted?: boolean
}

function ArtifactNode({ artifact, isHighlighted }: ArtifactNodeProps) {
  const color = stakeholderColors[artifact.stakeholder]
  const baseDelay = 0.2
  const words = useMemo(
    () => artifact.text.split(/\s+/).filter(Boolean),
    [artifact.text],
  )

  return (
    <motion.article
      className={`${nodeStyles.card} ${isHighlighted ? nodeStyles.cardStrong : ''}`}
      style={{
        borderColor: color,
      }}
      animate={{
        scale: isHighlighted ? [0.96, 1.04, 0.96] : [0.98, 1.02, 0.98],
        opacity: [0.9, 1, 0.9],
        boxShadow: isHighlighted
          ? [
              '0 0 22px rgba(80, 190, 255, 0.95)',
              '0 0 32px rgba(80, 190, 255, 0.6)',
              '0 0 22px rgba(80, 190, 255, 0.95)',
            ]
          : undefined,
      }}
      transition={{
        duration: isHighlighted ? 5 : 6.5,
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    >
      <div className={nodeStyles.labelRow}>
        <span
          className={nodeStyles.stakeholderDot}
          style={{ color, backgroundColor: color }}
        />
        <span className={nodeStyles.pill}>{typeLabels[artifact.type]}</span>
        <span>{artifact.stakeholder}</span>
      </div>

      <div className={nodeStyles.text}>
        {words.map((word, index) => {
          const randomJitter = Math.random() * 0.06
          return (
            <motion.span
              key={`${artifact.id}-word-${index}`}
              initial={{ opacity: 0, y: '0.35em' }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: baseDelay + index * 0.04 + randomJitter,
                duration: 0.3 + Math.random() * 0.15,
              }}
            >
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </motion.span>
          )
        })}
      </div>

      {artifact.timestamp ? (
        <div className={nodeStyles.timestamp}>{artifact.timestamp}</div>
      ) : null}
    </motion.article>
  )
}

