const express = require('express');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your products.' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, images, category, stock } = req.body;
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Name, description, price, and category are required.' });
    }
    const productImages = images && images.length > 0 ? images : ['https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=600'];
    const product = await Product.create({
      sellerId: req.user.id,
      name,
      description,
      price: parseFloat(price),
      image: productImages[0],
      images: productImages,
      category,
      stock: parseInt(stock) || 0
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('Seller product create error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const existing = await Product.findOne({ _id: req.params.id, sellerId: req.user.id });
    if (!existing) return res.status(404).json({ error: 'Product not found or not yours.' });

    const { name, description, price, images, category, stock } = req.body;
    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (price !== undefined) existing.price = parseFloat(price);
    if (images !== undefined) {
      existing.images = images;
      existing.image = images[0] || '';
    }
    if (category !== undefined) existing.category = category;
    if (stock !== undefined) existing.stock = parseInt(stock);
    await existing.save();

    res.json(existing);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const existing = await Product.findOne({ _id: req.params.id, sellerId: req.user.id });
    if (!existing) return res.status(404).json({ error: 'Product not found or not yours.' });
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product deleted.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
