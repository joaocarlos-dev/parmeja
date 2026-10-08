import type { DemandEstimate } from './appetite'

export type FlavorId = 'abobrinha' | 'frango' | 'tilapia' | 'file-mignon'

export interface MenuOption {
  code: number
  serves: number
  price: number
}

export interface Flavor {
  id: FlavorId
  name: string
  shortDescription: string
  vegetarian?: boolean
  options: MenuOption[]
}

export interface OrderItem extends MenuOption {
  flavorId: FlavorId
  flavorName: string
  quantity: number
}

export interface Recommendation {
  items: OrderItem[]
  totalServings: number
  totalPrice: number
  extraServings: number
  pricePerPerson: number
  demand: DemandEstimate
  assessment: 'balanced' | 'generous' | 'excess'
  expectedSurplus: number
  surplusRatio: number
  heuristicScore: number
}
