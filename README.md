# ParmeJá

Calculadora 100% client-side que recomenda combinações de parmegianas para grupos de 2 a 20 pessoas. Os dados do cardápio ficam em `src/data/menu.ts` e a lógica de otimização, independente da interface, fica em `src/utils/optimizer.ts`.

As recomendações consideram cinco níveis de fome média, consumo estimado, variação dentro do grupo, preço e possível sobra. Os sabores selecionados são opções permitidas; não é obrigatório incluir todos. Cada item informa a quantidade de porções compartilhadas, o tamanho indicado no cardápio, o código e o preço unitário. Quando mais de um sabor está marcado, a seção “Comparar sabores” mostra o melhor pedido só com cada um e quanto ele custa a mais que o mais barato.

O cálculo usa programação dinâmica para manter as quatro melhores combinações distintas por capacidade. Pedidos com a mesma quantidade de cada sabor contam como uma única combinação (vale a embalagem mais barata), então as alternativas nunca repetem a mesma comida dividida em porções diferentes. A heurística em `src/utils/appetite.ts` estima a demanda; `src/utils/optimizer.ts` compara cenários de consumo e penaliza falta e excesso. As hipóteses, os pesos e as decisões estão em [PLANEJAMENTO.md](PLANEJAMENTO.md). Esses parâmetros não são medições nutricionais ou estatísticas do restaurante.

O visual é um dark mode minimalista com tons neutros (zinco) e um único destaque laranja, definido em `src/index.css` sem fontes ou chamadas externas.

## Atualizar os preços

Os preços da foto ficam em `src/data/menu.ts`. Para ajustar sem mexer no código, use o botão **Preços** no topo da página: os valores alterados substituem os do cardápio no cálculo e ficam salvos no `localStorage` do navegador (só as diferenças são guardadas, então novos preços padrão publicados no código continuam valendo para os itens não alterados). **Restaurar cardápio** volta aos valores da foto. A lógica está em `src/utils/prices.ts`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Testes e build

```bash
npm test
npm run build
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie este projeto para a branch `main`.
2. Em **Settings → Pages**, escolha **GitHub Actions** como fonte.
3. O workflow incluído testa, compila e publica o site automaticamente.

O `base` do Vite é derivado de `GITHUB_REPOSITORY` durante o build, então os caminhos funcionam automaticamente no endereço `usuario.github.io/nome-do-repositorio/`.
