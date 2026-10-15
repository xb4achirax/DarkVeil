(function () {
  'use strict';

  const form = document.getElementById('admin-product-form');
  const colorList = document.getElementById('admin-color-list');
  const feedback = document.getElementById('admin-feedback');
  const productIdInput = document.getElementById('admin-product-id');
  const formTitle = document.getElementById('product-form-title');
  const saveButton = document.getElementById('admin-save-product');
  const cancelButton = document.getElementById('admin-cancel-edit');

  if (!form || !colorList || !feedback) return;

  function addColorCard(color = {}) {
    const card = document.createElement('fieldset');
    card.className = 'admin-color-card';

    const heading = document.createElement('div');
    heading.className = 'admin-color-card-heading';
    const label = document.createElement('span');
    label.textContent = `COLOR ${colorList.children.length + 1}`;
    const remove = document.createElement('button');
    remove.className = 'admin-remove-color';
    remove.type = 'button';
    remove.textContent = 'REMOVE';
    remove.addEventListener('click', () => {
      card.remove();
      updateColorLabels();
    });
    heading.append(label, remove);

    const name = createField('COLOR NAME', 'text', color.name || '', 'e.g. Black');
    name.input.maxLength = 50;
    name.input.required = true;

    const hexCode = createField('HEX CODE', 'text', color.hexCode || '', '#0b0b0b');
    hexCode.input.maxLength = 7;
    hexCode.input.pattern = '#[0-9a-fA-F]{6}';

    const sizes = createTextareaField('SIZES / SKU / STOCK', formatSizes(color.sizes));
    const images = createTextareaField('IMAGE URLS (ONE PER LINE)', (color.images || []).join('\n'));
    sizes.wrapper.classList.add('admin-color-field-wide');
    images.wrapper.classList.add('admin-color-field-wide');

    card.append(heading, name.wrapper, hexCode.wrapper, sizes.wrapper, images.wrapper);
    colorList.append(card);
  }

  function createField(labelText, type, value, placeholder) {
    const wrapper = document.createElement('label');
    wrapper.className = 'admin-color-field';
    const label = document.createElement('span');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.placeholder = placeholder;
    wrapper.append(label, input);
    return { wrapper, input };
  }

  function createTextareaField(labelText, value) {
    const wrapper = document.createElement('label');
    wrapper.className = 'admin-color-field';
    const label = document.createElement('span');
    label.textContent = labelText;
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.placeholder = labelText.startsWith('SIZES')
      ? 'M | DV-ITEM-BLK-M | 1\nL | DV-ITEM-BLK-L | 1'
      : '/images/item-front.jpg\n/images/item-back.jpg';
    wrapper.append(label, textarea);
    return { wrapper, input: textarea };
  }

  function formatSizes(sizes = []) {
    return sizes.map(size => `${size.size} | ${size.sku || ''} | ${size.inStock}`).join('\n');
  }

  function updateColorLabels() {
    [...colorList.children].forEach((card, index) => {
      card.querySelector('.admin-color-card-heading span').textContent = `COLOR ${index + 1}`;
    });
  }

  function clearForm() {
    form.reset();
    productIdInput.value = '';
    formTitle.textContent = 'ADD A PRODUCT';
    saveButton.textContent = 'CREATE PRODUCT';
    cancelButton.hidden = true;
    colorList.replaceChildren();
    addColorCard();
    feedback.textContent = '';
  }

  function collectProduct() {
    const colors = [...colorList.children].map((card) => {
      const fields = card.querySelectorAll('.admin-color-field');
      const name = fields[0].querySelector('input').value.trim();
      const hexCode = fields[1].querySelector('input').value.trim();
      const sizeLines = fields[2].querySelector('textarea').value.split(/\r?\n/);
      const imageLines = fields[3].querySelector('textarea').value.split(/\r?\n/);
      const sizes = sizeLines.filter(line => line.trim()).map((line) => {
        const [size = '', sku = '', stock = '1'] = line.split('|').map(value => value.trim());
        return { size, sku, inStock: Number(stock) };
      });
      const images = imageLines.map(url => url.trim()).filter(Boolean);
      return { name, hexCode, sizes, images };
    });

    return {
      name: document.getElementById('admin-product-name').value.trim(),
      categoryId: Number(document.getElementById('admin-product-category').value),
      price: Number(document.getElementById('admin-product-price').value),
      description: document.getElementById('admin-product-description').value.trim(),
      colors,
    };
  }

  async function readResponse(response) {
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
    return result;
  }

  async function editProduct(id) {
    feedback.textContent = '';
    try {
      const response = await fetch(`/admin/products/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      });
      const product = await readResponse(response);

      productIdInput.value = product.id;
      document.getElementById('admin-product-name').value = product.name;
      document.getElementById('admin-product-category').value = product.categoryId;
      document.getElementById('admin-product-price').value = product.price;
      document.getElementById('admin-product-description').value = product.description;
      colorList.replaceChildren();
      product.colors.forEach(addColorCard);
      if (product.colors.length === 0) addColorCard();

      formTitle.textContent = 'EDIT PRODUCT';
      saveButton.textContent = 'SAVE CHANGES';
      cancelButton.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      feedback.textContent = error.message;
    }
  }

  document.getElementById('admin-add-color').addEventListener('click', () => addColorCard());
  cancelButton.addEventListener('click', clearForm);

  form.addEventListener('input', () => {
    feedback.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = productIdInput.value;
    const url = id ? `/admin/products/${encodeURIComponent(id)}` : '/admin/products';
    const method = id ? 'PUT' : 'POST';
    saveButton.disabled = true;
    feedback.textContent = 'Saving product…';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(collectProduct()),
      });
      const result = await readResponse(response);
      feedback.textContent = result.message;
      window.location.reload();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  document.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => editProduct(button.dataset.editProduct));
  });

  document.querySelectorAll('[data-delete-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      const productName = button.getAttribute('aria-label').replace(/^Delete\s+/, '');
      if (!window.confirm(`Delete "${productName}" and all its colors, sizes, and images?`)) return;

      button.disabled = true;
      feedback.textContent = 'Deleting product…';
      try {
        const response = await fetch(`/admin/products/${encodeURIComponent(button.dataset.deleteProduct)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
        const result = await readResponse(response);
        feedback.textContent = result.message;
        window.location.reload();
      } catch (error) {
        feedback.textContent = error.message;
        button.disabled = false;
      }
    });
  });

  addColorCard();
})();
