import ProductsMdl from '../models/productsMdl.js';

async function GetAll(req, res) {
    try {
        const products = await ProductsMdl.GetAllProducts();
        res.render('home', { products, whatsappNumber: process.env.WHATSAPP_NUMBER });
    } catch (err) {
        console.error('There was an error in the productsCtrl', err.message)
    }
}

async function GetOne(req, res) {
    try {
        const product = await ProductsMdl.GetProductById(req.params.id);
        if (!product) {
            return res.status(404).render('home', { products: [], whatsappNumber: process.env.WHATSAPP_NUMBER });
        }
        res.render('product', { product, whatsappNumber: process.env.WHATSAPP_NUMBER });
    } catch (err) {
        console.error('There was an error in the productsCtrl GetOne', err.message);
        res.status(500).send('Server Error');
    }
}


export default { GetAll, GetOne }