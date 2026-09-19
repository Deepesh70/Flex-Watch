#!/usr/bin/env node

/**
 * High-Concurrency Performance & Singleflight Benchmark
 *
 * Demonstrates:
 * 1. Singleflight promise collapsing: Under concurrent requests for the same resource,
 *    hundreds of connections collapse into a single upstream fetch.
 * 2. L1 Sub-millisecond caching throughput.
 */

const autocannon = require('autocannon');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5000/api/v1/movies/trending';
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '50', 10);
const DURATION = parseInt(process.env.DURATION || '5', 10);

console.log('====================================================');
console.log('🚀 Flex-Watch API Concurrency & Throughput Benchmark');
console.log('====================================================');
console.log(`Target:      ${TARGET_URL}`);
console.log(`Connections: ${CONNECTIONS} concurrent clients`);
console.log(`Duration:    ${DURATION} seconds`);
console.log('----------------------------------------------------');

const run = () => {
  const instance = autocannon(
    {
      url: TARGET_URL,
      connections: CONNECTIONS,
      duration: DURATION,
      headers: {
        'x-guest-id': 'benchmark-client-uuid',
        'x-benchmark-bypass': 'flexwatch-loadtest-authorized',
      },

    },
    (err, result) => {
      if (err) {
        console.error('❌ Benchmark error:', err);
        process.exit(1);
      }

      console.log('\n----------------- Benchmark Results ----------------');
      console.log(`Total Requests Handled:  ${result['2xx'] + result['non2xx']}`);
      console.log(`Successful 2xx:          ${result['2xx']}`);
      console.log(`Non-2xx / Errors:        ${result['non2xx']}`);
      console.log(`Requests / sec (Avg):    ${result.requests.average.toFixed(1)} req/s`);
      console.log(`Latency Average:         ${result.latency.average.toFixed(2)} ms`);
      console.log(`Latency p50 (Median):    ${result.latency.p50.toFixed(2)} ms`);
      console.log(`Latency p90:             ${result.latency.p90.toFixed(2)} ms`);
      console.log(`Latency p99:             ${result.latency.p99.toFixed(2)} ms`);
      console.log(`Throughput:              ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
      console.log('====================================================');
      console.log('✔ Benchmark completed successfully!');
    }
  );

  autocannon.track(instance, { renderProgressBar: true });
};

run();
