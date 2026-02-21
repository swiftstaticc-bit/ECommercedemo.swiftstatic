'use strict';

/**
 * POST /api/order
 * Accepts a cart (array of items), builds a formatted WhatsApp message,
 * and returns the wa.me deep-link to the client.
 */
const placeOrder = (req, res) => {
  const { cartItems, total, name, phone, address } = req.body;

  // ── Field validation ────────────────────────────────────────────────────────
  const missing = [];
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0)
    missing.push('cartItems');
  if (total === undefined || total === null) missing.push('total');
  if (!name)    missing.push('name');
  if (!phone)   missing.push('phone');
  if (!address) missing.push('address');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  // ── Build WhatsApp message ──────────────────────────────────────────────────
  const itemLines = cartItems
    .map(item => `  • ${item.name} × ${item.qty}  =  ₹${item.price * item.qty}`)
    .join('\n');

  const message =
    `🛒 *New Order Received*\n\n` +
    `*Items Ordered:*\n${itemLines}\n\n` +
    `*Total Amount: ₹${total}*\n\n` +
    `*Customer Name:* ${name}\n` +
    `*Phone:* ${phone}\n` +
    `*Address:* ${address}`;

  const ownerPhone = process.env.OWNER_PHONE || '919398302375';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodedMessage}`;

  return res.status(200).json({ success: true, whatsappUrl });
};

module.exports = { placeOrder };
