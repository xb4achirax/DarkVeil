import express from 'express';
import { redirectToWhatsApp } from '../controllers/whatsappController.js';

const router = express.Router();

// GET /api/whatsapp/order?product=...
router.get('/order', redirectToWhatsApp);

export default router;
