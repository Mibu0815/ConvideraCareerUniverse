#!/usr/bin/env npx tsx
/**
 * Deployment Test Suite for Career Universe
 *
 * Tests all routes, links, API endpoints, auth flows, and redirects
 * against a live deployment (local or production).
 *
 * Usage:
 *   npx tsx scripts/test-deployment.ts                          # tests localhost:3000
 *   npx tsx scripts/test-deployment.ts https://your-app.vercel.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// ─── Types ───────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  details: string;
  duration: number;
}

interface TestGroup {
  name: string;
  results: TestResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

async function fetchWithTiming(
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response | null; duration: number; error: string | null }> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      ...options,
    });
    return { response, duration: Date.now() - start, error: null };
  } catch (err) {
    return {
      response: null,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function url(path: string): string {
  return `${BASE_URL}${path}`;
}

function getRedirectLocation(response: Response): string | null {
  const location = response.headers.get('location');
  if (!location) return null;
  // Normalize: strip base URL if present
  try {
    const u = new URL(location, BASE_URL);
    return u.pathname + u.search;
  } catch {
    return location;
  }
}

// ─── Test Functions ──────────────────────────────────────────────────

async function testPublicPages(): Promise<TestGroup> {
  const results: TestResult[] = [];

  const publicPages = [
    { path: '/auth/login', name: 'Login Page' },
    { path: '/auth/register', name: 'Register Page' },
  ];

  for (const page of publicPages) {
    const { response, duration, error } = await fetchWithTiming(url(page.path));
    if (error) {
      results.push({ name: page.name, status: 'fail', details: `Network error: ${error}`, duration });
    } else if (!response) {
      results.push({ name: page.name, status: 'fail', details: 'No response', duration });
    } else if (response.status === 200) {
      const html = await response.text();
      const hasContent = html.includes('</html>') && html.length > 500;
      results.push({
        name: page.name,
        status: hasContent ? 'pass' : 'warn',
        details: `HTTP ${response.status}, ${html.length} bytes${!hasContent ? ' (suspiciously small)' : ''}`,
        duration,
      });
    } else {
      results.push({
        name: page.name,
        status: 'fail',
        details: `Expected 200, got HTTP ${response.status}`,
        duration,
      });
    }
  }

  return { name: 'Public Pages (should return 200)', results };
}

async function testAuthGuard(): Promise<TestGroup> {
  const results: TestResult[] = [];

  const protectedPages = [
    { path: '/', name: 'Dashboard' },
    { path: '/my-career', name: 'My Career (Onboarding)' },
    { path: '/my-career/compare', name: 'Role Compare' },
    { path: '/learning-journey', name: 'Learning Journey' },
    { path: '/profile', name: 'Profile' },
    { path: '/admin/dashboard', name: 'Admin Dashboard' },
  ];

  for (const page of protectedPages) {
    const { response, duration, error } = await fetchWithTiming(url(page.path));
    if (error) {
      results.push({ name: page.name, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }
    if (!response) {
      results.push({ name: page.name, status: 'fail', details: 'No response', duration });
      continue;
    }

    const status = response.status;
    const location = getRedirectLocation(response);

    if (status >= 300 && status < 400 && location?.startsWith('/auth/login')) {
      results.push({
        name: page.name,
        status: 'pass',
        details: `Redirects to ${location} (HTTP ${status})`,
        duration,
      });
    } else if (status === 200) {
      // Could be that the page renders login inline
      const html = await response.text();
      if (html.includes('/auth/login') || html.includes('Anmelden')) {
        results.push({
          name: page.name,
          status: 'warn',
          details: `HTTP 200 but contains login reference (soft redirect?)`,
          duration,
        });
      } else {
        results.push({
          name: page.name,
          status: 'fail',
          details: `HTTP 200 without auth — page is unprotected!`,
          duration,
        });
      }
    } else {
      results.push({
        name: page.name,
        status: 'fail',
        details: `Unexpected HTTP ${status}, location: ${location || 'none'}`,
        duration,
      });
    }
  }

  return { name: 'Auth Guard (unauthenticated → redirect to /auth/login)', results };
}

async function testAPIEndpoints(): Promise<TestGroup> {
  const results: TestResult[] = [];

  // GET endpoints
  const getEndpoints = [
    { path: '/api/skills', name: 'GET /api/skills' },
  ];

  for (const ep of getEndpoints) {
    const { response, duration, error } = await fetchWithTiming(url(ep.path));
    if (error) {
      results.push({ name: ep.name, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }
    if (!response) {
      results.push({ name: ep.name, status: 'fail', details: 'No response', duration });
      continue;
    }

    const status = response.status;
    if (status === 200) {
      const contentType = response.headers.get('content-type') || '';
      let bodyPreview = '';
      try {
        const text = await response.text();
        bodyPreview = text.substring(0, 100);
      } catch { /* ignore */ }
      results.push({
        name: ep.name,
        status: contentType.includes('json') ? 'pass' : 'warn',
        details: `HTTP ${status}, content-type: ${contentType.split(';')[0]}`,
        duration,
      });
    } else {
      results.push({
        name: ep.name,
        status: status === 401 || status === 403 ? 'warn' : 'fail',
        details: `HTTP ${status}${status === 401 ? ' (auth required — expected)' : ''}`,
        duration,
      });
    }
  }

  // POST endpoints (without body — expect 400 or structured error, not 404/500)
  const postEndpoints = [
    { path: '/api/career/analyze', name: 'POST /api/career/analyze' },
    { path: '/api/career/mentor', name: 'POST /api/career/mentor' },
  ];

  for (const ep of postEndpoints) {
    const { response, duration, error } = await fetchWithTiming(url(ep.path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (error) {
      results.push({ name: ep.name, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }
    if (!response) {
      results.push({ name: ep.name, status: 'fail', details: 'No response', duration });
      continue;
    }

    const status = response.status;
    if (status === 404) {
      results.push({ name: ep.name, status: 'fail', details: 'HTTP 404 — route not found!', duration });
    } else if (status === 500) {
      let errorMsg = '';
      try { errorMsg = (await response.json()).error || ''; } catch { /* ignore */ }
      results.push({
        name: ep.name,
        status: 'fail',
        details: `HTTP 500 — server error: ${errorMsg}`,
        duration,
      });
    } else if (status === 400 || status === 401 || status === 422) {
      results.push({
        name: ep.name,
        status: 'pass',
        details: `HTTP ${status} (expected — missing/invalid params)`,
        duration,
      });
    } else {
      results.push({
        name: ep.name,
        status: 'warn',
        details: `HTTP ${status}`,
        duration,
      });
    }
  }

  // Auth callback (GET without code param — should redirect to login with error)
  const { response: cbResp, duration: cbDur, error: cbErr } = await fetchWithTiming(url('/auth/callback'));
  if (cbErr) {
    results.push({ name: 'GET /auth/callback (no code)', status: 'fail', details: `Network error: ${cbErr}`, duration: cbDur });
  } else if (cbResp) {
    const location = getRedirectLocation(cbResp);
    if (cbResp.status >= 300 && cbResp.status < 400 && location?.includes('/auth/login')) {
      results.push({
        name: 'GET /auth/callback (no code)',
        status: 'pass',
        details: `Redirects to ${location} (HTTP ${cbResp.status})`,
        duration: cbDur,
      });
    } else {
      results.push({
        name: 'GET /auth/callback (no code)',
        status: 'warn',
        details: `HTTP ${cbResp.status}, location: ${location || 'none'}`,
        duration: cbDur,
      });
    }
  }

  return { name: 'API Endpoints', results };
}

async function test404Pages(): Promise<TestGroup> {
  const results: TestResult[] = [];

  const nonExistentPaths = [
    '/does-not-exist',
    '/auth/nonexistent',
    '/api/nonexistent',
    '/my-career/nonexistent',
  ];

  for (const path of nonExistentPaths) {
    const { response, duration, error } = await fetchWithTiming(url(path));
    if (error) {
      results.push({ name: `GET ${path}`, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }
    if (!response) {
      results.push({ name: `GET ${path}`, status: 'fail', details: 'No response', duration });
      continue;
    }

    const status = response.status;
    const location = getRedirectLocation(response);

    // For protected routes, redirect to login is fine
    if (status >= 300 && status < 400 && location?.startsWith('/auth/login')) {
      results.push({
        name: `GET ${path}`,
        status: 'pass',
        details: `Auth redirect (HTTP ${status}) — handled by middleware`,
        duration,
      });
    } else if (status === 404) {
      results.push({
        name: `GET ${path}`,
        status: 'pass',
        details: 'HTTP 404 — correct',
        duration,
      });
    } else if (status === 200) {
      results.push({
        name: `GET ${path}`,
        status: 'warn',
        details: 'HTTP 200 — should be 404 (catch-all rendering?)',
        duration,
      });
    } else {
      results.push({
        name: `GET ${path}`,
        status: 'warn',
        details: `HTTP ${status}`,
        duration,
      });
    }
  }

  return { name: '404 Handling (non-existent routes)', results };
}

async function testStaticAssets(): Promise<TestGroup> {
  const results: TestResult[] = [];

  const assets = [
    { path: '/favicon.ico', name: 'Favicon' },
    { path: '/_next/static', name: 'Next.js Static Dir' },
  ];

  for (const asset of assets) {
    const { response, duration, error } = await fetchWithTiming(url(asset.path));
    if (error) {
      results.push({ name: asset.name, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }
    if (!response) {
      results.push({ name: asset.name, status: 'fail', details: 'No response', duration });
      continue;
    }

    const status = response.status;
    if (status === 200) {
      results.push({ name: asset.name, status: 'pass', details: `HTTP 200`, duration });
    } else if (status === 404 || status === 405) {
      results.push({
        name: asset.name,
        status: asset.path === '/_next/static' ? 'warn' : 'fail',
        details: `HTTP ${status}`,
        duration,
      });
    } else {
      results.push({ name: asset.name, status: 'warn', details: `HTTP ${status}`, duration });
    }
  }

  return { name: 'Static Assets', results };
}

async function testLinkIntegrity(): Promise<TestGroup> {
  const results: TestResult[] = [];

  // Fetch login and register pages and extract all internal links
  const pagesToScan = ['/auth/login', '/auth/register'];

  for (const pagePath of pagesToScan) {
    const { response, error } = await fetchWithTiming(url(pagePath));
    if (error || !response || response.status !== 200) continue;

    const html = await response.text();

    // Extract href values from the HTML
    const hrefRegex = /href="(\/[^"]*?)"/g;
    const links = new Set<string>();
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      // Skip Next.js internal, static assets, and anchors
      if (href.startsWith('/_next') || href.includes('.') && !href.includes('/auth/')) continue;
      links.add(href);
    }

    for (const link of links) {
      const { response: linkResp, duration, error: linkErr } = await fetchWithTiming(url(link));
      if (linkErr) {
        results.push({
          name: `${pagePath} → ${link}`,
          status: 'fail',
          details: `Broken link: ${linkErr}`,
          duration,
        });
        continue;
      }
      if (!linkResp) continue;

      const status = linkResp.status;
      if (status === 200 || (status >= 300 && status < 400)) {
        results.push({
          name: `${pagePath} → ${link}`,
          status: 'pass',
          details: `HTTP ${status}${status >= 300 ? ` → ${getRedirectLocation(linkResp)}` : ''}`,
          duration,
        });
      } else if (status === 404) {
        results.push({
          name: `${pagePath} → ${link}`,
          status: 'fail',
          details: `BROKEN LINK — HTTP 404`,
          duration,
        });
      } else {
        results.push({
          name: `${pagePath} → ${link}`,
          status: 'warn',
          details: `HTTP ${status}`,
          duration,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      name: 'Link scan',
      status: 'warn',
      details: 'No internal links found in public pages (links may be client-rendered)',
      duration: 0,
    });
  }

  return { name: 'Link Integrity (extracted from HTML)', results };
}

async function testNavigationLinks(): Promise<TestGroup> {
  const results: TestResult[] = [];

  // All links referenced in Navigation.tsx, login, register, onboarding etc.
  const knownLinks = [
    { from: 'Navigation', to: '/', name: 'Dashboard' },
    { from: 'Navigation', to: '/learning-journey', name: 'Meine Journey' },
    { from: 'Navigation', to: '/my-career', name: 'Explore Roles' },
    { from: 'Navigation', to: '/profile', name: 'Mein Profil' },
    { from: 'Login', to: '/auth/register', name: 'Registrieren' },
    { from: 'Register', to: '/auth/login', name: 'Anmelden' },
    { from: 'Onboarding', to: '/my-career/compare', name: 'Weiter zum Vergleich' },
    { from: 'Admin', to: '/admin/dashboard', name: 'Admin Dashboard' },
  ];

  for (const link of knownLinks) {
    const { response, duration, error } = await fetchWithTiming(url(link.to));
    if (error) {
      results.push({
        name: `[${link.from}] ${link.name} → ${link.to}`,
        status: 'fail',
        details: `Network error: ${error}`,
        duration,
      });
      continue;
    }
    if (!response) continue;

    const status = response.status;
    const location = getRedirectLocation(response);

    if (status === 404) {
      results.push({
        name: `[${link.from}] ${link.name} → ${link.to}`,
        status: 'fail',
        details: `DEAD LINK — HTTP 404`,
        duration,
      });
    } else if (status === 500) {
      results.push({
        name: `[${link.from}] ${link.name} → ${link.to}`,
        status: 'fail',
        details: `SERVER ERROR — HTTP 500`,
        duration,
      });
    } else {
      results.push({
        name: `[${link.from}] ${link.name} → ${link.to}`,
        status: 'pass',
        details: `HTTP ${status}${location ? ` → ${location}` : ''}`,
        duration,
      });
    }
  }

  return { name: 'Navigation Links (all known router.push / Link targets)', results };
}

async function testResponseTimes(): Promise<TestGroup> {
  const results: TestResult[] = [];
  const SLOW_THRESHOLD = 3000; // 3s
  const VERY_SLOW_THRESHOLD = 8000; // 8s

  const endpoints = [
    '/auth/login',
    '/auth/register',
    '/api/skills',
    '/',
  ];

  for (const path of endpoints) {
    const { response, duration, error } = await fetchWithTiming(url(path));
    if (error) {
      results.push({ name: `GET ${path}`, status: 'fail', details: `Network error: ${error}`, duration });
      continue;
    }

    if (duration > VERY_SLOW_THRESHOLD) {
      results.push({
        name: `GET ${path}`,
        status: 'fail',
        details: `${duration}ms — very slow (>${VERY_SLOW_THRESHOLD}ms)`,
        duration,
      });
    } else if (duration > SLOW_THRESHOLD) {
      results.push({
        name: `GET ${path}`,
        status: 'warn',
        details: `${duration}ms — slow (>${SLOW_THRESHOLD}ms)`,
        duration,
      });
    } else {
      results.push({
        name: `GET ${path}`,
        status: 'pass',
        details: `${duration}ms`,
        duration,
      });
    }
  }

  return { name: 'Response Times', results };
}

async function testSecurityHeaders(): Promise<TestGroup> {
  const results: TestResult[] = [];

  const { response, duration, error } = await fetchWithTiming(url('/auth/login'));
  if (error || !response) {
    results.push({ name: 'Fetch headers', status: 'fail', details: error || 'No response', duration });
    return { name: 'Security Headers', results };
  }

  const checks = [
    { header: 'x-frame-options', name: 'X-Frame-Options', recommended: true },
    { header: 'x-content-type-options', name: 'X-Content-Type-Options', recommended: true },
    { header: 'content-security-policy', name: 'Content-Security-Policy', recommended: true },
    { header: 'strict-transport-security', name: 'Strict-Transport-Security (HSTS)', recommended: BASE_URL.startsWith('https') },
    { header: 'referrer-policy', name: 'Referrer-Policy', recommended: true },
  ];

  for (const check of checks) {
    const value = response.headers.get(check.header);
    if (value) {
      results.push({
        name: check.name,
        status: 'pass',
        details: value.length > 80 ? value.substring(0, 77) + '...' : value,
        duration: 0,
      });
    } else {
      results.push({
        name: check.name,
        status: check.recommended ? 'warn' : 'pass',
        details: 'Missing',
        duration: 0,
      });
    }
  }

  return { name: 'Security Headers', results };
}

// ─── Reporter ────────────────────────────────────────────────────────

function printResults(groups: TestGroup[]) {
  const pass = '\x1b[32m✓\x1b[0m';
  const fail = '\x1b[31m✗\x1b[0m';
  const warn = '\x1b[33m⚠\x1b[0m';

  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  console.log('\n' + '═'.repeat(72));
  console.log(`  Career Universe — Deployment Test Report`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log('═'.repeat(72));

  for (const group of groups) {
    const groupPass = group.results.filter(r => r.status === 'pass').length;
    const groupFail = group.results.filter(r => r.status === 'fail').length;
    const groupWarn = group.results.filter(r => r.status === 'warn').length;

    console.log(`\n┌─ ${group.name} (${groupPass}/${group.results.length} passed)`);
    console.log('│');

    for (const result of group.results) {
      const icon = result.status === 'pass' ? pass : result.status === 'fail' ? fail : warn;
      const timeStr = result.duration > 0 ? ` [${result.duration}ms]` : '';
      console.log(`│  ${icon} ${result.name}${timeStr}`);
      console.log(`│    ${result.details}`);
    }

    console.log('└' + '─'.repeat(71));

    totalPass += groupPass;
    totalFail += groupFail;
    totalWarn += groupWarn;
  }

  const total = totalPass + totalFail + totalWarn;
  console.log('\n' + '═'.repeat(72));
  console.log(`  SUMMARY: ${totalPass}/${total} passed, ${totalFail} failed, ${totalWarn} warnings`);

  if (totalFail > 0) {
    console.log(`\n  \x1b[31mFAILURES:\x1b[0m`);
    for (const group of groups) {
      for (const result of group.results) {
        if (result.status === 'fail') {
          console.log(`    ✗ [${group.name}] ${result.name}: ${result.details}`);
        }
      }
    }
  }

  if (totalWarn > 0) {
    console.log(`\n  \x1b[33mWARNINGS:\x1b[0m`);
    for (const group of groups) {
      for (const result of group.results) {
        if (result.status === 'warn') {
          console.log(`    ⚠ [${group.name}] ${result.name}: ${result.details}`);
        }
      }
    }
  }

  console.log('═'.repeat(72) + '\n');

  return totalFail;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nTesting deployment at: ${BASE_URL}\n`);

  // Quick connectivity check
  const { error } = await fetchWithTiming(BASE_URL);
  if (error) {
    console.error(`\x1b[31mCannot reach ${BASE_URL}: ${error}\x1b[0m`);
    console.error('Make sure the server is running.');
    process.exit(1);
  }

  const groups = await Promise.all([
    testPublicPages(),
    testAuthGuard(),
    testAPIEndpoints(),
    test404Pages(),
    testStaticAssets(),
    testNavigationLinks(),
    testLinkIntegrity(),
    testResponseTimes(),
    testSecurityHeaders(),
  ]);

  const failures = printResults(groups);
  process.exit(failures > 0 ? 1 : 0);
}

main();
