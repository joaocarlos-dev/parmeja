export type AppetiteLevel = 1 | 2 | 3 | 4 | 5

export interface AppetiteOption {
  value: AppetiteLevel
  label: string
  description: string
  multiplier: number
}

export interface DemandEstimate {
  people: number
  level: AppetiteLevel
  multiplier: number
  expectedServings: number
  lowerServings: number
  upperServings: number
  minimumServings: number
}
