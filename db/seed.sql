USE defaultdb;

-- CATEGORIES (ids 1 to 9 are given automatically, in this order)
INSERT INTO categorie (name, slug, id_categorie_parent) VALUES
  ('Men',     'men',            NULL),
  ('Women',   'women',          NULL),
  ('Unisex',  'unisex',         NULL),
  ('Tops',    'men-tops',       1),
  ('Bottoms', 'men-bottoms',    1),
  ('Tops',    'women-tops',     2),
  ('Bottoms', 'women-bottoms',  2),
  ('Tops',    'unisex-tops',    3),
  ('Bottoms', 'unisex-bottoms', 3);

-- PRODUCT (category 8 = unisex-tops)
INSERT INTO products (id_categorie, name, description, price, is_active, on_sale, is_new) VALUES
  (8, 'Beyond The Veil', 'Heavyweight black hoodie with the BTV emblem.', 250.00, TRUE, FALSE, TRUE);

-- COLOR (product 1)
INSERT INTO product_colors (product_id, name, hex_code, sort_order) VALUES
  (1, 'Black', '#0b0b0b', 1);

-- SIZES (color 1) - change S/M/L to your real sizes
INSERT INTO product_variante (color_id, size, sku, in_stock) VALUES
  (1, 'M', 'DV-HOODIE-BLK-S', TRUE),
  (1, 'L', 'DV-HOODIE-BLK-M', TRUE),
  (1, 'xL', 'DV-HOODIE-BLK-L', TRUE);

-- IMAGES (color 1, stored once, shared by all sizes)
INSERT INTO product_images (color_id, url, sort_order) VALUES
  (1, '/images/beyond the veil back 1.jpg', 1),
  (1, '/images/beyond the veil front 1.jpg', 2),
  (1, '/images/beyond the veil back 2.jpg', 3),
  (1, '/images/beyond the veil front 2.jpg', 4);