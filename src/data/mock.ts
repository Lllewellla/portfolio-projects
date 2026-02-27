import type { ProjectArtifact, ProjectMeta, Stakeholder } from '../types/project'

const stakeholderColorOrder: Stakeholder[] = [
  'client',
  'marketing',
  'production',
  'finance',
  'legal',
  'users',
  'internal',
]

export const mockProjectMeta: ProjectMeta = {
  id: 'hyperplazma-plasma-cutter-2025',
  title:
    'Дизайн станка плазменной резки Гиперплазма: как рабочий чат превратил «сделайте красиво» в структурированное решение',
  clientName: 'Гиперплазма',
  productName: 'Станок плазменной резки металла',
  mainImageUrl:
    'https://optim.tildacdn.com/stor6266-3430-4462-a138-653238346664/-/format/webp/1b026ba925beb5691f6eedfd3410c412.png.webp',
  timeframe: '63 дня',
  scope:
    'промышленный дизайн станка плазменной резки под бренд Гиперплазмы: консоль, корпусирование, цветографика и сценарии работы',
}

const baseArtifacts: ProjectArtifact[] = [
  {
    id: 'a1',
    type: 'quote',
    stakeholder: 'client',
    text: '«Со станком всё хорошо технически, но он не выглядит дорого» — так сформулировали исходную боль по виду станка.',
    weight: 5,
  },
  {
    id: 'a2',
    type: 'quote',
    stakeholder: 'client',
    text: '«Синий — цвет китайского производителя» — текущая цветовая раскладка покупных узлов выглядела «чужой» для бренда.',
    weight: 4,
  },
  {
    id: 'a3',
    type: 'quote',
    stakeholder: 'client',
    text: '«Основные цвета нашей компании это RAL 7016 и RAL 3020…» — запрос сделать так, чтобы станок говорил на языке бренда Гиперплазмы.',
    weight: 4,
  },
  {
    id: 'a4',
    type: 'constraint',
    stakeholder: 'production',
    text: 'Часть узлов — покупные элементы: их габариты и цвет менять нельзя, а перекраска рельс возможна, но не сразу.',
    weight: 5,
  },
  {
    id: 'a5',
    type: 'constraint',
    stakeholder: 'production',
    text: 'Все кожухи сгибаются из листового металла с радиусами 1,6–8 мм — сложные скульптурные формы не проходят по технологии.',
    weight: 4,
  },
  {
    id: 'a6',
    type: 'constraint',
    stakeholder: 'production',
    text: 'Брендинг допускается только в понятных зонах: передние и задние торцы ванны, электрические шкафы, согласованные панели.',
    weight: 3,
  },
  {
    id: 'a7',
    type: 'insight',
    stakeholder: 'internal',
    text: 'Рабочий чат по проекту — это карта принятия решений: 63 дня, 357 сообщений, 7 участников и 10+ итераций.',
    weight: 4,
  },
  {
    id: 'a8',
    type: 'insight',
    stakeholder: 'users',
    text: 'Консоль управления должна выдерживать привычное поведение оператора: облокачивание, работу в перчатках, сенсорный экран с дублированием мышью и клавиатурой.',
    weight: 4,
  },
  {
    id: 'a9',
    type: 'insight',
    stakeholder: 'internal',
    text: 'Задача «сделать, чтобы выглядело дорого» разворачивается в конкретные рычаги: цветографика, корпусирование, консоль, ограждения, системы хранения и подсветка.',
    weight: 5,
  },
  {
    id: 'a10',
    type: 'pivot',
    stakeholder: 'internal',
    text: 'Команда делит работу на два связных направления: язык фирменной цветографики и язык формы/корпусирования станка.',
    weight: 4,
  },
  {
    id: 'a11',
    type: 'task',
    stakeholder: 'internal',
    text: 'Подготовить подробный протокол встречи: зафиксировать боль «не выглядит дорого» и реальные технологические ограничения.',
    weight: 3,
  },
  {
    id: 'a12',
    type: 'task',
    stakeholder: 'internal',
    text: 'Провести быструю дизайн‑аналитику: разложить, как работает станок от загрузки листа до выгрузки деталей, и собрать референсы «дорогого вида».',
    weight: 3,
  },
  {
    id: 'a13',
    type: 'insight',
    stakeholder: 'marketing',
    text: 'Фирменные цвета RAL 7016 и RAL 3020 лучше работают как акценты на ключевых узлах — ванна, портал, консоль — а не как сплошная заливка всего станка.',
    weight: 4,
  },
  {
    id: 'a14',
    type: 'pivot',
    stakeholder: 'production',
    text: 'Не бороться с базовым цветом покупных элементов, а строить фирменный образ вокруг поверхностей, которыми владеет сам заказчик.',
    weight: 4,
  },
  {
    id: 'a15',
    type: 'insight',
    stakeholder: 'client',
    text: 'Решения по форме и цветографике можно масштабировать на линейку станков Гиперплазмы — это база для серийного продукта, а не единичный шоу‑образец.',
    weight: 5,
  },
]

export const mockArtifacts: ProjectArtifact[] = baseArtifacts.map((artifact, index) => ({
  ...artifact,
  // Лёгкая нормализация ID и распределение стейкхолдеров по кольцу
  id: artifact.id || `artifact-${index}`,
  stakeholder: artifact.stakeholder ?? stakeholderColorOrder[index % stakeholderColorOrder.length],
}))

