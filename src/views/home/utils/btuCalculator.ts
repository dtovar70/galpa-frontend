/** How much sun the space gets during the day. */
export type SunExposure = 'low' | 'medium' | 'high'

/** Rule of thumb used by the advisors: ~600 BTU per m² with average sun and two people. */
const BTU_PER_M2 = 600
const BTU_PER_EXTRA_PERSON = 600
const BASE_PEOPLE = 2

const SUN_FACTOR: Record<SunExposure, number> = {
    low: 0.9,
    medium: 1,
    high: 1.15,
}

/** Capacities split and commercial units are sold in. */
const STANDARD_BTUS = [9000, 12000, 18000, 24000, 36000, 48000, 60000] as const

export interface BtuInput {
    areaM2: number
    sun: SunExposure
    people: number
}

export interface BtuRecommendation {
    /** The raw estimate, rounded to hundreds. */
    estimate: number
    /** The smallest standard capacity that covers the estimate. */
    recommended: number
    /** Range to filter the catalog with: the recommended size and the next one up. */
    range: { min: number; max: number }
    /** The estimate exceeds the largest single unit: needs a custom project. */
    exceedsSingleUnit: boolean
}

export function recommendBtu({ areaM2, sun, people }: BtuInput): BtuRecommendation {
    const extraPeople = Math.max(0, people - BASE_PEOPLE)
    const raw = areaM2 * BTU_PER_M2 * SUN_FACTOR[sun] + extraPeople * BTU_PER_EXTRA_PERSON
    const estimate = Math.round(raw / 100) * 100
    const largest = STANDARD_BTUS[STANDARD_BTUS.length - 1] ?? 60000
    const index = STANDARD_BTUS.findIndex((size) => size >= estimate)
    const recommended = index === -1 ? largest : (STANDARD_BTUS[index] ?? largest)
    const next = index === -1 ? largest : (STANDARD_BTUS[index + 1] ?? recommended)

    return {
        estimate,
        recommended,
        range: { min: recommended, max: next },
        exceedsSingleUnit: index === -1,
    }
}
