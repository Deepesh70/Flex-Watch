const sampleMovie = {
  id: 101,
  title: 'Dune: Part Two',
  original_title: 'Dune: Part Two',
  overview: 'Paul Atreides unites with Chani and the Fremen.',
  poster_path: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s520b24.jpg',
  vote_average: 8.6,
  release_date: '2024-03-01',
  genre_ids: [878, 12],
  runtime: 166,
};

const mockAxios = {
  create: jest.fn(() => mockAxios),
  get: jest.fn((url) => {
    if (url.includes('/credits')) {
      return Promise.resolve({
        data: {
          id: 101,
          cast: [{ id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides' }],
          crew: [],
        },
      });
    }
    if (url.includes('/movie/101') || url.includes('/movie/1')) {
      return Promise.resolve({ data: sampleMovie });
    }
    return Promise.resolve({
      data: {
        results: [sampleMovie],
      },
    });
  }),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: { baseURL: '', params: {} },
};

module.exports = mockAxios;
module.exports.default = mockAxios;
