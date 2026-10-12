import ProductsMdl from '../models/productsMdl.js';

async function GetAll(req, res) {
    try {
        const products = await ProductsMdl.GetAllProducts();
        res.render('home', { products, whatsappNumber: process.env.WHATSAPP_NUMBER });
    } catch (err) {
        console.error('There was an error in the productsCtrl', err.message)
    }
}


export default { GetAll }