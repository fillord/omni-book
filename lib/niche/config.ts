// ---- Types -----------------------------------------------------------------

export type Niche = 'beauty' | 'horeca' | 'sports' | 'medicine'

export interface AttributeField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multitext' | 'checkbox'
  options?: string[]
  required?: boolean
  /** If set, only render this field for these resource types */
  forTypes?: string[]
  /** Show in resources table and public page resource cards */
  showInTable?: boolean
}

export interface NicheConfig {
  label: string
  icon: string
  color: string
  /** Tailwind bg class for hero section, e.g. "bg-blue-600" */
  accentClass: string
  resourceTypes: { value: string; label: string }[]
  resourceLabel: string
  resourceLabelPlural: string
  serviceLabel: string
  bookingLabel: string
  attributeFields: AttributeField[]
  heroTitle: string
  heroSubtitle: string
  publicPageSections: string[]
}

// ---- Config ----------------------------------------------------------------

export const NICHE_CONFIG: Record<Niche, NicheConfig> = {
  medicine: {
    label: 'Клиника',
    icon: 'Stethoscope',
    color: 'blue',
    accentClass: 'bg-blue-600',
    resourceTypes: [
      { value: 'staff',     label: 'Врач' },
      { value: 'room',      label: 'Кабинет' },
      { value: 'equipment', label: 'Оборудование' },
    ],
    resourceLabel:       'Специалист',
    resourceLabelPlural: 'Специалисты',
    serviceLabel:        'Приём',
    bookingLabel:        'Записаться на приём',
    attributeFields: [
      { key: 'specialization',  label: 'Специализация',   type: 'text',      required: true, forTypes: ['staff'],               showInTable: true },
      { key: 'license',         label: 'Номер лицензии',  type: 'text',                      forTypes: ['staff'],               showInTable: true },
      { key: 'experience_years',label: 'Стаж (лет)',      type: 'number',                    forTypes: ['staff'],               showInTable: true },
      { key: 'languages',       label: 'Языки',           type: 'multitext',                 forTypes: ['staff'] },
      { key: 'equipment',       label: 'Оборудование',    type: 'multitext',                 forTypes: ['room', 'equipment'],   showInTable: true },
    ],
    heroTitle:            'Запишитесь на приём онлайн',
    heroSubtitle:         'Выберите специалиста и удобное время',
    publicPageSections:   ['hero', 'specialists', 'services', 'booking'],
  },

  beauty: {
    label: 'Салон красоты',
    icon: 'Scissors',
    color: 'pink',
    accentClass: 'bg-pink-600',
    resourceTypes: [
      { value: 'staff', label: 'Мастер' },
      { value: 'room',  label: 'Кабинет' },
    ],
    resourceLabel:       'Мастер',
    resourceLabelPlural: 'Мастера',
    serviceLabel:        'Услуга',
    bookingLabel:        'Записаться к мастеру',
    attributeFields: [
      {
        key: 'specialization', label: 'Специализация', type: 'select',
        options: ['Парикмахер', 'Стилист', 'Косметолог', 'Мастер маникюра', 'Визажист', 'Массажист'],
        forTypes: ['staff'], showInTable: true,
      },
      { key: 'experience_years', label: 'Опыт (лет)', type: 'number',    forTypes: ['staff'], showInTable: true },
      { key: 'skills',           label: 'Навыки',     type: 'multitext', forTypes: ['staff'] },
    ],
    heroTitle:          'Запишитесь к мастеру онлайн',
    heroSubtitle:       'Выберите услугу и удобное время',
    publicPageSections: ['hero', 'specialists', 'services', 'gallery', 'booking'],
  },

  horeca: {
    label: 'Ресторан / Кафе',
    icon: 'UtensilsCrossed',
    color: 'orange',
    accentClass: 'bg-orange-600',
    resourceTypes: [
      { value: 'table', label: 'Столик' },
      { value: 'room',  label: 'Зал / VIP' },
      { value: 'staff', label: 'Официант / Шеф' },
    ],
    resourceLabel:       'Столик',
    resourceLabelPlural: 'Столики и залы',
    serviceLabel:        'Бронь',
    bookingLabel:        'Забронировать столик',
    attributeFields: [
      {
        key: 'capacity', label: 'Вместимость (чел.)', type: 'number',
        required: true, forTypes: ['table', 'room'], showInTable: true,
      },
      {
        key: 'location', label: 'Расположение', type: 'select',
        options: ['Зал', 'Терраса', 'VIP', 'Бар', 'У окна'],
        forTypes: ['table', 'room'], showInTable: true,
      },
      { key: 'features', label: 'Особенности', type: 'multitext', forTypes: ['table', 'room'] },
    ],
    heroTitle:          'Забронируйте столик онлайн',
    heroSubtitle:       'Выберите столик и время визита',
    publicPageSections: ['hero', 'tables', 'menu', 'booking'],
  },

  sports: {
    label: 'Спорт и отдых',
    icon: 'Dumbbell',
    color: 'green',
    accentClass: 'bg-green-600',
    resourceTypes: [
      { value: 'court',     label: 'Корт / Поле' },
      { value: 'room',      label: 'Зал' },
      { value: 'staff',     label: 'Тренер' },
      { value: 'equipment', label: 'Инвентарь' },
    ],
    resourceLabel:       'Площадка',
    resourceLabelPlural: 'Площадки',
    serviceLabel:        'Аренда',
    bookingLabel:        'Забронировать',
    attributeFields: [
      {
        key: 'surface', label: 'Покрытие', type: 'select',
        options: ['Хард', 'Грунт', 'Трава', 'Паркет', 'Резина'],
        forTypes: ['court'], showInTable: true,
      },
      { key: 'indoor',             label: 'Крытый',       type: 'checkbox',  forTypes: ['court', 'room'], showInTable: true },
      { key: 'capacity',           label: 'Вместимость',  type: 'number',    forTypes: ['court', 'room'], showInTable: true },
      { key: 'equipment_included', label: 'Инвентарь вкл.', type: 'multitext', forTypes: ['court', 'room'] },
    ],
    heroTitle:          'Забронируйте площадку онлайн',
    heroSubtitle:       'Выберите корт и удобное время',
    publicPageSections: ['hero', 'courts', 'trainers', 'pricing', 'booking'],
  },
}

// ---- Helpers ---------------------------------------------------------------

/** Returns the niche config, falling back to `medicine` for unknown/null values. */
export function getNicheConfig(niche: string | null | undefined): NicheConfig {
  return NICHE_CONFIG[(niche as Niche)] ?? NICHE_CONFIG.medicine
}
