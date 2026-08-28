const jwt = require('jsonwebtoken');

async function testRefresh() {
  const payload = { userId: '2f2c4a78-4257-4f9e-ad0b-68c4b2129567', email: 'saaviksolutions@gmail.com', role: 'USER' };
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || 'super-secret-key-for-dev', { expiresIn: '7d' });

  const res = await fetch('http://localhost:4002/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Data:', data);
}

testRefresh();
