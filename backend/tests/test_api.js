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

    // 10. CacheService LRU eviction test
    const { CacheService } = require('../src/services/cache.service');
    const testCache = new CacheService(2);
    testCache.set('k1', 'v1');
    testCache.set('k2', 'v2');
    testCache.get('k1'); // k1 becomes MRU, k2 is LRU
    testCache.set('k3', 'v3'); // should evict k2
    if (testCache.get('k2') !== null || testCache.get('k1') !== 'v1' || testCache.get('k3') !== 'v3') {
      throw new Error('CacheService LRU eviction failed');
    }
    console.log('✔ CacheService LRU eviction correctly maintained entry limit and recency');

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
