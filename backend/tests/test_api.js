const axios = require('axios');

async function testAll() {
  console.log('--- Testing Flex-Watch Backend API ---');
  let base = 'http://localhost:5000';
  let serverInstance = null;

  // Check if server is already running on port 5000, otherwise start on ephemeral port
  try {
    await axios.get(`${base}/health/live`, { timeout: 800 });
  } catch {
    const { app } = require('../src/server');
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        base = `http://localhost:${port}`;
        resolve();
      });
    });
  }

  try {
    // 1. Health
    const health = await axios.get(`${base}/health/ready`);
    console.log('✔ Health Check:', health.data.status, health.data.checks);

    // 2. Movies trending & details (live TMDB connectivity verification)
    if (health.data.checks.tmdbConfigured) {
      let trending;
      for (let i = 0; i < 3; i++) {
        try {
          trending = await axios.get(`${base}/api/v1/movies/trending`);
          break;
        } catch (err) {
          if (i === 2) throw err;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      console.log(`✔ Trending Movies count: ${trending.data.length}, Cache Header: ${trending.headers['x-cache-source']}`);

      // 3. Movie details
      let movie;
      for (let i = 0; i < 3; i++) {
        try {
          movie = await axios.get(`${base}/api/v1/movies/1108427`);
          break;
        } catch (err) {
          if (i === 2) throw err;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      console.log(`✔ Movie Details: ${movie.data.title}`);
    } else {
      console.log('ℹ Live TMDB proxy tests skipped (TMDB_API_KEY not configured in environment)');
    }

    // 4. Recommendations (from ML dataset)
    const recs = await axios.get(`${base}/api/v1/movies/19995/recommendations?title=Avatar`);
    console.log(`✔ Recommendations count: ${recs.data.length}, Source: ${recs.headers['x-recommendation-source']}`);

    // 4b. Recommendations Fallback (for title not in offline ML dataset, testing env reference)
    const recsFallback = await axios.get(`${base}/api/v1/movies/999999999/recommendations?title=UnknownMovieXYZ`);
    console.log(`✔ Fallback recommendations handled gracefully, Source: ${recsFallback.headers['x-recommendation-source']}`);

    // 5. Watchlist POST
    const added = await axios.post(`${base}/api/v1/watchlist`, {
      tmdbId: 1108427,
      title: 'Moana',
      mediaType: 'movie',
      voteAverage: 7.3,
    }, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ Watchlist Add: ${added.data.title} (ID: ${added.data.id})`);

    // 6. Watchlist GET
    const list = await axios.get(`${base}/api/v1/watchlist`, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ Watchlist GET items count: ${list.data.length}`);

    // 7. Watchlist DELETE
    const deleted = await axios.delete(`${base}/api/v1/watchlist/1108427`, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ Watchlist DELETE success: ${deleted.data.success}`);

    // 8. Watchlist rejection when unauthenticated and missing x-guest-id
    try {
      await axios.get(`${base}/api/v1/watchlist`);
      throw new Error('Expected 401 for missing guest id and auth');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✔ Watchlist rejects unauthenticated request without x-guest-id (401)');
      } else {
        throw err;
      }
    }

    // 9. Optional auth passes through with invalid Bearer token when x-guest-id is present
    const optionalRes = await axios.get(`${base}/api/v1/watchlist`, {
      headers: {
        authorization: 'Bearer invalid.expired.token',
        'x-guest-id': 'test_architect_user',
      },
    });
    console.log(`✔ OptionalAuth gracefully handles invalid token without 401 (items: ${optionalRes.data.length})`);

    // 10. Booking API Integration Tests
    const testShowtime = new Date(Date.now() + 86400000).toISOString();
    const testIdempotencyKey = `idemp_test_${Date.now()}`;

    // 10a. Create Booking
    const bookingRes = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: testIdempotencyKey,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: testShowtime,
      seats: ['A1', 'A2'],
      totalAmount: 30.0,
    }, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ Booking POST created: ${bookingRes.data.id} for seats [${bookingRes.data.seats.join(', ')}]`);

    // 10b. Idempotent Replay
    const replayRes = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: testIdempotencyKey,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: testShowtime,
      seats: ['A1', 'A2'],
      totalAmount: 30.0,
    }, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    if (replayRes.headers['x-idempotent-replay'] !== 'true' || replayRes.data.id !== bookingRes.data.id) {
      throw new Error('Idempotent replay failed');
    }
    console.log('✔ Booking idempotent replay handled successfully');

    // 10c. Conflict Check (Attempting to book seat A2 which is already confirmed)
    try {
      await axios.post(`${base}/api/v1/bookings`, {
        idempotencyKey: `idemp_conflict_${Date.now()}`,
        movieId: 1108427,
        movieTitle: 'Moana',
        showtime: testShowtime,
        seats: ['A2', 'A3'],
        totalAmount: 30.0,
      }, {
        headers: { 'x-guest-id': 'test_architect_user' }
      });
      throw new Error('Expected 409 Conflict for overlapping seat');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log(`✔ Booking conflict rejection (409) succeeded: ${err.response.data.detail}`);
      } else {
        throw err;
      }
    }

    // 10d. Occupied seats query
    const occupiedRes = await axios.get(`${base}/api/v1/bookings/occupied`, {
      params: { movieId: 1108427, showtime: testShowtime },
    });
    if (!occupiedRes.data.occupiedSeats.includes('A1') || !occupiedRes.data.occupiedSeats.includes('A2')) {
      throw new Error('Occupied seats query did not include reserved seats');
    }
    console.log(`✔ Occupied seats query returned: [${occupiedRes.data.occupiedSeats.join(', ')}]`);

    // 10e. List user bookings
    const userBookings = await axios.get(`${base}/api/v1/bookings`, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ User bookings retrieved (count: ${userBookings.data.length})`);

    // 10f. Cancel booking
    const cancelRes = await axios.delete(`${base}/api/v1/bookings/${bookingRes.data.id}`, {
      headers: { 'x-guest-id': 'test_architect_user' }
    });
    console.log(`✔ Booking cancelled: ${cancelRes.data.bookingId} (status: ${cancelRes.data.status})`);

    // 11. Two-Tier CacheService LRU eviction test
    const { CacheService } = require('../src/services/cache.service');
    const testCache = new CacheService(2);
    await testCache.set('k1', 'v1');
    await testCache.set('k2', 'v2');
    await testCache.get('k1'); // k1 becomes MRU, k2 is LRU
    await testCache.set('k3', 'v3'); // should evict k2
    const valK2 = await testCache.get('k2');
    const valK1 = await testCache.get('k1');
    const valK3 = await testCache.get('k3');
    if (valK2 !== null || valK1 !== 'v1' || valK3 !== 'v3') {
      throw new Error('CacheService LRU eviction failed');
    }
    const stats = testCache.getStats();
    if (!stats.tier || typeof stats.totalHits !== 'number') {
      throw new Error('CacheService stats schema invalid');
    }
    await testCache.close();
    console.log(`✔ CacheService LRU eviction and stats verified (${stats.tier}, hits: ${stats.totalHits})`);

    // 12. Prometheus Metrics Probe (/metrics)
    const metricsRes = await axios.get(`${base}/metrics`);
    if (metricsRes.status !== 200 || !metricsRes.data.includes('flexwatch_http_requests_total')) {
      throw new Error('Prometheus /metrics endpoint invalid');
    }
    console.log('✔ Prometheus /metrics endpoint active and exporting runtime metrics');

    // 13. OpenAPI / Swagger Documentation Probes (/api/docs & /api/docs.json)
    const docsJsonRes = await axios.get(`${base}/api/docs.json`);
    if (docsJsonRes.status !== 200 || docsJsonRes.data.openapi !== '3.0.0') {
      throw new Error('OpenAPI /api/docs.json specification invalid');
    }
    const docsUiRes = await axios.get(`${base}/api/docs/`);
    if (docsUiRes.status !== 200 || !docsUiRes.data.includes('swagger-ui')) {
      throw new Error('Swagger UI /api/docs HTML not returned');
    }
    console.log('✔ OpenAPI 3.0 specification (/api/docs.json) and Swagger UI (/api/docs) verified');

    console.log('--- All Backend Smoke Tests Passed! ---');
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

}

testAll().catch((e) => {
  console.error('Test Failed:', e.response?.data || e.message);
  process.exit(1);
});
