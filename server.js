import express from 'express';
import 'dotenv/config'
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/config/db.js';
import ProductsRouter from './src/routes/productsRouter.js';
import productsCtrl from './src/controllers/productsCtrl.js';


const app = express();
const port = process.env.PORT || 3001;



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));


//Routers
app.use('/products', ProductsRouter)


app.get('/', (req, res) => {
    productsCtrl.GetAll(req, res);
})


// app.listen(port, () => {
//     console.log(`🚀 https://localhost:${port} 🚀`)
// })

export default { app }