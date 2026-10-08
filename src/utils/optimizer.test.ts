import { describe, expect, it } from 'vitest'
import { menu } from '../data/menu'
import type { AppetiteLevel } from '../types/appetite'
import type { Flavor, FlavorId } from '../types/menu'
import { appetiteLevels, estimateDemand } from './appetite'
import { applyPrices } from './prices'
import { compareFlavors, optimizeMenu } from './optimizer'

// Enumerates every multiset of portions up to a generous capacity cap that is
// independent of the production bound. Demand and penalties are recomputed here.
function expectSameAsBruteForce(flavors: Flavor[], people: number, selected: FlavorId[], appetite: AppetiteLevel, extraCapacity: number) {
  const options = flavors.filter((flavor) => selected.includes(flavor.id))
    .flatMap((flavor, flavorIndex) => flavor.options.map((option) => ({ ...option, flavorIndex })))
  const factors = [0.65, 0.8, 1, 1.2, 1.4]
  const mean = Number((people * factors[appetite - 1]).toFixed(10))
  const spread = 0.18 * Math.sqrt(people)
  const minimum = Math.ceil(mean)
  const maximum = Math.ceil(mean + spread) + extraCapacity
  const unitPrice = Math.min(...options.map((option) => option.price / option.serves))
  // Orders with the same servings of each flavor are the same food:
  // keep only the cheapest packaging, then the one with fewer portions.
  const best = new Map<string, number[]>()
  function enumerate(start: number, serves: number, price: number, portions: number, flavorServings: number[]) {
    const key = flavorServings.join(',')
    if (serves >= minimum && (!best.has(key) || price < best.get(key)![1] || (price === best.get(key)![1] && portions < best.get(key)![3]))) {
      const risk = [mean - spread, mean, mean + spread].reduce((total, demand, index) => {
        const weight = [0.2, 0.6, 0.2][index]
        return total + weight * unitPrice * (Math.max(demand - serves, 0) * 8 + Math.max(serves - demand, 0) * 0.2)
      }, 0)
      best.set(key, [price + risk, price, serves - mean, portions])
    }
    for (let index = start; index < options.length; index += 1) {
      const option = options[index]
      if (serves + option.serves <= maximum) {
        const next = [...flavorServings]
        next[option.flavorIndex] += option.serves
        enumerate(index, serves + option.serves, price + option.price, portions + 1, next)
      }
    }
  }
  enumerate(0, 0, 0, 0, selected.map(() => 0))
  const scores = [...best.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3])

  const actual = optimizeMenu(flavors, people, selected, appetite).map((order) => [
    order.heuristicScore,
    order.totalPrice,
    order.extraServings,
    order.items.reduce((total, item) => total + item.quantity, 0),
  ])
  expect(actual).toHaveLength(Math.min(4, scores.length))
  actual.forEach((order, index) => order.forEach((value, field) => {
    expect(value).toBeCloseTo(scores[index][field], 7)
  }))
}

describe('optimizeMenu', () => {
  it('encontra a opção mais barata para três pessoas', () => {
    const [best] = optimizeMenu(menu, 3, ['abobrinha', 'frango'])

    expect(best.totalServings).toBe(3)
    expect(best.totalPrice).toBe(105)
    expect(best.items).toEqual([
      expect.objectContaining({ code: 403, flavorId: 'abobrinha', quantity: 1 }),
    ])
  })

  it('combina tamanhos para atender cinco pessoas sem sobra', () => {
    const [best] = optimizeMenu(menu, 5, ['abobrinha'])

    expect(best.totalServings).toBe(5)
    expect(best.extraServings).toBe(0)
    expect(best.totalPrice).toBe(175)
    expect(best.items.map((item) => item.code).sort()).toEqual([402, 403])
  })

  it('respeita o filtro de sabor', () => {
    const [best] = optimizeMenu(menu, 5, ['frango'])

    expect(best.totalPrice).toBe(238)
    expect(best.items.every((item) => item.flavorId === 'frango')).toBe(true)
  })

  it('considera combinações repetidas quando são mais econômicas', () => {
    const [best] = optimizeMenu(menu, 6, ['file-mignon'])

    expect(best.totalPrice).toBe(464)
    expect(best.items).toEqual([
      expect.objectContaining({ code: 443, quantity: 2 }),
    ])
  })

  it('retorna vazio quando nenhum sabor está selecionado', () => {
    expect(optimizeMenu(menu, 4, [])).toEqual([])
  })

  it('rejeita grupos fora do limite suportado', () => {
    expect(() => optimizeMenu(menu, 1, ['abobrinha'])).toThrow(RangeError)
    expect(() => optimizeMenu(menu, 21, ['abobrinha'])).toThrow(RangeError)
    expect(() => optimizeMenu(menu, 2.5, ['abobrinha'])).toThrow(RangeError)
    expect(() => optimizeMenu(menu, NaN, ['abobrinha'])).toThrow(RangeError)
  })

  it('atende vinte pessoas com cinco porções de frango para quatro pessoas cada', () => {
    const [best] = optimizeMenu(menu, 20, ['frango'])

    expect(best.items).toEqual([expect.objectContaining({ code: 414, serves: 4, quantity: 5, price: 180 })])
    expect(best.totalServings).toBe(20)
    expect(best.totalPrice).toBe(900)
    expect(best.pricePerPerson).toBe(45)
    expect(best.extraServings).toBe(0)
  })

  it('leva o risco de faltar em conta mesmo quando há uma opção nominal mais barata', () => {
    const [best] = optimizeMenu(menu, 19, ['frango'])

    expect(best.items).toEqual([
      expect.objectContaining({ code: 414, quantity: 5 }),
    ])
    expect(best.totalPrice).toBe(900)
    expect(best.totalServings).toBe(20)
    const exact = optimizeMenu(menu, 19, ['frango']).find((order) => order.totalServings === 19)
    expect(exact).toBeDefined()
    expect(exact!.totalPrice).toBe(863)
    expect(best.heuristicScore).toBeLessThan(exact!.heuristicScore)
  })

  it('considera a economia de uma promoção mesmo quando ela deixa uma porção de sobra', () => {
    const promotionalMenu = [{
      ...menu[1],
      options: [
        { code: 412, serves: 2, price: 60 },
        { code: 413, serves: 3, price: 150 },
        { code: 414, serves: 4, price: 80 },
      ],
    }]

    const [best] = optimizeMenu(promotionalMenu, 3, ['frango'])
    expect(best.totalPrice).toBe(80)
    expect(best.totalServings).toBe(4)
    expect(best.extraServings).toBe(1)
  })

  it('prefere menos porções quando preço e capacidade empatam', () => {
    const [best] = optimizeMenu(menu, 12, ['abobrinha'])
    expect(best.items).toEqual([expect.objectContaining({ code: 404, quantity: 3 })])
    expect(best.totalPrice).toBe(420)
  })

  it('dimensiona um grupo de vinte pessoas com muita fome acima do limite nominal de pessoas', () => {
    const [best] = optimizeMenu(menu, 20, ['frango'], 5)
    expect(best.demand.expectedServings).toBe(28)
    expect(best.totalServings).toBe(28)
    expect(best.totalPrice).toBe(1260)
    expect(best.items).toEqual([expect.objectContaining({ code: 414, quantity: 7 })])
  })

  it('reduz a quantidade para vinte pessoas com fome muito leve', () => {
    const [best] = optimizeMenu(menu, 20, ['frango'], 1)
    expect(best.demand.expectedServings).toBe(13)
    expect(best.totalServings).toBe(14)
    expect(best.totalPrice).toBe(635)
    expect(best.totalServings).toBeLessThan(20)
    expect(best.extraServings).toBe(1)
  })

  it('aumenta a cobertura mínima conforme a fome cresce em todos os tamanhos de grupo', () => {
    for (let people = 2; people <= 20; people += 1) {
      let previousMinimum = 0
      let previousCapacity = 0
      for (const appetite of appetiteLevels) {
        const [best] = optimizeMenu(menu, people, ['frango'], appetite.value)
        expect(best.demand.minimumServings).toBeGreaterThanOrEqual(previousMinimum)
        expect(best.totalServings).toBeGreaterThanOrEqual(previousCapacity)
        expect(best.totalServings).toBeGreaterThanOrEqual(best.demand.minimumServings)
        previousMinimum = best.demand.minimumServings
        previousCapacity = best.totalServings
      }
    }
  })

  it('sinaliza excesso quando o menor prato disponível já é grande para a fome do grupo', () => {
    const [best] = optimizeMenu(menu, 2, ['abobrinha'], 1)
    expect(best.items).toEqual([expect.objectContaining({ code: 402, quantity: 1 })])
    expect(best.totalServings).toBe(2)
    expect(best.expectedSurplus).toBe(0.7)
    expect(best.surplusRatio).toBeCloseTo(0.7 / 1.3)
    expect(best.assessment).toBe('excess')
  })

  it('distingue sobra pequena, margem generosa e excesso em relação à fome estimada', () => {
    expect(optimizeMenu(menu, 3, ['abobrinha'], 4)[0].assessment).toBe('balanced')
    expect(optimizeMenu(menu, 2, ['abobrinha'], 2)[0].assessment).toBe('generous')
    expect(optimizeMenu(menu, 2, ['abobrinha'], 1)[0].assessment).toBe('excess')
  })

  it('calcula sobra fracionária e mantém o preço por pessoa baseado nas pessoas reais', () => {
    const [best] = optimizeMenu(menu, 3, ['abobrinha'], 5)
    expect(best.totalServings).toBe(5)
    expect(best.expectedSurplus).toBe(0.8)
    expect(best.extraServings).toBe(0.8)
    expect(best.pricePerPerson).toBe(best.totalPrice / 3)
  })

  it('valida a fome mesmo quando nenhum sabor foi selecionado', () => {
    expect(() => optimizeMenu(menu, 4, [], 6 as AppetiteLevel)).toThrow(RangeError)
  })

  it('mantém totais consistentes e alternativas únicas em todos os grupos e filtros', () => {
    for (let mask = 1; mask < 1 << menu.length; mask += 1) {
      const selected = menu.filter((_, index) => mask & (1 << index)).map((flavor) => flavor.id)
      for (let people = 2; people <= 20; people += 1) {
        for (const appetite of appetiteLevels) {
          const recommendations = optimizeMenu(menu, people, selected, appetite.value)
          const signatures = recommendations.map((order) => order.items.map((item) => `${item.code}:${item.quantity}`).join('|'))
          expect(new Set(signatures).size).toBe(recommendations.length)
          expect(recommendations).toHaveLength(4)

          for (const order of recommendations) {
            expect(order.totalServings).toBeGreaterThanOrEqual(estimateDemand(people, appetite.value).minimumServings)
            expect(order.totalServings).toBe(order.items.reduce((total, item) => total + item.quantity * item.serves, 0))
            expect(order.totalPrice).toBe(order.items.reduce((total, item) => total + item.quantity * item.price, 0))
            expect(order.items.every((item) => selected.includes(item.flavorId))).toBe(true)
            expect(order.extraServings).toBeCloseTo(order.totalServings - order.demand.expectedServings, 9)
            expect(order.expectedSurplus).toBe(order.extraServings)
            expect(order.surplusRatio).toBeCloseTo(order.expectedSurplus / order.demand.expectedServings)
            expect(order.heuristicScore).toBeGreaterThanOrEqual(order.totalPrice)
            expect(order.pricePerPerson).toBe(order.totalPrice / people)
          }
          expect(recommendations.map((order) => order.heuristicScore))
            .toEqual(recommendations.map((order) => order.heuristicScore).sort((a, b) => a - b))
        }
      }
    }
  }, 30000)

  it('produz os quatro melhores resultados comparados a uma busca exaustiva independente', () => {
    for (let mask = 1; mask < 1 << menu.length; mask += 1) {
      const selected: FlavorId[] = menu.filter((_, index) => mask & (1 << index)).map((flavor) => flavor.id)
      for (let people = 2; people <= 4; people += 1) {
        for (const appetite of appetiteLevels) {
          expectSameAsBruteForce(menu, people, selected, appetite.value, 8)
        }
      }
    }
  })

  it('acerta as alternativas quando a porção grande fica em promoção', () => {
    const promotionalMenu = applyPrices(menu, { 412: 100, 413: 100, 414: 60 })
    for (let people = 2; people <= 20; people += 1) {
      for (const appetite of appetiteLevels) {
        expectSameAsBruteForce(promotionalMenu, people, ['frango'], appetite.value, 16)
      }
    }
    const alternatives = optimizeMenu(promotionalMenu, 2, ['frango'], 1)
    expect(alternatives.map((order) => order.totalPrice)).toEqual([60, 100, 100, 120])
  })

  it('não mostra a mesma comida dividida em porções diferentes como alternativa', () => {
    for (const people of [8, 10, 12]) {
      const recommendations = optimizeMenu(menu, people, menu.map((flavor) => flavor.id))
      const food = recommendations.map((order) =>
        menu.map((flavor) => order.items
          .filter((item) => item.flavorId === flavor.id)
          .reduce((total, item) => total + item.quantity * item.serves, 0)).join(','))
      expect(new Set(food).size).toBe(recommendations.length)
    }
  })

  it('mantém só a embalagem mais barata para a mesma quantidade de um sabor', () => {
    const recommendations = optimizeMenu(menu, 8, ['frango'])
    expect(recommendations[0].items).toEqual([expect.objectContaining({ code: 414, quantity: 2 })])
    expect(recommendations.map((order) => order.totalServings)).toEqual([8, 9, 10, 11])
  })

  it('não modifica o cardápio ao calcular', () => {
    const originalMenu = structuredClone(menu)
    for (const appetite of appetiteLevels) {
      optimizeMenu(menu, 20, menu.map((flavor) => flavor.id), appetite.value)
    }
    expect(menu).toEqual(originalMenu)
  })
})

describe('compareFlavors', () => {
  it('mostra o melhor pedido de cada sabor selecionado, do mais barato ao mais caro', () => {
    const comparisons = compareFlavors(menu, 8, ['file-mignon', 'abobrinha', 'frango'])
    expect(comparisons.map((comparison) => comparison.flavorId)).toEqual(['abobrinha', 'frango', 'file-mignon'])
    expect(comparisons.map((comparison) => comparison.recommendation.totalPrice)).toEqual([280, 360, 619])
    expect(comparisons.map((comparison) => comparison.differenceFromBest)).toEqual([0, 80, 339])
    expect(comparisons.every((comparison) =>
      comparison.recommendation.items.every((item) => item.flavorId === comparison.flavorId))).toBe(true)
  })

  it('coincide com o pedido recomendado quando há um único sabor', () => {
    const [comparison] = compareFlavors(menu, 7, ['tilapia'], 4)
    expect(comparison.recommendation).toEqual(optimizeMenu(menu, 7, ['tilapia'], 4)[0])
  })

  it('retorna vazio sem sabores selecionados', () => {
    expect(compareFlavors(menu, 4, [])).toEqual([])
  })
})
