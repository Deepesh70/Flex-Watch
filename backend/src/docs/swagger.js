const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Flex-Watch Enterprise API',
    version: '1.0.0',
    description: `
**Flex-Watch Backend-For-Frontend (BFF) & Distributed API Service**

Features:
- **Two-Tier Cache**: Local L1 Memory + Distributed L2 Redis with singleflight concurrency collapsing.
- **Cinema Booking Engine**: Idempotent seat selection with atomic conflict prevention (HTTP 409).
- **ML Recommendations**: Content-based cosine similarity engine (~4,800 movie dataset).
- **Observability**: Prometheus metrics (/metrics), structured Pino logs, and request correlation IDs (\`x-request-id\`).
    `,
    contact: {
      name: 'Flex-Watch Engineering',
      url: 'https://github.com/Deepesh70/Flex-Watch',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
    {
      url: 'http://localhost/api',
      description: 'Production Reverse Proxy Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session JWT token',
      },
      GuestHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-guest-id',
        description: 'Persistent anonymous visitor UUID for guest watchlists & bookings',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Resource not found' },
          code: { type: 'string', example: 'NOT_FOUND' },
          requestId: { type: 'string', example: 'd3b07384-d113-4ec4-a5b6-76498a4ff821' },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ready' },
          timestamp: { type: 'string', example: '2026-09-20T01:00:00.000Z' },
          uptime: { type: 'number', example: 124.5 },
          checks: {
            type: 'object',
            properties: {
              database: { type: 'string', example: 'healthy' },
              cache: { type: 'string', example: 'healthy' },
              tmdbConfigured: { type: 'boolean', example: true },
            },
          },
          cacheStats: {
            type: 'object',
            properties: {
              tier: { type: 'string', example: 'L1-Memory' },
              l1Size: { type: 'number', example: 42 },
              totalHits: { type: 'number', example: 120 },
              misses: { type: 'number', example: 15 },
              hitRate: { type: 'string', example: '0.889' },
            },
          },
        },
      },
      Movie: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1108427 },
          title: { type: 'string', example: 'Moana 2' },
          overview: { type: 'string' },
          poster_path: { type: 'string', example: '/aLVkiINNOgr127l1bIXZ9aV98wh.jpg' },
          backdrop_path: { type: 'string', example: '/tElnmtQ6yz1PjN1kePNl8yMSb59.jpg' },
          vote_average: { type: 'number', example: 7.2 },
          release_date: { type: 'string', example: '2024-11-27' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmu8supkc000ucwlw2j57aj8j' },
          userId: { type: 'string', example: 'usr_guest_892b3c1' },
          idempotencyKey: { type: 'string', example: 'bkg-1108427-1726778400000-A1,A2' },
          movieId: { type: 'integer', example: 1108427 },
          movieTitle: { type: 'string', example: 'Moana 2' },
          showtime: { type: 'string', example: '2026-09-20 19:30' },
          seats: {
            type: 'array',
            items: { type: 'string' },
            example: ['A1', 'A2'],
          },
          totalAmount: { type: 'number', example: 30.0 },
          status: { type: 'string', example: 'CONFIRMED' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBookingRequest: {
        type: 'object',
        required: ['movieId', 'movieTitle', 'showtime', 'seats', 'totalAmount', 'idempotencyKey'],
        properties: {
          movieId: { type: 'integer', example: 1108427 },
          movieTitle: { type: 'string', example: 'Moana 2' },
          showtime: { type: 'string', example: '2026-09-20 19:30' },
          seats: {
            type: 'array',
            items: { type: 'string' },
            example: ['A1', 'A2'],
          },
          totalAmount: { type: 'number', example: 30.0 },
          idempotencyKey: { type: 'string', example: 'bkg-1108427-1726778400000-A1,A2' },
        },
      },
      WatchlistItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmu8supjf000ocwlw8dzm24yq' },
          userId: { type: 'string' },
          tmdbId: { type: 'integer', example: 1108427 },
          mediaType: { type: 'string', example: 'movie' },
          title: { type: 'string', example: 'Moana 2' },
          posterPath: { type: 'string' },
          voteAverage: { type: 'number', example: 7.2 },
          addedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health/ready': {
      get: {
        summary: 'Deep Readiness Health Check',
        tags: ['System Health'],
        responses: {
          200: {
            description: 'System is healthy and ready to serve traffic',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } } },
          },
        },
      },
    },
    '/health/live': {
      get: {
        summary: 'Liveness Probe',
        tags: ['System Health'],
        responses: {
          200: {
            description: 'Process is alive',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'alive' } } } } },
          },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus Metrics',
        tags: ['Observability'],
        description: 'Exposes Prometheus metrics for scraping HTTP latencies, status counters, and cache hit ratios.',
        responses: {
          200: {
            description: 'Prometheus text format metrics',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/api/v1/movies/trending': {
      get: {
        summary: 'Get Trending Movies',
        tags: ['Movies'],
        parameters: [
          { name: 'window', in: 'query', schema: { type: 'string', default: 'day' } },
        ],
        responses: {
          200: {
            description: 'Array of trending movies',
            headers: {
              'x-cache': { schema: { type: 'string', example: 'HIT' } },
              'x-request-id': { schema: { type: 'string' } },
            },
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Movie' } },
              },
            },
          },
        },
      },
    },
    '/api/v1/movies/popular': {
      get: {
        summary: 'Get Popular Movies',
        tags: ['Movies'],
        responses: {
          200: {
            description: 'Array of popular movies',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Movie' } } } },
          },
        },
      },
    },
    '/api/v1/movies/{id}': {
      get: {
        summary: 'Get Movie Details by TMDB ID',
        tags: ['Movies'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Movie details object',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Movie' } } },
          },
        },
      },
    },
    '/api/v1/movies/{id}/recommendations': {
      get: {
        summary: 'Content-Based ML Recommendations',
        tags: ['Recommendations Engine'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'title', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Top 5 cosine-similarity recommended movies',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Movie' } } } },
          },
        },
      },
    },
    '/api/v1/bookings/occupied': {
      get: {
        summary: 'Query Occupied Cinema Seats',
        tags: ['Cinema Booking'],
        parameters: [
          { name: 'movieId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'showtime', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Array of already booked seat IDs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    movieId: { type: 'string', example: '1108427' },
                    showtime: { type: 'string', example: '2026-09-20 19:30' },
                    occupiedSeats: { type: 'array', items: { type: 'string' }, example: ['A1', 'A2', 'D4'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/bookings': {
      get: {
        summary: 'List User Bookings',
        tags: ['Cinema Booking'],
        security: [{ BearerAuth: [] }, { GuestHeader: [] }],
        responses: {
          200: {
            description: 'List of confirmed and cancelled bookings',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Booking' } } } },
          },
        },
      },
      post: {
        summary: 'Create Idempotent Cinema Seat Booking',
        tags: ['Cinema Booking'],
        security: [{ BearerAuth: [] }, { GuestHeader: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } },
        },
        responses: {
          201: {
            description: 'Booking confirmed successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
          200: {
            description: 'Idempotent replay: previously existing booking returned',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
          409: {
            description: 'Conflict: One or more selected seats are already reserved for this showtime',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/v1/bookings/{id}': {
      delete: {
        summary: 'Cancel Cinema Booking',
        tags: ['Cinema Booking'],
        security: [{ BearerAuth: [] }, { GuestHeader: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Booking marked as CANCELLED',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
          },
        },
      },
    },
    '/api/v1/watchlist': {
      get: {
        summary: 'Get User Watchlist',
        tags: ['Watchlist'],
        security: [{ BearerAuth: [] }, { GuestHeader: [] }],
        responses: {
          200: {
            description: 'Array of bookmarked movies/shows',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/WatchlistItem' } } } },
          },
        },
      },
      post: {
        summary: 'Add Item to Watchlist',
        tags: ['Watchlist'],
        security: [{ BearerAuth: [] }, { GuestHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tmdbId', 'mediaType', 'title'],
                properties: {
                  tmdbId: { type: 'integer', example: 1108427 },
                  mediaType: { type: 'string', example: 'movie' },
                  title: { type: 'string', example: 'Moana 2' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Watchlist item persisted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WatchlistItem' } } },
          },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  // Raw JSON spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Interactive Swagger UI with custom branding
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Flex-Watch API Documentation',
      customCss: `
        .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #e50914; }
        .swagger-ui .topbar .topbar-wrapper img { content: url('https://img.shields.io/badge/Flex--Watch-API_Explorer-E50914?style=for-the-badge'); }
      `,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

module.exports = { setupSwagger, swaggerDocument };
