import type { AppetiteLevel, DemandEstimate } from '../types/appetite'
import type { Flavor, FlavorId, OrderItem, Recommendation } from '../types/menu'
import { estimateDemand } from './appetite'

export { MIN_PEOPLE, MAX_PEOPLE } from './appetite'
const MAX_RECOMMENDATIONS = 4

interface Candidate {
  quantities: number[]
  // Servings of each selected flavor. Two orders with the same vector deliver
  // the same food, so only the cheapest way to package it is worth showing.
  flavorServings: number[]
  priceInCents: number
  portionCount: number
}

export interface FlavorComparison {
  flavorId: FlavorId
  flavorName: string
  recommendation: Recommendation
  differenceFromBest: number
}

function compareCandidates(a: Candidate, b: Candidate): number {
  if (a.priceInCents !== b.priceInCents) return a.priceInCents - b.priceInCents
  if (a.portionCount !== b.portionCount) return a.portionCount - b.portionCount
  for (let index = 0; index < a.quantities.length; index += 1) {
    // Options are ordered by size: prefer larger portions when price and count tie.
    if (a.quantities[index] !== b.quantities[index]) {
      return b.quantities[index] - a.quantities[index]
    }
  }
  return 0
}

function keepBestDistinct(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>()
  return candidates.sort(compareCandidates).filter((candidate) => {
    const key = candidate.flavorServings.join(',')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, MAX_RECOMMENDATIONS)
}

function scoreOrder(price: number, servings: number, demand: DemandEstimate, unitPrice: number): number {
  const scenarios = [
    { servings: demand.lowerServings, weight: 0.2 },
    { servings: demand.expectedServings, weight: 0.6 },
    { servings: demand.upperServings, weight: 0.2 },
  ]

  // Running short matters more than a little leftover. These weights are a
  // transparent preference used for ranking, not observed probabilities.
  return scenarios.reduce((score, scenario) => {
    const shortfall = Math.max(0, scenario.servings - servings)
    const surplus = Math.max(0, servings - scenario.servings)
    return score + scenario.weight * unitPrice * (8 * shortfall + 0.2 * surplus)
  }, price)
}

export function optimizeMenu(
  flavors: Flavor[],
  people: number,
  selectedFlavorIds: FlavorId[],
  appetiteLevel: AppetiteLevel = 3,
): Recommendation[] {
  const demand = estimateDemand(people, appetiteLevel)

  const allowed = new Set(selectedFlavorIds)
  const selectedFlavors = flavors.filter((flavor) => allowed.has(flavor.id))
  const options = selectedFlavors.flatMap((flavor, flavorIndex) =>
    [...flavor.options]
      .sort((a, b) => b.serves - a.serves)
      .map((option) => ({
        ...option,
        flavorId: flavor.id,
        flavorName: flavor.name,
        flavorIndex,
      })),
  )

  if (options.length === 0) return []

  // Any order above this cap can drop one to four portions and still cover the
  // intense scenario, which yields four cheaper orders with smaller surplus.
  const maxServes = Math.max(...options.map((option) => option.serves))
  const maxServings = Math.ceil(demand.upperServings) + MAX_RECOMMENDATIONS * maxServes - 1
  const unitPrice = Math.min(...options.map((option) => Math.round(option.price * 100) / 100 / option.serves))
  const candidates: Candidate[][] = Array.from({ length: maxServings + 1 }, () => [])
  candidates[0] = [{
    quantities: options.map(() => 0),
    flavorServings: selectedFlavors.map(() => 0),
    priceInCents: 0,
    portionCount: 0,
  }]

  // The scenario penalty depends only on capacity, so the four cheapest
  // distinct orders at each capacity are enough to find the four best scores.
  // Processing one option at a time avoids permutations of the same order.
  for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
    const option = options[optionIndex]
    for (let servings = option.serves; servings <= maxServings; servings += 1) {
      const additions = candidates[servings - option.serves].map((candidate) => {
        const quantities = [...candidate.quantities]
        quantities[optionIndex] += 1
        const flavorServings = [...candidate.flavorServings]
        flavorServings[option.flavorIndex] += option.serves
        return {
          quantities,
          flavorServings,
          priceInCents: candidate.priceInCents + Math.round(option.price * 100),
          portionCount: candidate.portionCount + 1,
        }
      })
      candidates[servings] = keepBestDistinct([...candidates[servings], ...additions])
    }
  }

  return candidates
    .flatMap((orders, servings) =>
      servings >= demand.minimumServings
        ? orders.map((order) => ({
            order,
            servings,
            score: scoreOrder(order.priceInCents / 100, servings, demand, unitPrice),
          }))
        : [],
    )
    .sort((a, b) =>
      a.score - b.score ||
      a.order.priceInCents - b.order.priceInCents ||
      a.servings - b.servings ||
      compareCandidates(a.order, b.order),
    )
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ order, servings, score }) => {
      const items: OrderItem[] = options.flatMap(({ flavorIndex: _, ...option }, index) =>
        order.quantities[index] > 0 ? [{ ...option, quantity: order.quantities[index] }] : [],
      )
      const totalPrice = order.priceInCents / 100
      const expectedSurplus = Math.max(0, Math.round((servings - demand.expectedServings) * 1e10) / 1e10)
      const surplusRatio = expectedSurplus / demand.expectedServings
      const assessment = surplusRatio <= 0.15 ? 'balanced' : surplusRatio <= 0.25 ? 'generous' : 'excess'
      return {
        items,
        totalServings: servings,
        totalPrice,
        extraServings: expectedSurplus,
        pricePerPerson: totalPrice / people,
        demand: { ...demand },
        assessment,
        expectedSurplus,
        surplusRatio,
        heuristicScore: score,
      }
    })
}

// The optimizer treats selected flavors as interchangeable, so the cheapest one
// always wins. This shows what each selected flavor would cost on its own.
export function compareFlavors(
  flavors: Flavor[],
  people: number,
  selectedFlavorIds: FlavorId[],
  appetiteLevel: AppetiteLevel = 3,
): FlavorComparison[] {
  const allowed = new Set(selectedFlavorIds)
  const comparisons = flavors
    .filter((flavor) => allowed.has(flavor.id))
    .map((flavor) => ({ flavor, recommendation: optimizeMenu(flavors, people, [flavor.id], appetiteLevel)[0] }))
    .filter(({ recommendation }) => recommendation !== undefined)
  if (comparisons.length === 0) return []

  const cheapest = Math.min(...comparisons.map(({ recommendation }) => recommendation.totalPrice))
  return comparisons
    .map(({ flavor, recommendation }) => ({
      flavorId: flavor.id,
      flavorName: flavor.name,
      recommendation,
      differenceFromBest: Math.round((recommendation.totalPrice - cheapest) * 100) / 100,
    }))
    .sort((a, b) => a.recommendation.totalPrice - b.recommendation.totalPrice)
}
