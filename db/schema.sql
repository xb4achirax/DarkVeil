USE defaultdb;

-- Start clean (children first)
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variante;
DROP TABLE IF EXISTS product_colors;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categorie;

CREATE TABLE categorie (
  id                  INT NOT NULL AUTO_INCREMENT,
  name                VARCHAR(100) NOT NULL,
  slug                VARCHAR(120) NOT NULL,
  id_categorie_parent INT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_categorie_slug (slug),
  CONSTRAINT fk_categorie_parent
    FOREIGN KEY (id_categorie_parent) REFERENCES categorie(id)
    ON DELETE RESTRICT
);

CREATE TABLE products (
  id           INT NOT NULL AUTO_INCREMENT,
  id_categorie INT NOT NULL,
  name         VARCHAR(150) NOT NULL,
  description  TEXT NULL,
  price        DECIMAL(10,2) NOT NULL,
  is_active    INT NOT NULL DEFAULT 1,
  on_sale      INT NOT NULL DEFAULT 0,
  is_new       INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_products_categorie
    FOREIGN KEY (id_categorie) REFERENCES categorie(id)
    ON DELETE RESTRICT
);

-- One row per color of a product (this is what owns the images)
CREATE TABLE product_colors (
  id         INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  name       VARCHAR(50) NOT NULL,
  hex_code   VARCHAR(7) NULL,
  sort_order INT NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_color_product_name (product_id, name),
  CONSTRAINT fk_colors_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

-- One row per size of a color (this is what is sold and has stock)
CREATE TABLE product_variante (
  id        INT NOT NULL AUTO_INCREMENT,
  color_id  INT NOT NULL,
  size      VARCHAR(20) NOT NULL,
  sku       VARCHAR(60) NULL,
  in_stock  INT NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_variante_sku (sku),
  UNIQUE KEY uq_variante_color_size (color_id, size),
  CONSTRAINT fk_variante_color
    FOREIGN KEY (color_id) REFERENCES product_colors(id)
    ON DELETE CASCADE
);

-- Images belong to a color, so every size of that color shares them
CREATE TABLE product_images (
  id          INT NOT NULL AUTO_INCREMENT,
  color_id    INT NOT NULL,
  url         VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  CONSTRAINT fk_images_color
    FOREIGN KEY (color_id) REFERENCES product_colors(id)
    ON DELETE CASCADE
);