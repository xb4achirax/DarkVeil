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
        colors: [],
        sizes: [],
        images: []
    };

    const colorSet = new Set();
    const sizeSet = new Set();
    const imageSet = new Set();
    const colorsById = new Map();

    for (const row of rows) {
        if (row.color_name && !colorSet.has(row.color_name)) {
            colorSet.add(row.color_name);
            const color = {
                id: row.color_id,
                name: row.color_name,
                hex: row.color_hex || '#0b0b0b',
                sizes: [],
                _sizeSet: new Set()
            };
            colorsById.set(row.color_id, color);
            product.colors.push(color);
        }
        const color = colorsById.get(row.color_id);
        if (color && row.size && !color._sizeSet.has(row.size)) {
            color._sizeSet.add(row.size);
            color.sizes.push(row.size);
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
        for (const color of product.colors) {
            delete color._sizeSet;
        }
    }

    product.image = product.images[0] || '/images/product-placeholder.jpg';
    return product;
}

async function GetCategories() {
    const [rows] = await db.promise().query(
        'SELECT id, name, slug FROM categorie ORDER BY id'
    );
    return rows;
}

async function GetAdminProductById(id) {
    const q = `SELECT p.id, p.id_categorie AS category_id, p.name AS product,
                    p.description, p.price, c.slug AS category,
                    col.id AS color_id, col.name AS color_name, col.hex_code AS color_hex,
                    v.id AS variant_id, v.size, v.sku, v.in_stock,
                    i.id AS image_id, i.url, i.sort_order
                FROM products p
                JOIN categorie c ON c.id = p.id_categorie
                LEFT JOIN product_colors col ON col.product_id = p.id
                LEFT JOIN product_variante v ON v.color_id = col.id
                LEFT JOIN product_images i ON i.color_id = col.id
                WHERE p.id = ?
                ORDER BY col.sort_order, v.id, i.sort_order`;
    const [rows] = await db.promise().execute(q, [id]);

    if (rows.length === 0) return null;

    const product = {
        id: rows[0].id,
        categoryId: rows[0].category_id,
        category: rows[0].category,
        name: rows[0].product,
        description: rows[0].description || '',
        price: Number(rows[0].price),
        colors: [],
    };
    const colorsById = new Map();

    for (const row of rows) {
        if (row.color_id === null) continue;

        if (!colorsById.has(row.color_id)) {
            const color = {
                name: row.color_name,
                hexCode: row.color_hex || '',
                sizes: [],
                images: [],
                _variantIds: new Set(),
                _imageIds: new Set(),
            };
            colorsById.set(row.color_id, color);
            product.colors.push(color);
        }

        const color = colorsById.get(row.color_id);
        if (row.variant_id !== null && !color._variantIds.has(row.variant_id)) {
            color._variantIds.add(row.variant_id);
            color.sizes.push({
                size: row.size,
                sku: row.sku || '',
                inStock: row.in_stock,
            });
        }
        if (row.image_id !== null && !color._imageIds.has(row.image_id)) {
            color._imageIds.add(row.image_id);
            color.images.push(row.url);
        }
    }

    for (const color of product.colors) {
        delete color._variantIds;
        delete color._imageIds;
    }

    return product;
}

async function saveProductChildren(connection, productId, colors) {
    for (const [colorIndex, color] of colors.entries()) {
        const [colorResult] = await connection.execute(
            'INSERT INTO product_colors (product_id, name, hex_code, sort_order) VALUES (?, ?, ?, ?)',
            [productId, color.name, color.hexCode || null, colorIndex + 1]
        );
        const colorId = colorResult.insertId;

        for (const size of color.sizes) {
            await connection.execute(
                'INSERT INTO product_variante (color_id, size, sku, in_stock) VALUES (?, ?, ?, ?)',
                [colorId, size.size, size.sku || null, size.inStock]
            );
        }

        for (const [imageIndex, url] of color.images.entries()) {
            await connection.execute(
                'INSERT INTO product_images (color_id, url, sort_order) VALUES (?, ?, ?)',
                [colorId, url, imageIndex + 1]
            );
        }
    }
}

async function CreateProduct(product) {
    const connection = await db.promise().getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [result] = await connection.execute(
            'INSERT INTO products (id_categorie, name, description, price) VALUES (?, ?, ?, ?)',
            [product.categoryId, product.name, product.description || null, product.price]
        );
        await saveProductChildren(connection, result.insertId, product.colors);
        await connection.commit();
        transactionStarted = false;
        return result.insertId;
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Failed to roll back product creation', rollbackError);
            }
        }
        throw error;
    } finally {
        connection.release();
    }
}

async function UpdateProduct(id, product) {
    const connection = await db.promise().getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [existingRows] = await connection.execute(
            'SELECT id FROM products WHERE id = ? FOR UPDATE',
            [id]
        );
        if (existingRows.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return false;
        }

        await connection.execute(
            'UPDATE products SET id_categorie = ?, name = ?, description = ?, price = ? WHERE id = ?',
            [product.categoryId, product.name, product.description || null, product.price, id]
        );

        await connection.execute('DELETE FROM product_colors WHERE product_id = ?', [id]);
        await saveProductChildren(connection, id, product.colors);
        await connection.commit();
        transactionStarted = false;
        return true;
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Failed to roll back product update', rollbackError);
            }
        }
        throw error;
    } finally {
        connection.release();
    }
}

async function DeleteProduct(id) {
    const [result] = await db.promise().execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

export default {
    GetAllProducts,
    GetProductById,
    GetCategories,
    GetAdminProductById,
    CreateProduct,
    UpdateProduct,
    DeleteProduct,
};