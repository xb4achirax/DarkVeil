/**
 * DARKVEIL - Interactive Cart & WhatsApp Concierge Checkout
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'DARKVEIL_CART_V1';

  // State
  let cart = [];

  // DOM Elements
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartBrowseBtn = document.getElementById('cart-browse-btn');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartDrawerItemsCount = document.getElementById('cart-drawer-items-count');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartEmptyView = document.getElementById('cart-empty-view');
  const cartDrawerFooter = document.getElementById('cart-drawer-footer');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartGrandTotal = document.getElementById('cart-grand-total');
  const cartWhatsAppBtn = document.getElementById('cart-whatsapp-checkout-btn');
  const cartToast = document.getElementById('cart-toast');
  const cartToastMessage = document.getElementById('cart-toast-message');

  // Load Cart from localStorage
  function loadCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cart = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to load cart from localStorage', err);
      cart = [];
    }
  }

  // Save Cart to localStorage
  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
    renderCart();
  }

  // Get total quantity of items
  function getTotalCount() {
    return cart.reduce((total, item) => total + (item.qty || 1), 0);
  }

  // Get grand total price
  function getTotalAmount() {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.qty || 1), 0);
  }

  // Open Cart Drawer
  function openCart() {
    if (cartDrawer && cartOverlay) {
      window.DarkVeilAccount?.closePanel(false);
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      cartDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close Cart Drawer
  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
      cartDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Show Toast
  let toastTimeout = null;
  function showToast(message) {
    if (!cartToast || !cartToastMessage) return;
    cartToastMessage.textContent = message;
    cartToast.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      cartToast.classList.remove('active');
    }, 2800);
  }

  // Render Cart UI
  function renderCart() {
    const totalCount = getTotalCount();
    const totalAmount = getTotalAmount();

    // Update Header Badges
    if (cartCountBadge) {
      cartCountBadge.textContent = totalCount;
    }
    if (cartDrawerItemsCount) {
      cartDrawerItemsCount.textContent = `${totalCount} ${totalCount === 1 ? 'ITEM' : 'ITEMS'}`;
    }

    // Toggle Empty View vs Items
    if (cart.length === 0) {
      if (cartItemsContainer) cartItemsContainer.style.display = 'none';
      if (cartEmptyView) cartEmptyView.classList.add('active');
      if (cartDrawerFooter) cartDrawerFooter.style.display = 'none';
      return;
    }

    if (cartItemsContainer) cartItemsContainer.style.display = 'flex';
    if (cartEmptyView) cartEmptyView.classList.remove('active');
    if (cartDrawerFooter) cartDrawerFooter.style.display = 'flex';

    // Update Totals
    const formattedTotal = `${totalAmount.toFixed(2)} MAD`;
    if (cartSubtotal) cartSubtotal.textContent = formattedTotal;
    if (cartGrandTotal) cartGrandTotal.textContent = formattedTotal;

    // Render Items
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    cart.forEach((item) => {
      const itemKey = `${item.id}-${item.size}-${item.color || ''}`;
      const lineTotal = ((parseFloat(item.price) || 0) * item.qty).toFixed(2);
      const colorBadgeHtml = item.color ? ` · COLOR: <strong>${item.color.toUpperCase()}</strong>` : '';

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.setAttribute('data-cart-key', itemKey);
      itemEl.innerHTML = `
        <div class="cart-item-img">
          <img src="${item.image || '/images/product-placeholder.jpg'}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-header">
            <h4 class="cart-item-name">${item.name}</h4>
            <button class="cart-item-remove-btn" data-key="${itemKey}" title="Remove item" aria-label="Remove item">✕</button>
          </div>
          <div class="cart-item-size-badge">SIZE: <strong>${item.size || 'STANDARD'}</strong>${colorBadgeHtml}</div>
          <div class="cart-item-bottom">
            <div class="cart-qty-stepper">
              <button class="cart-qty-btn minus-btn" data-key="${itemKey}" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-value">${item.qty}</span>
              <button class="cart-qty-btn plus-btn" data-key="${itemKey}" aria-label="Increase quantity">+</button>
            </div>
            <div class="cart-item-total-price">${lineTotal} MAD</div>
          </div>
        </div>
      `;

      cartItemsContainer.appendChild(itemEl);
    });

    attachItemListeners();
  }

  // Attach Item Stepper & Remove Event Handlers
  function attachItemListeners() {
    if (!cartItemsContainer) return;

    // Plus Buttons
    cartItemsContainer.querySelectorAll('.plus-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        updateQuantity(key, 1);
      });
    });

    // Minus Buttons
    cartItemsContainer.querySelectorAll('.minus-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        updateQuantity(key, -1);
      });
    });

    // Remove Buttons
    cartItemsContainer.querySelectorAll('.cart-item-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        removeItem(key);
      });
    });
  }

  // Update item quantity
  function updateQuantity(key, delta) {
    const item = cart.find((i) => `${i.id}-${i.size}-${i.color || ''}` === key);
    if (!item) return;

    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
      removeItem(key);
      return;
    }

    saveCart();
  }

  // Remove item
  function removeItem(key) {
    cart = cart.filter((i) => `${i.id}-${i.size}-${i.color || ''}` !== key);
    saveCart();
    showToast('Item removed from Vault');
  }

  // Add Item to Cart
  function addToCart(productData) {
    const itemColor = productData.color || 'Black';
    const itemSize = productData.size || 'M';
    const existingIndex = cart.findIndex(
      (item) => item.id === productData.id && item.size === itemSize && (item.color || 'Black') === itemColor
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty = (cart[existingIndex].qty || 1) + (productData.qty || 1);
    } else {
      cart.push({
        id: productData.id,
        name: productData.name,
        price: productData.price,
        size: itemSize,
        color: itemColor,
        image: productData.image,
        qty: productData.qty || 1,
      });
    }

    saveCart();
    showToast(`Added to Vault — ${productData.name} (${itemSize} / ${itemColor})`);
    openCart();
  }

  // Format WhatsApp Checkout Message
  function handleWhatsAppCheckout() {
    if (cart.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    // Determine target WhatsApp phone number
    let rawNumber = window.DARKVEIL_WHATSAPP_NUMBER || '0671687435';
    let phone = String(rawNumber).trim().replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1);
    }

    const totalAmount = getTotalAmount().toFixed(2);

    let message = `⚔️ *DARKVEIL ORDER REQUEST* ⚔️\n\n`;
    message += `Hello DARKVEIL, I would like to place an order from your vault:\n\n`;

    cart.forEach((item, index) => {
      const lineTotal = ((parseFloat(item.price) || 0) * item.qty).toFixed(2);
      message += `*${index + 1}. ${item.name.toUpperCase()}*\n`;
      message += `   ▪ Size: *${item.size}*\n`;
      if (item.color) {
        message += `   ▪ Color: *${item.color}*\n`;
      }
      message += `   ▪ Quantity: *${item.qty}*\n`;
      message += `   ▪ Subtotal: *${lineTotal} MAD*\n\n`;
    });

    message += `──────────────────\n`;
    message += `*GRAND TOTAL: ${totalAmount} MAD*\n\n`;
    message += `Please confirm stock availability and shipping details. Thank you!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Initialize Product Card Interaction (Size Selectors, Color Selectors & Add to Cart)
  function initProductCards() {
    document.querySelectorAll('.product-card').forEach((card) => {
      // 1. Size Chips Click Selector
      const sizeChips = card.querySelectorAll('.size-chip');
      sizeChips.forEach((chip) => {
        chip.addEventListener('click', (e) => {
          sizeChips.forEach((c) => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
        });
      });

      // 2. Color Chips Click Selector
      const colorChips = card.querySelectorAll('.color-chip');
      colorChips.forEach((chip) => {
        chip.addEventListener('click', (e) => {
          colorChips.forEach((c) => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
        });
      });

      // 3. Add to Cart Button Click
      const addBtn = card.querySelector('.add-to-cart-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const productId = card.getAttribute('data-product-id') || '1';
          const productName = card.getAttribute('data-product-name') || 'Product';
          const productPrice = card.getAttribute('data-product-price') || '0';
          const productImg = card.getAttribute('data-product-img') || '/images/product-placeholder.jpg';

          // Selected size (or fallback to first chip)
          const selectedSizeChip = card.querySelector('.size-chip.selected') || card.querySelector('.size-chip');
          const size = selectedSizeChip ? selectedSizeChip.getAttribute('data-size') || selectedSizeChip.textContent.trim() : 'M';

          // Selected color (or fallback to first color chip, or card attribute)
          const selectedColorChip = card.querySelector('.color-chip.selected') || card.querySelector('.color-chip');
          const color = selectedColorChip ? selectedColorChip.getAttribute('data-color') : (card.getAttribute('data-product-color') || 'Black');

          addToCart({
            id: productId,
            name: productName,
            price: productPrice,
            size: size,
            color: color,
            image: productImg,
            qty: 1,
          });
        });
      }
    });
  }

  // Setup Global Event Listeners
  function init() {
    loadCart();
    renderCart();
    initProductCards();

    // Drawer Open / Close
    if (openCartBtn) {
      openCartBtn.addEventListener('click', openCart);
    }
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
      cartOverlay.addEventListener('click', closeCart);
    }
    if (cartBrowseBtn) {
      cartBrowseBtn.addEventListener('click', () => {
        closeCart();
        const productsSection = document.getElementById('products');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // WhatsApp Checkout Click
    if (cartWhatsAppBtn) {
      cartWhatsAppBtn.addEventListener('click', handleWhatsAppCheckout);
    }

    // Keyboard ESC close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });
  }

  // Expose global API
  window.DarkVeilCart = {
    addItem: addToCart,
    openCart: openCart,
    closeCart: closeCart,
    getCart: () => [...cart]
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
