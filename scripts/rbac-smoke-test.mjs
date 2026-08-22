const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const users = [
  { role: 'ADMIN', email: process.env.RBAC_ADMIN_EMAIL || 'admin@iul.ac.in', password: process.env.RBAC_ADMIN_PASSWORD || 'Admin@123456' },
  { role: 'SUBADMIN', email: process.env.RBAC_SUBADMIN_EMAIL || 'subadmin@iul.ac.in', password: process.env.RBAC_SUBADMIN_PASSWORD || 'Subadmin@123456' },
  { role: 'FACULTY', email: process.env.RBAC_FACULTY_EMAIL || 'faculty@iul.ac.in', password: process.env.RBAC_FACULTY_PASSWORD || 'Faculty@123456' },
  { role: 'STUDENT', email: process.env.RBAC_STUDENT_EMAIL || 'student@iul.ac.in', password: process.env.RBAC_STUDENT_PASSWORD || 'Student@123456' },
];

const checks = [
  {
    name: 'GET /api/users/stats',
    path: '/users/stats',
    method: 'GET',
    allowed: ['ADMIN'],
  },
  {
    name: 'POST /api/pools',
    path: '/pools',
    method: 'POST',
    body: {},
    allowed: ['ADMIN'],
  },
  {
    name: 'POST /api/temporary-permissions',
    path: '/temporary-permissions',
    method: 'POST',
    body: {},
    allowed: ['ADMIN'],
  },
  {
    name: 'GET /api/pools/fake-pool/reports/summary',
    path: '/pools/00000000-0000-0000-0000-000000000000/reports/summary',
    method: 'GET',
    allowed: ['ADMIN', 'SUBADMIN'],
  },
  {
    name: 'POST /api/pools/fake-pool/projects',
    path: '/pools/00000000-0000-0000-0000-000000000000/projects',
    method: 'POST',
    body: {},
    allowed: ['FACULTY'],
  },
  {
    name: 'POST /api/pools/fake-pool/teams',
    path: '/pools/00000000-0000-0000-0000-000000000000/teams',
    method: 'POST',
    body: {},
    allowed: ['STUDENT'],
  },
  {
    name: 'GET /api/pools/fake-pool/teams',
    path: '/pools/00000000-0000-0000-0000-000000000000/teams',
    method: 'GET',
    allowed: ['ADMIN', 'SUBADMIN', 'FACULTY'],
  },
];

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Some endpoints may return non-JSON responses.
  }

  return { status: response.status, data };
}

async function login(user) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(`${user.role} login failed (${result.status}). Check the demo credentials/database.`);
  }

  const token = result.data?.data?.accessToken;
  const returnedRole = result.data?.data?.user?.role;

  if (!token) throw new Error(`${user.role} login succeeded but no accessToken was returned.`);
  if (returnedRole !== user.role) throw new Error(`${user.role} login returned role ${returnedRole}.`);

  return token;
}

function expectedFor(role, check) {
  return check.allowed.includes(role) ? 'NOT_403' : '403';
}

async function run() {
  console.log(`RBAC smoke test against ${BASE_URL}`);
  console.log('This test checks route-level authorization only. Business validation/resource ownership can legitimately produce 400/404 for authorized roles.\n');

  const tokens = {};
  for (const user of users) {
    try {
      tokens[user.role] = await login(user);
      console.log(`LOGIN ${user.role}: PASS`);
    } catch (error) {
      console.error(`LOGIN ${user.role}: FAIL - ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  let failures = 0;

  for (const check of checks) {
    console.log(`\n${check.name}`);

    for (const user of users) {
      const result = await request(check.path, {
        method: check.method,
        headers: { Authorization: `Bearer ${tokens[user.role]}` },
        ...(check.body !== undefined ? { body: JSON.stringify(check.body) } : {}),
      });

      const expected = expectedFor(user.role, check);
      const passed = expected === '403' ? result.status === 403 : result.status !== 403;

      console.log(`  ${user.role.padEnd(8)} -> ${String(result.status).padEnd(3)} ${passed ? 'PASS' : 'FAIL'} (expected ${expected})`);
      if (!passed) failures += 1;
    }
  }

  console.log(`\n${failures === 0 ? 'RBAC SMOKE TEST PASSED' : `RBAC SMOKE TEST FAILED: ${failures} check(s)`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

run().catch((error) => {
  console.error(`Smoke test aborted: ${error.message}`);
  process.exitCode = 1;
});
