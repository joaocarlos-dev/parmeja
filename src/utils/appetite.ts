import type { AppetiteLevel, AppetiteOption, DemandEstimate } from '../types/appetite'

export const MIN_PEOPLE = 2
export const MAX_PEOPLE = 20

export const appetiteLevels: readonly AppetiteOption[] = [
  { value: 1, label: 'Muito leve', description: 'Só um pouco para cada pessoa.', multiplier: 0.65 },
  { value: 2, label: 'Leve', description: 'O grupo costuma comer menos.', multiplier: 0.8 },
  { value: 3, label: 'Normal', description: 'Uma refeição habitual para o grupo.', multiplier: 1 },
  { value: 4, label: 'Alta', description: 'O grupo quer comer bem.', multiplier: 1.2 },
  { value: 5, label: 'Muito alta', description: 'O grupo costuma repetir.', multiplier: 1.4 },
]

function precise(value: number): number {
  return Math.round(value * 1e10) / 1e10
}

export function estimateDemand(people: number, level: AppetiteLevel = 3): DemandEstimate {
  if (!Number.isInteger(people) || people < MIN_PEOPLE || people > MAX_PEOPLE) {
    throw new RangeError(`O número de pessoas deve estar entre ${MIN_PEOPLE} e ${MAX_PEOPLE}.`)
  }

  const appetite = appetiteLevels.find((option) => option.value === level)
  if (!appetite) throw new RangeError('A fome média deve estar entre 1 e 5.')

  const expectedServings = precise(people * appetite.multiplier)
  // Illustrative demand scenarios, not a calibrated probability interval.
  // Individual differences partly balance out as the group gets larger.
  const spread = 0.18 * Math.sqrt(people)

  return {
    people,
    level,
    multiplier: appetite.multiplier,
    expectedServings,
    lowerServings: precise(Math.max(0, expectedServings - spread)),
    upperServings: precise(expectedServings + spread),
    minimumServings: Math.ceil(expectedServings),
  }
}
