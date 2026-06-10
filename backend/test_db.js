require('dotenv').config();
const { connectDB } = require('./database');
const User = require('./models/User');
const Product = require('./models/Product');

async function test() {
  console.log('Connecting to DB...');
  await connectDB();
  console.log('Connected!');
  
  const users = await User.find({});
  console.log('Users found:', users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
  
  const products = await Product.find({});
  console.log('Products found:', products.length);
  if (products.length > 0) {
    console.log('Sample product:', products[0]);
  }
  process.exit(0);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
