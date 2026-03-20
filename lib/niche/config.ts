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
    label: 'opt_4a6a19',
    icon: 'Stethoscope',
    color: 'blue',
    accentClass: 'bg-blue-600',
    resourceTypes: [
      { value: 'doctor',         label: 'resource_type_doctor' },
      { value: 'nurse',          label: 'resource_type_nurse' },
      { value: 'operating_room', label: 'resource_type_operating_room' },
      { value: 'laboratory',     label: 'resource_type_laboratory' },
      { value: 'office',         label: 'resource_type_office' },
      { value: 'treatment_room', label: 'resource_type_treatment_room' },
    ],
    resourceLabel:       'opt_66feeb',
    resourceLabelPlural: 'opt_4d744c',
    serviceLabel:        'opt_4e1cdb',
    bookingLabel:        'opt_d862ba',
    attributeFields: [
      { key: 'specialization',  label: 'opt_ec228c',   type: 'text',      required: true, forTypes: ['staff'],               showInTable: true },
      { key: 'license',         label: 'opt_d7a770',  type: 'text',                      forTypes: ['staff'],               showInTable: true },
      { key: 'experience_years',label: 'opt_c2283c',      type: 'number',                    forTypes: ['staff'],               showInTable: true },
      { key: 'languages',       label: 'opt_cfc45c',           type: 'multitext',                 forTypes: ['staff'] },
      { key: 'equipment',       label: 'opt_a135d0',    type: 'multitext',                 forTypes: ['room', 'equipment'],   showInTable: true },
    ],
    heroTitle:            'opt_15b204',
    heroSubtitle:         'opt_f925fb',
    publicPageSections:   ['hero', 'specialists', 'services', 'booking'],
  },

  beauty: {
    label: 'opt_4019a6',
    icon: 'Scissors',
    color: 'pink',
    accentClass: 'bg-pink-600',
    resourceTypes: [
      { value: 'manicure_table', label: 'resource_type_manicure_table' },
      { value: 'sink',           label: 'resource_type_sink' },
      { value: 'couch',          label: 'resource_type_couch' },
    ],
    resourceLabel:       'opt_2bb1fb',
    resourceLabelPlural: 'opt_ffcae7',
    serviceLabel:        'opt_8bf3c2',
    bookingLabel:        'opt_7bf285',
    attributeFields: [
      { key: 'specialization',   label: 'attr_specialization', type: 'text',      forTypes: ['staff'], showInTable: true },
      { key: 'experience_years', label: 'opt_0cdcdc',          type: 'number',    forTypes: ['staff'], showInTable: true },
      { key: 'skills',           label: 'opt_e8d0f9',          type: 'multitext', forTypes: ['staff'] },
    ],
    heroTitle:          'opt_0fe456',
    heroSubtitle:       'opt_2520a3',
    publicPageSections: ['hero', 'specialists', 'services', 'gallery', 'booking'],
  },

  horeca: {
    label: 'opt_ebadb0',
    icon: 'UtensilsCrossed',
    color: 'orange',
    accentClass: 'bg-orange-600',
    resourceTypes: [
      { value: 'table',        label: 'resource_type_table' },
      { value: 'vip_lounge',   label: 'resource_type_vip_lounge' },
      { value: 'terrace',      label: 'resource_type_terrace' },
      { value: 'bar_counter',  label: 'resource_type_bar_counter' },
      { value: 'karaoke_room', label: 'resource_type_karaoke_room' },
    ],
    resourceLabel:       'opt_337b69',
    resourceLabelPlural: 'opt_ec4a28',
    serviceLabel:        'opt_c9994b',
    bookingLabel:        'opt_02dd9c',
    attributeFields: [
      {
        key: 'capacity', label: 'opt_6f5c77', type: 'number',
        required: true, forTypes: ['table', 'vip_lounge', 'terrace', 'bar_counter', 'karaoke_room'], showInTable: true,
      },
      {
        key: 'location', label: 'opt_06d897', type: 'select',
        options: ['opt_ec667d', 'opt_d8076a', 'VIP', 'opt_9a48e1', 'opt_cf9f66'],
        forTypes: ['table', 'vip_lounge', 'terrace', 'bar_counter', 'karaoke_room'], showInTable: true,
      },
      { key: 'features',       label: 'opt_4e2599',        type: 'multitext', forTypes: ['table', 'vip_lounge', 'terrace', 'bar_counter', 'karaoke_room'] },
      { key: 'specialization', label: 'attr_specialization', type: 'text',    forTypes: ['staff'], showInTable: true },
    ],
    heroTitle:          'opt_f79c7c',
    heroSubtitle:       'opt_3c5e78',
    publicPageSections: ['hero', 'tables', 'menu', 'booking'],
  },

  sports: {
    label: 'opt_70c52a',
    icon: 'Dumbbell',
    color: 'green',
    accentClass: 'bg-green-600',
    resourceTypes: [
      { value: 'court',     label: 'resource_type_court' },
      { value: 'field',     label: 'resource_type_field' },
      { value: 'pool',      label: 'resource_type_pool' },
      { value: 'sauna',     label: 'resource_type_sauna' },
      { value: 'equipment', label: 'resource_type_equipment' },
    ],
    resourceLabel:       'opt_e7eb82',
    resourceLabelPlural: 'opt_a232c8',
    serviceLabel:        'opt_9f0bba',
    bookingLabel:        'opt_cd55f5',
    attributeFields: [
      {
        key: 'surface', label: 'opt_3b3d9c', type: 'select',
        options: ['opt_85e49f', 'opt_1a62e8', 'opt_7111a9', 'opt_f785f5', 'opt_92b2bc'],
        forTypes: ['court'], showInTable: true,
      },
      { key: 'indoor',             label: 'opt_de60c7',        type: 'checkbox',  forTypes: ['court', 'field', 'pool', 'sauna'], showInTable: true },
      { key: 'capacity',           label: 'opt_64954e',        type: 'number',    forTypes: ['court', 'field', 'pool', 'sauna'], showInTable: true },
      { key: 'equipment_included', label: 'opt_42fe23',        type: 'multitext', forTypes: ['court', 'field', 'pool', 'sauna'] },
      { key: 'specialization',     label: 'attr_specialization', type: 'text',    forTypes: ['staff'], showInTable: true },
    ],
    heroTitle:          'opt_82f132',
    heroSubtitle:       'opt_e49668',
    publicPageSections: ['hero', 'courts', 'trainers', 'pricing', 'booking'],
  },
}

// ---- Helpers ---------------------------------------------------------------

/** Returns the niche config, falling back to `medicine` for unknown/null values. */
export function getNicheConfig(niche: string | null | undefined): NicheConfig {
  return NICHE_CONFIG[(niche as Niche)] ?? NICHE_CONFIG.medicine
}
