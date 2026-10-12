import express from 'express';
import productsCtrl from '../controllers/productsCtrl.js';

const router = express.Router();

router.get('/', (req, res) => {
    productsCtrl.GetAll(req, res);
})

export default router;