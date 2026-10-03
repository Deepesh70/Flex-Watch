const axios = require('axios');

async function testAll() {
  console.log('--- Testing Flex-Watch Backend API ---');
  let base = 'http://localhost:5000';
  let serverInstance = null;

  // Check if server is already running on port 5000, otherwise start on ephemeral port
  try {
    await axios.get(`${base}/health/live`, { timeout: 800 });
  } catch {
    const { app, attachWebSockets } = require('../src/server');
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        attachWebSockets(serverInstance);
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

      // 3b. Slug-based movie resolution (resolves "moana-2" or "moana" to movie object)
      const slugMovie = await axios.get(`${base}/api/v1/movies/moana-2`);
      if (!slugMovie.data || !slugMovie.data.id) {
        throw new Error('Slug-based movie resolution failed');
      }
      console.log(`✔ Movie Slug Resolution ("moana-2"): ${slugMovie.data.title} (ID: ${slugMovie.data.id})`);
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

    // 10c2. Concurrent Race Condition Test: Two requests fire simultaneously for identical seat X9
    const concurrentSeat = 'X9';
    const raceShowtime = new Date(Date.now() + 172800000).toISOString();
    const req1 = axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `race_1_${Date.now()}_${Math.random()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: raceShowtime,
      seats: [concurrentSeat],
      totalAmount: 15.0,
    }, {
      headers: { 'x-guest-id': 'race_user_1' },
      validateStatus: () => true, // Don't throw so we can inspect status codes
    });

    const req2 = axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `race_2_${Date.now()}_${Math.random()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: raceShowtime,
      seats: [concurrentSeat],
      totalAmount: 15.0,
    }, {
      headers: { 'x-guest-id': 'race_user_2' },
      validateStatus: () => true,
    });

    const [resA, resB] = await Promise.all([req1, req2]);
    const statuses = [resA.status, resB.status].sort();
    if (statuses[0] !== 201 || statuses[1] !== 409) {
      throw new Error(`Race condition test failed: expected [201, 409] but got [${resA.status}, ${resB.status}]`);
    }
    console.log('✔ Concurrent seat booking race condition handled atomically: exactly one 201 and one 409');

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

    // 10g. Real-Time Seat Holds & WebSocket Gateway Test
    const WebSocket = require('ws');
    const wsUrl = base.replace(/^http/, 'ws') + '/ws/seats';
    const testWs = new WebSocket(wsUrl);

    const wsReceivedEvents = [];
    await new Promise((resolve, reject) => {
      testWs.on('open', () => {
        testWs.send(JSON.stringify({
          action: 'subscribe',
          movieId: 1108427,
          showtime: testShowtime,
        }));
        resolve();
      });
      testWs.on('error', reject);
    });

    testWs.on('message', (raw) => {
      try {
        wsReceivedEvents.push(JSON.parse(raw.toString()));
      } catch {}
    });

    // 1. Acquire seat hold on H1
    const holdRes = await axios.post(`${base}/api/v1/bookings/hold`, {
      movieId: 1108427,
      showtime: testShowtime,
      seats: ['H1'],
    }, {
      headers: { 'x-guest-id': 'hold_user_1' },
    });
    if (!holdRes.data.success || !holdRes.data.heldSeats.includes('H1')) {
      throw new Error('Seat hold acquisition failed');
    }

    // 2. Conflict test: Another user attempts to hold H1
    try {
      await axios.post(`${base}/api/v1/bookings/hold`, {
        movieId: 1108427,
        showtime: testShowtime,
        seats: ['H1'],
      }, {
        headers: { 'x-guest-id': 'hold_user_2' },
      });
      throw new Error('Expected 409 conflict when holding already-held seat');
    } catch (err) {
      if (err.response?.status !== 409) throw err;
    }

    // Wait 100ms for WS event delivery
    await new Promise((r) => setTimeout(r, 100));
    const heldEvent = wsReceivedEvents.find((e) => e.type === 'SEATS_HELD' && e.seats.includes('H1'));
    if (!heldEvent) {
      throw new Error('WebSocket SEATS_HELD event was not broadcast');
    }

    // 3. Release seat hold on H1
    await axios.post(`${base}/api/v1/bookings/release`, {
      movieId: 1108427,
      showtime: testShowtime,
      seats: ['H1'],
    }, {
      headers: { 'x-guest-id': 'hold_user_1' },
    });

    await new Promise((r) => setTimeout(r, 100));
    const releaseEvent = wsReceivedEvents.find((e) => e.type === 'SEATS_RELEASED' && e.seats.includes('H1'));
    if (!releaseEvent) {
      throw new Error('WebSocket SEATS_RELEASED event was not broadcast');
    }

    testWs.close();
    console.log('✔ Real-Time Seat Holds & WebSocket Gateway verified: SEATS_HELD & SEATS_RELEASED broadcast');

    // 10f. Theater, Screen & Show Normalization Verification
    const venuesRes = await axios.get(`${base}/api/v1/movies/1108427/shows?title=Moana`);
    if (!Array.isArray(venuesRes.data) || venuesRes.data.length === 0) {
      throw new Error('Venues and shows seeding failed');
    }
    const sampleTheater = venuesRes.data[0];
    const sampleScreen = sampleTheater.screens[0];
    const sampleShow = sampleScreen.shows[0];
    console.log(`✔ Venues seeded & queried: ${venuesRes.data.length} theaters, Sample: ${sampleTheater.name} (${sampleScreen.format})`);

    const occupancyRes = await axios.get(`${base}/api/v1/bookings/shows/${sampleShow.id}/occupancy`);
    if (!occupancyRes.data.theaterName || !occupancyRes.data.format) {
      throw new Error('Show occupancy endpoint returned invalid schema');
    }
    console.log(`✔ Show occupancy verified: ${occupancyRes.data.theaterName} • ${occupancyRes.data.screenName} • ${occupancyRes.data.format}`);

    // Dynamically pick unoccupied seats for repeatable test isolation
    const allCandidateSeats = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'D3', 'D4', 'E1', 'E2', 'E3', 'E4', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3', 'G4'];
    const occupiedSet = new Set(occupancyRes.data.occupiedSeats || []);
    const availableSeats = allCandidateSeats.filter((s) => !occupiedSet.has(s));
    const testSeats1 = [availableSeats[0], availableSeats[1]];
    const testSeats2 = [availableSeats[2], availableSeats[3]];

    // Create booking referencing concrete showId
    const showBooking = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `idemp_show_${Date.now()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: sampleShow.startTime,
      showId: sampleShow.id,
      seats: testSeats1,
      totalAmount: sampleShow.basePrice * 2,
    }, {
      headers: { 'x-guest-id': 'test_architect_user' },
    });
    if (!showBooking.data.show || showBooking.data.show.screen?.theater?.name !== sampleTheater.name) {
      throw new Error('Show-linked booking response missing populated theater/screen details');
    }
    console.log(`✔ Booking linked to concrete Show: ${showBooking.data.show.screen.theater.name} (${showBooking.data.show.screen.format})`);

    // 10g. Stripe Checkout & Payment Webhook State Machine
    const paymentBooking = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `idemp_pay_${Date.now()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: sampleShow.startTime,
      showId: sampleShow.id,
      seats: testSeats2,
      totalAmount: sampleShow.basePrice * 2,
      status: 'PENDING_PAYMENT',
    }, {
      headers: { 'x-guest-id': 'test_architect_user' },
    });
    if (paymentBooking.data.status !== 'PENDING_PAYMENT') {
      throw new Error(`Expected PENDING_PAYMENT status, got ${paymentBooking.data.status}`);
    }
    console.log(`✔ Booking created in PENDING_PAYMENT state: ${paymentBooking.data.id}`);

    // Create checkout session
    const sessionRes = await axios.post(`${base}/api/v1/payments/create-checkout-session`, {
      bookingId: paymentBooking.data.id,
      successUrl: 'http://localhost:3000/booking/success',
      cancelUrl: 'http://localhost:3000/booking/cancel',
    }, {
      headers: { 'x-guest-id': 'test_architect_user' },
    });
    if (!sessionRes.data.checkoutUrl || !sessionRes.data.sessionId) {
      throw new Error('Checkout session generation failed');
    }
    console.log(`✔ Checkout Session generated: ${sessionRes.data.sessionId} (isMock: ${sessionRes.data.isMock})`);

    // Confirm session / Webhook simulation
    const confirmRes = await axios.post(`${base}/api/v1/payments/confirm-session`, {
      bookingId: paymentBooking.data.id,
      sessionId: sessionRes.data.sessionId,
    }, {
      headers: { 'x-guest-id': 'test_architect_user' },
    });
    if (confirmRes.data.booking.status !== 'CONFIRMED') {
      throw new Error(`Expected CONFIRMED status after payment, got ${confirmRes.data.booking.status}`);
    }
    console.log(`✔ Payment confirmed & Booking status transitioned to CONFIRMED: ${confirmRes.data.booking.id}`);

    // Test webhook handler
    const webhookRes = await axios.post(`${base}/api/v1/payments/webhook`, {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionRes.data.sessionId,
          payment_intent: 'pi_test_12345',
          metadata: { bookingId: paymentBooking.data.id },
        },
      },
    }, {
      headers: { 'content-type': 'application/json' },
    });
    if (!webhookRes.data.received) {
      throw new Error('Webhook processing failed');
    }
    console.log('✔ Stripe webhook simulation processed successfully');

    // 10h. Automated Abandoned Seat & Hold Sweeper Verification
    const { reaperService } = require('../src/services/reaper.service');
    const abandonSeats = [availableSeats[4], availableSeats[5]];
    const abandonedBooking = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `idemp_abandon_${Date.now()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: sampleShow.startTime,
      showId: sampleShow.id,
      seats: abandonSeats,
      totalAmount: sampleShow.basePrice * 2,
      status: 'PENDING_PAYMENT',
    }, {
      headers: { 'x-guest-id': 'abandon_user' },
    });
    console.log(`✔ Created pending booking to test sweeper: ${abandonedBooking.data.id} for seats [${abandonSeats.join(', ')}]`);

    // Run reaper with 0-second threshold to sweep immediately
    const reapResult = await reaperService.reapExpiredBookings(0);
    if (reapResult.reaped < 1) {
      throw new Error('Reaper failed to reap abandoned booking');
    }

    // Verify seats are free again by booking them under another user
    const reclaimedBooking = await axios.post(`${base}/api/v1/bookings`, {
      idempotencyKey: `idemp_reclaim_${Date.now()}`,
      movieId: 1108427,
      movieTitle: 'Moana',
      showtime: sampleShow.startTime,
      showId: sampleShow.id,
      seats: abandonSeats,
      totalAmount: sampleShow.basePrice * 2,
      status: 'CONFIRMED',
    }, {
      headers: { 'x-guest-id': 'reclaim_user' },
    });
    if (!reclaimedBooking.data.id) {
      throw new Error('Failed to reclaim seats freed by sweeper');
    }
    console.log(`✔ Sweeper successfully reaped abandoned booking & restored seats [${abandonSeats.join(', ')}] to inventory`);

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
  console.error('Test Failed:', e.stack || e.response?.data || e.message);
  process.exit(1);
});

