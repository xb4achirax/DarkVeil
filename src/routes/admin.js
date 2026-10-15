import express from 'express';
import adminCtrl from '../controllers/adminCtrl.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const adminRouter = express.Router();

adminRouter.use(requireAdmin);
adminRouter.get('/', adminCtrl.renderPanel);
adminRouter.get('/products/:id', adminCtrl.getProduct);
adminRouter.post('/products', adminCtrl.createProduct);
adminRouter.put('/products/:id', adminCtrl.updateProduct);
adminRouter.delete('/products/:id', adminCtrl.deleteProduct);

export default adminRouter;
