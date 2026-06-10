const express = require('express');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.id }).populate('productId', 'name price image stock');
    const mapped = items.map(i => ({
      id: i._id,
      productId: i.productId._id,
      quantity: i.quantity,
      name: i.productId.name,
      price: i.productId.price,
      image: i.productId.image,
      stock: i.productId.stock
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required.' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    let cartItem = await CartItem.findOne({ userId: req.user.id, productId });
    if (cartItem) {
      cartItem.quantity = Math.min(cartItem.quantity + quantity, product.stock);
      await cartItem.save();
    } else {
      const qty = Math.min(quantity, product.stock);
      await CartItem.create({ userId: req.user.id, productId, quantity: qty });
    }
    const items = await CartItem.find({ userId: req.user.id }).populate('productId', 'name price image stock');
    const mapped = items.map(i => ({
      id: i._id, productId: i.productId._id, quantity: i.quantity,
      name: i.productId.name, price: i.productId.price, image: i.productId.image, stock: i.productId.stock
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ error: 'Failed to add to cart.' });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity < 0) return res.status(400).json({ error: 'Invalid request.' });
    if (quantity === 0) {
      await CartItem.deleteOne({ userId: req.user.id, productId });
    } else {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      const qty = Math.min(quantity, product.stock);
      await CartItem.updateOne({ userId: req.user.id, productId }, { quantity: qty });
    }
    const items = await CartItem.find({ userId: req.user.id }).populate('productId', 'name price image stock');
    const mapped = items.map(i => ({
      id: i._id, productId: i.productId._id, quantity: i.quantity,
      name: i.productId.name, price: i.productId.price, image: i.productId.image, stock: i.productId.stock
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

router.delete('/remove/:productId', async (req, res) => {
  try {
    await CartItem.deleteOne({ userId: req.user.id, productId: req.params.productId });
    const items = await CartItem.find({ userId: req.user.id }).populate('productId', 'name price image stock');
    const mapped = items.map(i => ({
      id: i._id, productId: i.productId._id, quantity: i.quantity,
      name: i.productId.name, price: i.productId.price, image: i.productId.image, stock: i.productId.stock
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from cart.' });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await CartItem.deleteMany({ userId: req.user.id });
    res.json({ message: 'Cart cleared.' });
  } catch {
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

module.exports = router;
