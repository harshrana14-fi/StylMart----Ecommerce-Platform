require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-secret-key-2024';
const userId = '6a29462d13e34882985a8b7a'; // JARVIS

const token = jwt.sign({ id: userId, email: 'jarvis132006@gmail.com', role: 'seller' }, JWT_SECRET, { expiresIn: '7d' });
console.log('Generated JWT Token:', token);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/seller/products',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

console.log('Sending request to /api/seller/products...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response body:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Request failed: ${e.message}`);
  process.exit(1);
});

req.end();
