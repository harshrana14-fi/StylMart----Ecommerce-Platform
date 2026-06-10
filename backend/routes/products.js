const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const cats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const names = { men: "Men's Collection", women: "Women's Collection", accessories: 'Accessories', electronics: 'Electronics', shoes: 'Shoes', sports: 'Sports & Fitness' };
    res.json(cats.map(c => ({ category: c._id, count: c.count, displayName: names[c._id] || c._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

module.exports = router;
