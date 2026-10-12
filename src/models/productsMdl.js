import db from '../config/db.js'

async function GetAllProducts() {
    const q = `SELECT p.id,
                    p.name AS product,
                    p.price AS price,
                    p.description AS description,
                    c.slug AS category,
                    col.name AS color,
                    v.size,
                    v.sku,
                    i.url
                FROM products p
                JOIN categorie c         ON c.id = p.id_categorie
                JOIN product_colors col  ON col.product_id = p.id
                JOIN product_variante v  ON v.color_id = col.id
                JOIN product_images i    ON i.color_id = col.id
                ORDER BY p.id, i.sort_order;`;
    const [rows] = await db.promise().query(q);

    // Group data by product
    const productsMap = new Map();
    for (const row of rows) {
        if (!productsMap.has(row.id)) {
            productsMap.set(row.id, {
                id: row.id,
                name: row.product,
                price: row.price,
                description: row.description,
                category: row.category,
                color: row.color,
                sizes: [],
                images: [],
                _sizeSet: new Set(),
                _imageSet: new Set()
            });
        }
        const item = productsMap.get(row.id);
        if (row.size && !item._sizeSet.has(row.size)) {
            item._sizeSet.add(row.size);
            item.sizes.push(row.size);
        }
        if (row.url && !item._imageSet.has(row.url)) {
            item._imageSet.add(row.url);
            item.images.push(row.url);
        }
    }

    return Array.from(productsMap.values()).map(p => {
        delete p._sizeSet;
        delete p._imageSet;
        p.image = p.images[0] || '/images/product-placeholder.jpg';
        p.url = p.image;
        return p;
    });
}

export default { GetAllProducts };