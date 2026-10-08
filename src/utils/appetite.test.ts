import { describe, expect, it } from 'vitest'
import type { AppetiteLevel } from '../types/appetite'
import { appetiteLevels, estimateDemand } from './appetite'

describe('estimateDemand', () => {
  it('usa a fome normal quando não há um nível explícito', () => {
    expect(estimateDemand(6)).toEqual(estimateDemand(6, 3))
    expect(estimateDemand(6).expectedServings).toBe(6)
  })

  it('traduz os cinco níveis para a capacidade padrão do cardápio', () => {
    const demands = appetiteLevels.map((appetite) => estimateDemand(20, appetite.value))
    expect(demands.map((demand) => demand.expectedServings)).toEqual([13, 16, 20, 24, 28])
    expect(demands.map((demand) => demand.multiplier)).toEqual([0.65, 0.8, 1, 1.2, 1.4])
    expect(demands.map((demand) => demand.minimumServings)).toEqual([13, 16, 20, 24, 28])
  })

  it('constrói cenários simétricos de variação em torno da demanda média', () => {
    const demand = estimateDemand(9, 2)
    expect(demand.expectedServings).toBe(7.2)
    expect(demand.lowerServings).toBeCloseTo(6.66, 10)
    expect(demand.upperServings).toBeCloseTo(7.74, 10)
    expect(demand.minimumServings).toBe(8)
  })

  it('reduz a variação relativa em grupos maiores', () => {
    const small = estimateDemand(2)
    const large = estimateDemand(20)
    expect((small.upperServings - small.expectedServings) / small.expectedServings)
      .toBeGreaterThan((large.upperServings - large.expectedServings) / large.expectedServings)
    expect(small.lowerServings).toBeGreaterThanOrEqual(0)
  })

  it('evita arredondar demandas inteiras para uma porção adicional por imprecisão decimal', () => {
    expect(estimateDemand(5, 2).minimumServings).toBe(4)
    expect(estimateDemand(5, 5).minimumServings).toBe(7)
    expect(estimateDemand(15, 5).minimumServings).toBe(21)
    expect(estimateDemand(20, 5).minimumServings).toBe(28)
    expect(estimateDemand(3, 5).expectedServings).toBe(4.2)
    expect(estimateDemand(3, 5).minimumServings).toBe(5)
  })

  it.each([1, 21, 2.5, NaN, Infinity])('rejeita o tamanho inválido de grupo %s', (people) => {
    expect(() => estimateDemand(people)).toThrow(RangeError)
  })

  it.each([0, 6, 2.5, NaN])('rejeita o nível de fome inválido %s', (level) => {
    expect(() => estimateDemand(4, level as AppetiteLevel)).toThrow(RangeError)
  })
})
