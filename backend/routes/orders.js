const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CartItem = require('../models/CartItem');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const PLATFORM_FEE_PERCENT = 0.05;

router.use(authenticateToken);

router.post('/place', async (req, res) => {
  try {
    const { address, phone } = req.body;
    const cartItems = await CartItem.find({ userId: req.user.id }).populate('productId', 'name price stock');

    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty.' });

    for (const item of cartItems) {
      if (item.quantity > item.productId.stock) {
        return res.status(400).json({ error: `Insufficient stock for ${item.productId.name}.` });
      }
    }

    const subtotal = cartItems.reduce((s, i) => s + i.productId.price * i.quantity, 0);
    const platformFee = subtotal * PLATFORM_FEE_PERCENT;

    const products = cartItems.map(i => ({
      productId: i.productId._id,
      name: i.productId.name,
      price: i.productId.price,
      quantity: i.quantity
    }));

    const order = await Order.create({
      userId: req.user.id,
      products,
      subtotal,
      platformFee,
      totalAmount: subtotal + platformFee,
      status: 'confirmed',
      address: address || '',
      phone: phone || '',
      trackingUpdates: [{ status: 'confirmed', timestamp: new Date(), note: 'Order placed successfully.' }]
    });

    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
    }

    await CartItem.deleteMany({ userId: req.user.id });

    res.status(201).json({
      id: order._id,
      subtotal: order.subtotal,
      platformFee: order.platformFee,
      totalAmount: order.totalAmount,
      status: order.status,
      message: 'Order placed successfully!'
    });
  } catch (err) {
    console.error('Order place error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.trackingUpdates.push({
      status,
      timestamp: new Date(),
      note: note || `Order ${status.replace(/_/g, ' ')}.`
    });
    order.status = status;
    await order.save();

    res.json({ id: order._id, status: order.status, trackingUpdates: order.trackingUpdates, message: 'Status updated.' });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

module.exports = router;
