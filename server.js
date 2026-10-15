import express from 'express';
import 'dotenv/config'
import path from 'path';
import cookieParser from 'cookie-parser';
import ProductsRouter from './src/routes/productsRouter.js';
import productsCtrl from './src/controllers/productsCtrl.js';
import authRouter from './src/routes/auth.js';
import adminRouter from './src/routes/admin.js';
import { setAuthViewState } from './src/middleware/adminAuth.js';


const app = express();

const root = process.cwd();


app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'src', 'views'));
app.use(express.static(path.join(root, 'public')));
app.use(setAuthViewState);


//Routers
app.use('/products', ProductsRouter)
app.use('/auth', authRouter)
app.use('/admin', adminRouter)


app.get('/', (req, res) => {
    productsCtrl.GetAll(req, res);
})


// app.listen(port, () => {
//     console.log(`🚀 https://localhost:${port} 🚀`)
// })

export default app;