import type { Flavor } from '../types/menu'

export const menu: Flavor[] = [
  {
    id: 'abobrinha',
    name: 'Abobrinha',
    shortDescription: 'A opção vegetariana e mais econômica.',
    vegetarian: true,
    options: [
      { code: 402, serves: 2, price: 70 },
      { code: 403, serves: 3, price: 105 },
      { code: 404, serves: 4, price: 140 },
    ],
  },
  {
    id: 'frango',
    name: 'Frango',
    shortDescription: 'Clássica, leve e ótima para dividir.',
    options: [
      { code: 412, serves: 2, price: 95 },
      { code: 413, serves: 3, price: 143 },
      { code: 414, serves: 4, price: 180 },
    ],
  },
  {
    id: 'tilapia',
    name: 'Tilápia / Saint Peter',
    shortDescription: 'Peixe empanado com molho e queijo.',
    options: [
      { code: 422, serves: 2, price: 140 },
      { code: 423, serves: 3, price: 210 },
      { code: 424, serves: 4, price: 280 },
    ],
  },
  {
    id: 'file-mignon',
    name: 'Filé mignon',
    shortDescription: 'A opção mais especial do cardápio.',
    options: [
      { code: 442, serves: 2, price: 155 },
      { code: 443, serves: 3, price: 232 },
      { code: 444, serves: 4, price: 310 },
    ],
  },
]

export const menuNote = 'Todas acompanham arroz branco e batata frita.'
