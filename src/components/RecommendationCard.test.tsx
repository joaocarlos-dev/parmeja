import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RecommendationCard } from './RecommendationCard'
import { AlternativesList } from './AlternativesList'
import { PeopleSelector } from './PeopleSelector'
import { AppetiteSelector } from './AppetiteSelector'
import { menu } from '../data/menu'
import { optimizeMenu } from '../utils/optimizer'

describe('clareza do pedido', () => {
  it('explica as três porções de frango, o tamanho e o preço unitário', () => {
    const [order] = optimizeMenu(menu, 12, ['frango'])
    const markup = renderToStaticMarkup(<RecommendationCard recommendation={order} people={12} />)
    expect(markup).toContain('3 porções de parmegiana de frango')
    expect(markup).toContain('Cada porção serve 4 pessoas no cardápio.')
    expect(markup).toContain('180,00')
    expect(markup).toContain('540,00')
    expect(markup).toContain('45,00')
    expect(markup).not.toMatch(/3[×x]/)
  })

  it('descreve uma porção no singular', () => {
    const [order] = optimizeMenu(menu, 4, ['frango'])
    const markup = renderToStaticMarkup(<RecommendationCard recommendation={order} people={4} />)
    expect(markup).toContain('1 porção de parmegiana de frango')
    expect(markup).toContain('Esta porção serve 4 pessoas no cardápio.')
    expect(markup).toContain('1 porção compartilhada')
  })

  it('explica a fome, a faixa de consumo e as hipóteses', () => {
    const [order] = optimizeMenu(menu, 6, ['frango'], 1)
    const markup = renderToStaticMarkup(<RecommendationCard recommendation={order} people={6} />)
    expect(markup).toContain('Fome muito leve')
    expect(markup).toContain('3,9 refeições individuais')
    expect(markup).toContain('Como chegamos a esse pedido?')
    expect(markup).toContain('hipóteses ajustáveis')
  })

  it('avisa quando a menor porção pode ser excessiva para duas pessoas com pouca fome', () => {
    const [order] = optimizeMenu(menu, 2, ['frango'], 1)
    const markup = renderToStaticMarkup(<RecommendationCard recommendation={order} people={2} />)
    expect(markup).toContain('Pode sobrar')
    expect(markup).toContain('Consumo esperado')
    expect(markup).toContain('1,3')
  })

  it('também explica os tamanhos nas alternativas', () => {
    const order = optimizeMenu(menu, 12, ['frango'])[0]
    const markup = renderToStaticMarkup(<AlternativesList alternatives={[order]} />)
    expect(markup).toContain('3 porções de parmegiana de frango')
    expect(markup).toContain('Para 4 pessoas cada')
    expect(markup).toContain('folga estimada')
  })

  it('usa o singular para uma refeição de folga', () => {
    const order = optimizeMenu(menu, 3, ['abobrinha']).find((option) => option.expectedSurplus === 1)!
    const markup = renderToStaticMarkup(<AlternativesList alternatives={[order]} />)
    expect(markup).toContain('folga estimada de 1 refeição de referência')
    expect(markup).not.toContain('1 refeições')
  })

  it('mostra um estado vazio quando nenhum sabor foi selecionado', () => {
    const markup = renderToStaticMarkup(<RecommendationCard people={20} />)
    expect(markup).toContain('Selecione um sabor para calcular')
    expect(markup).toContain('20 pessoas')
  })

  it('limita o controle a vinte pessoas e desabilita o incremento no máximo', () => {
    const markup = renderToStaticMarkup(<PeopleSelector value={20} onChange={() => {}} />)
    expect(markup).toContain('max="20"')
    expect(markup).toMatch(/disabled="" aria-label="Aumentar número de pessoas"/)
  })

  it('oferece cinco níveis e comunica o nível selecionado', () => {
    const markup = renderToStaticMarkup(<AppetiteSelector value={5} onChange={() => {}} />)
    expect(markup.match(/type="radio"/g)).toHaveLength(5)
    expect(markup).toContain('aria-label="Muito alta"')
    expect(markup).toContain('Nível 5 de 5')
  })
})
