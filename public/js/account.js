/**
 * DARKVEIL - Front-end account access panel
 */

(function () {
  'use strict';

  const drawer = document.getElementById('account-drawer');
  const overlay = document.getElementById('account-overlay');
  const openButton = document.getElementById('open-account-btn');
  const closeButton = document.getElementById('close-account-btn');
  const modeSwitch = document.querySelector('.account-mode-switch');
  const modeButtons = document.querySelectorAll('.account-mode-btn');
  const nameField = document.getElementById('account-name-field');
  const nameInput = document.getElementById('account-name');
  const emailInput = document.getElementById('account-email');
  const passwordInput = document.getElementById('account-password');
  const form = document.getElementById('account-form');
  const submitButton = document.getElementById('account-submit-btn');
  const logoutButton = document.getElementById('account-logout-btn');
  const intro = document.getElementById('account-intro');
  const feedback = document.getElementById('account-feedback');

  if (!drawer || !overlay || !openButton || !closeButton) return;

  let mode = 'login';

  function openPanel() {
    window.DarkVeilCart?.closeCart();
    drawer.classList.add('active');
    overlay.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      (logoutButton || (mode === 'signup' ? nameInput : emailInput))?.focus();
    });
  }

  function closePanel(restoreFocus = true) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    if (!document.getElementById('cart-drawer')?.classList.contains('active')) {
      document.body.style.overflow = '';
    }
    if (restoreFocus) openButton.focus();
  }

  function setMode(nextMode) {
    if (!form) return;

    mode = nextMode;
    const isSignup = mode === 'signup';

    modeSwitch?.classList.toggle('signup', isSignup);
    modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    nameField.hidden = !isSignup;
    nameInput.required = isSignup;
    nameInput.disabled = !isSignup;
    passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
    passwordInput.minLength = isSignup ? 8 : 0;
    submitButton.querySelector('span').textContent = isSignup ? 'CREATE ACCOUNT' : 'SIGN IN';
    intro.textContent = isSignup
      ? 'Become part of the DARKVEIL world. Your next chapter starts here.'
      : 'Your world. Your uniform. Step back into your account.';
    feedback.textContent = '';
  }

  if (form) setMode(mode);

  openButton.addEventListener('click', openPanel);
  closeButton.addEventListener('click', () => closePanel());
  overlay.addEventListener('click', () => closePanel());

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });


  form?.addEventListener('input', () => {
    feedback.textContent = '';
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('active')) {
      closePanel();
    }
  });

  form?.addEventListener('submit', async(e) => {

    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      name : nameInput.value,
      email : emailInput.value,
      password : passwordInput.value,
    };

    try{
      const response = await fetch (mode === 'login' ? '/auth/log-in' : '/auth/sign-up', {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify(data)
      });

      const result = await response.json();
      feedback.textContent = result.message || (response.ok
        ? 'Request completed.'
        : 'Unable to complete your request.');
      if (response.ok && mode === 'login') {
        window.location.reload();
      }
    } catch (err) {
      console.error('This error is in the login and signup fetch', err);
      feedback.textContent = 'Unable to reach the server. Please try again.';
    }
  });

  logoutButton?.addEventListener('click', async () => {
    logoutButton.disabled = true;
    feedback.textContent = '';

    try {
      const response = await fetch('/auth/log-out', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign out. Please try again.');
      }
      window.location.reload();
    } catch (err) {
      console.error('Unable to sign out', err);
      feedback.textContent = err.message || 'Unable to reach the server. Please try again.';
      logoutButton.disabled = false;
    }
  });

  window.DarkVeilAccount = { closePanel };
})();
