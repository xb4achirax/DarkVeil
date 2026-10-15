import ProductsMdl from '../models/productsMdl.js';

function validateProduct(body = {}) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const categoryId = Number(body.categoryId);
    const price = Number(body.price);

    if (!name || name.length > 150) {
        return { error: 'Product name is required and must be 150 characters or fewer.' };
    }
    if (description.length > 65535) {
        return { error: 'Product description is too long.' };
    }
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
        return { error: 'Choose a valid category.' };
    }
    if (!Number.isFinite(price) || price <= 0 || price > 99999999.99
        || Math.abs(price * 100 - Math.round(price * 100)) > 1e-7) {
        return { error: 'Enter a valid price with up to two decimal places.' };
    }
    if (!Array.isArray(body.colors) || body.colors.length === 0) {
        return { error: 'Add at least one product color.' };
    }

    const colorNames = new Set();
    const colors = [];
    for (const inputColor of body.colors) {
        const colorName = typeof inputColor?.name === 'string' ? inputColor.name.trim() : '';
        const hexCode = typeof inputColor?.hexCode === 'string' ? inputColor.hexCode.trim() : '';
        if (!colorName || colorName.length > 50) {
            return { error: 'Each color needs a name of 1 to 50 characters.' };
        }
        if (hexCode && !/^#[\da-f]{6}$/i.test(hexCode)) {
            return { error: `Enter a valid six-digit hex color for ${colorName}.` };
        }
        const normalizedName = colorName.toLowerCase();
        if (colorNames.has(normalizedName)) {
            return { error: 'Color names must be unique within a product.' };
        }
        colorNames.add(normalizedName);

        if (!Array.isArray(inputColor.sizes) || !Array.isArray(inputColor.images)) {
            return { error: `Invalid sizes or images for ${colorName}.` };
        }

        const sizes = [];
        const sizeNames = new Set();
        for (const inputSize of inputColor.sizes) {
            const size = typeof inputSize?.size === 'string' ? inputSize.size.trim() : '';
            const sku = typeof inputSize?.sku === 'string' ? inputSize.sku.trim() : '';
            const inStock = Number(inputSize?.inStock);
            if (!size || size.length > 20 || (sku && sku.length > 60) || ![0, 1].includes(inStock)) {
                return { error: `Check the size, SKU, and stock value for ${colorName}.` };
            }
            if (sizeNames.has(size.toLowerCase())) {
                return { error: `Size ${size} is repeated for ${colorName}.` };
            }
            sizeNames.add(size.toLowerCase());
            sizes.push({ size, sku, inStock });
        }

        const images = [];
        for (const inputImage of inputColor.images) {
            const url = typeof inputImage === 'string' ? inputImage.trim() : '';
            if (!url || url.length > 500) {
                return { error: `Each image URL for ${colorName} must be between 1 and 500 characters.` };
            }
            images.push(url);
        }

        colors.push({ name: colorName, hexCode, sizes, images });
    }

    return {
        product: { name, description, categoryId, price, colors },
    };
}

function sendProductError(res, error, operation) {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'That SKU is already assigned to another variant.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'The selected category no longer exists.' });
    }

    console.error(`Admin product ${operation} failed`, error);
    return res.status(500).json({ message: 'Unable to save product changes right now.' });
}

async function renderPanel(req, res) {
    try {
        const [products, categories] = await Promise.all([
            ProductsMdl.GetAllProducts(),
            ProductsMdl.GetCategories(),
        ]);
        return res.render('admin', {
            title: 'ADMIN CONSOLE | DARKVEIL',
            extraCss: '<link rel="stylesheet" href="/css/admin.css">',
            products,
            categories,
        });
    } catch (error) {
        console.error('Failed to load admin console', error);
        return res.status(500).send('Unable to load the admin console right now.');
    }
}

async function getProduct(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    try {
        const product = await ProductsMdl.GetAdminProductById(id);
        if (!product) return res.status(404).json({ message: 'Product not found.' });
        return res.json(product);
    } catch (error) {
        return sendProductError(res, error, 'lookup');
    }
}

async function createProduct(req, res) {
    const validation = validateProduct(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    try {
        const categories = await ProductsMdl.GetCategories();
        if (!categories.some(category => category.id === validation.product.categoryId)) {
            return res.status(400).json({ message: 'Choose a valid category.' });
        }
        const id = await ProductsMdl.CreateProduct(validation.product);
        return res.status(201).json({ message: 'Product created.', id });
    } catch (error) {
        return sendProductError(res, error, 'creation');
    }
}

async function updateProduct(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    const validation = validateProduct(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    try {
        const categories = await ProductsMdl.GetCategories();
        if (!categories.some(category => category.id === validation.product.categoryId)) {
            return res.status(400).json({ message: 'Choose a valid category.' });
        }
        const updated = await ProductsMdl.UpdateProduct(id, validation.product);
        if (!updated) return res.status(404).json({ message: 'Product not found.' });
        return res.json({ message: 'Product updated.' });
    } catch (error) {
        return sendProductError(res, error, 'update');
    }
}

async function deleteProduct(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    try {
        const deleted = await ProductsMdl.DeleteProduct(id);
        if (!deleted) return res.status(404).json({ message: 'Product not found.' });
        return res.json({ message: 'Product deleted.' });
    } catch (error) {
        return sendProductError(res, error, 'deletion');
    }
}

export default { renderPanel, getProduct, createProduct, updateProduct, deleteProduct };
