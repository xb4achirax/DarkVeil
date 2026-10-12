import db from '../config/db.js';

async function GetAllProducts() {
    const q = `SELECT p.id,
                    p.name AS product,
                    p.price AS price,
                    p.description AS description,
                    c.slug AS category,
                    col.id AS color_id,
                    col.name AS color_name,
                    col.hex_code AS color_hex,
                    v.size,
                    v.sku,
                    i.url
                FROM products p
                JOIN categorie c             ON c.id = p.id_categorie
                LEFT JOIN product_colors col ON col.product_id = p.id
                LEFT JOIN product_variante v ON v.color_id = col.id
                LEFT JOIN product_images i   ON i.color_id = col.id
                ORDER BY p.id, i.sort_order;`;
    const [rows] = await db.promise().query(q);

    // Group data by product
    const productsMap = new Map();
    for (const row of rows) {
        if (!productsMap.has(row.id)) {
            productsMap.set(row.id, {
                id: row.id,
                name: row.product,
                product: row.product,
                price: row.price,
                description: row.description,
                category: row.category,
                color: row.color_name || 'Black',
                colors: [],
                sizes: [],
                images: [],
                _colorSet: new Set(),
                _sizeSet: new Set(),
                _imageSet: new Set()
            });
        }
        const item = productsMap.get(row.id);

        // Add available color from DB
        if (row.color_name && !item._colorSet.has(row.color_name)) {
            item._colorSet.add(row.color_name);
            item.colors.push({
                id: row.color_id,
                name: row.color_name,
                hex: row.color_hex || '#0b0b0b'
            });
        }

        // Add available size from DB
        if (row.size && !item._sizeSet.has(row.size)) {
            item._sizeSet.add(row.size);
            item.sizes.push(row.size);
        }

        // Add available image from DB
        if (row.url && !item._imageSet.has(row.url)) {
            item._imageSet.add(row.url);
            item.images.push(row.url);
        }
    }

    return Array.from(productsMap.values()).map(p => {
        delete p._colorSet;
        delete p._sizeSet;
        delete p._imageSet;
        p.image = p.images[0] || '/images/product-placeholder.jpg';
        p.url = p.image;
        if (p.colors.length > 0) {
            p.color = p.colors[0].name;
        }
        return p;
    });
}

async function GetProductById(id) {
    const q = `SELECT p.id,
                    p.name AS product,
                    p.price AS price,
                    p.description AS description,
                    c.slug AS category,
                    col.id AS color_id,
                    col.name AS color_name,
                    col.hex_code AS color_hex,
                    v.size,
                    v.sku,
                    i.url
                FROM products p
                JOIN categorie c             ON c.id = p.id_categorie
                LEFT JOIN product_colors col ON col.product_id = p.id
                LEFT JOIN product_variante v ON v.color_id = col.id
                LEFT JOIN product_images i   ON i.color_id = col.id
                WHERE p.id = ?
                ORDER BY i.sort_order;`;
    const [rows] = await db.promise().query(q, [id]);

    if (rows.length === 0) return null;

    const product = {
        id: rows[0].id,
        name: rows[0].product,
        product: rows[0].product,
        price: rows[0].price,
        description: rows[0].description,
        category: rows[0].category,
        color: rows[0].color_name || 'Black',
        colors: [],
        sizes: [],
        images: []
    };

    const colorSet = new Set();
    const sizeSet = new Set();
    const imageSet = new Set();

    for (const row of rows) {
        if (row.color_name && !colorSet.has(row.color_name)) {
            colorSet.add(row.color_name);
            product.colors.push({
                id: row.color_id,
                name: row.color_name,
                hex: row.color_hex || '#0b0b0b'
            });
        }
        if (row.size && !sizeSet.has(row.size)) {
            sizeSet.add(row.size);
            product.sizes.push(row.size);
        }
        if (row.url && !imageSet.has(row.url)) {
            imageSet.add(row.url);
            product.images.push(row.url);
        }
    }

    if (product.colors.length > 0) {
        product.color = product.colors[0].name;
    }

    product.image = product.images[0] || '/images/product-placeholder.jpg';
    return product;
}

export default { GetAllProducts, GetProductById };