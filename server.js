import express from 'express';
import 'dotenv/config'
import path from 'path';
import db from './src/config/db.js';
import ProductsRouter from './src/routes/productsRouter.js';
import productsCtrl from './src/controllers/productsCtrl.js';


const app = express();
const port = process.env.PORT || 3001;

const root = process.cwd();


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'src', 'views'));
app.use(express.static(path.join(root, 'public')));


//Routers
app.use('/products', ProductsRouter)


app.get('/', (req, res) => {
    productsCtrl.GetAll(req, res);
})


// app.listen(port, () => {
//     console.log(`🚀 https://localhost:${port} 🚀`)
// })

export default app;