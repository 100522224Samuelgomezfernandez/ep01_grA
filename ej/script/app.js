/*
  app.js - logica  para la practica 2 de intefaces
*/
(function () {
  const STORAGE_KEYS = {
    users: 'iu_users',
    session: 'iu_session',
    remember: 'iu_remember',
    advices: 'iu_consejos'
  };

  const IMAGE_TYPES = ['image/webp', 'image/png', 'image/jpg', 'image/jpeg'];
  const carousels = {};

  $(document).ready(function () {
    setupCarousels();
    const page = $('body').data('page');

    if (page === 'home') {
      initHome();
    } else if (page === 'register') {
      initRegister();
    } else if (page === 'user') {
      initUser();
    } else if (page === 'purchase') {
      initPurchase();
    }
  });

  function setupCarousels() {
    $('.packs[data-carousel]').each(function () {
      const $block = $(this);
      const carouselId = $block.data('carousel');
      const $items = $block.find('.carousel_container .pack_item');
      if ($items.length === 0) {
        return;
      }

      carousels[carouselId] = {
        $items: $items,
        current: 0,
        timer: null
      };

      $items.removeClass('active');
      $items.eq(0).addClass('active');
      startCarousel(carouselId);
    });

    $('.carousel_next').on('click', function () {
      const id = $(this).data('carousel');
      moveCarousel(id, 1);
    });

    $('.carousel_prev').on('click', function () {
      const id = $(this).data('carousel');
      moveCarousel(id, -1);
    });
  }

  function moveCarousel(id, direction) {
    const state = carousels[id];
    if (!state) {
      return;
    }

    const total = state.$items.length;
    state.current = (state.current + direction + total) % total;
    state.$items.removeClass('active');
    state.$items.eq(state.current).addClass('active');
  }

  function startCarousel(id) {
    const state = carousels[id];
    if (!state) {
      return;
    }

    if (state.timer) {
      clearInterval(state.timer);
    }

    state.timer = setInterval(function () {
      moveCarousel(id, 1);
    }, 2000); // va cambiando cada 2 seg sin que el user toque nada
  }

  function initHome() {
    const $form = $('#loginForm');
    const $user = $('#loginUser');
    const $pass = $('#loginPass');
    const $remember = $('#rememberUser');

    const storedRemember = window.localStorage.getItem(STORAGE_KEYS.remember);
    if (storedRemember) {
      $user.val(storedRemember);
      $remember.prop('checked', true);
    }

    $('#btnLogin').on('click', function () {
      handleLogin($form, $user, $pass, $remember);
    });

    $form.on('keypress', function (evt) {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        handleLogin($form, $user, $pass, $remember);
      }
    });
  }

  function handleLogin($form, $user, $pass, $remember) {
    clearFormErrors($form);

    const userValue = ($user.val() || '').trim();
    const passValue = ($pass.val() || '').trim();
    const remember = $remember.is(':checked');

    if (!userValue || !passValue) {
      markError($user, !userValue);
      markError($pass, !passValue);
      alert('Debes rellenar usuario y contraseña.');
      return;
    }

    const users = loadUsers();
    const found = users[userValue];

    if (!found) {
      alert('Usuario no encontrado, prueba a registrarte.');
      return;
    }

    if (found.password !== passValue) {
      alert('Contraseña incorrecta, revisala porfa.');
      return;
    }

    setSession(userValue);

    if (remember) {
      window.localStorage.setItem(STORAGE_KEYS.remember, userValue);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.remember);
    }

    alert('Inicio de sesión correcto.');
    window.location.href = 'usuario.html';
  }

  function initRegister() {
    const $form = $('#registroForm');
    const $privacy = $('#acepto');
    const $submit = $('#btnRegistro');

    toggleSubmit($submit, $privacy.is(':checked'));

    $privacy.on('change', function () {
      toggleSubmit($submit, $(this).is(':checked'));
    });

    $form.on('submit', function (evt) {
      evt.preventDefault();
      handleRegister($form);
    });
  }

  function toggleSubmit($button, enabled) {
    $button.prop('disabled', !enabled);
  }

  function handleRegister($form) {
    clearFormErrors($form);

    const nombre = ($('#nombre').val() || '').trim();
    const apellidos = ($('#apellidos').val() || '').trim();
    const email = ($('#email').val() || '').trim();
    const email2 = ($('#email2').val() || '').trim();
    const nacimiento = $('#nacimiento').val();
    const login = ($('#login').val() || '').trim();
    const password = ($('#password').val() || '').trim();
    const fileInput = $('#avatar')[0];
    const privacyOk = $('#acepto').is(':checked');

    const errors = [];

    if (nombre.length < 3) {
      errors.push('El nombre debe tener al menos 3 letras.');
      markError($('#nombre'), true);
    }

    const apellidosPartes = apellidos.split(' ').filter(Boolean);
    if (apellidosPartes.length < 2 || !apellidosPartes.every(function (parte) { return parte.length >= 3; })) {
      errors.push('Los apellidos tienen que tener dos palabritas de mínimo 3 letras.');
      markError($('#apellidos'), true);
    }

    if (!isValidEmail(email)) {
      errors.push('El correo no parece válido.');
      markError($('#email'), true);
    }

    if (email !== email2) {
      errors.push('Los correos no coinciden.');
      markError($('#email2'), true);
    }

    if (!nacimiento || !isValidBirthDate(nacimiento)) {
      errors.push('La fecha de nacimiento no es realista.');
      markError($('#nacimiento'), true);
    }

    if (login.length < 5) {
      errors.push('El login debe tener 5 caracteres mínimo.');
      markError($('#login'), true);
    }

    const users = loadUsers();
    if (users[login]) {
      errors.push('Ese login ya está pillado, elige otro.');
      markError($('#login'), true);
    }

    if (!isValidPassword(password)) {
      errors.push('La contraseña no cumple lo pedido.');
      markError($('#password'), true);
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      errors.push('Debes subir una imagen de perfil.');
      markError($('#avatar'), true);
    } else {
      const file = fileInput.files[0];
      if (IMAGE_TYPES.indexOf(file.type) === -1) {
        errors.push('Formato de imagen no permitido.');
        markError($('#avatar'), true);
      }
    }

    if (!privacyOk) {
      errors.push('Hay que aceptar la política de privacidad.');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (evt) {
      const newUser = {
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        nacimiento: nacimiento,
        login: login,
        password: password,
        avatar: evt.target.result,
        createdAt: new Date().toISOString()
      };

      users[login] = newUser;
      saveUsers(users);
      setSession(login);

      alert('Registro completado. Bienvenido/a.');
      window.location.href = 'usuario.html';
    };

    reader.onerror = function () {
      alert('Hubo un fallo leyendo la imagen, prueba otra vez.');
    };

    reader.readAsDataURL(file);
  }

  function initUser() {
    const session = getSession();
    if (!session) {
      alert('Debes iniciar sesión antes de entrar aquí.');
      window.location.href = 'index.html';
      return;
    }

    const users = loadUsers();
    const current = users[session];

    if (!current) {
      clearSession();
      alert('La sesión no es válida, vuelve a iniciar sesión.');
      window.location.href = 'index.html';
      return;
    }

    $('#userName').text(current.nombre + ' ' + current.apellidos);
    if (current.avatar) {
      $('#userAvatar').attr('src', current.avatar);
    }

    $('#logoutButton').on('click', function () {
      const sure = confirm('¿Desea cerrar sesión?');
      if (sure) {
        clearSession();
        window.location.href = 'index.html';
      }
    });

    renderAdvices();

    $('#adviceForm').on('submit', function (evt) {
      evt.preventDefault();
      handleAdviceSubmit($(this), session);
    });
  }

  function renderAdvices() {
    const $list = $('#latestTipsList');
    $list.empty();

    const advices = loadAdvices();
    if (advices.length === 0) {
      $list.append('<li>No hay consejos aún. Sé el primero :)</li>');
      return;
    }

    advices.slice(0, 3).forEach(function (advice) {
      const safeTitle = escapeHtml(advice.title);
      const $item = $('<li></li>');
      const $link = $('<a></a>');
      $link.attr('href', 'consejo.html?id=' + advice.id);
      $link.text(safeTitle);
      $item.append($link);
      $list.append($item);
    });
  }

  function handleAdviceSubmit($form, author) {
    const $title = $('#adviceTitle');
    const $desc = $('#adviceDesc');

    clearFormErrors($form);

    const title = ($title.val() || '').trim();
    const desc = ($desc.val() || '').trim();
    const errors = [];

    if (title.length < 15) {
      errors.push('El título debe tener 15 caracteres mínimo.');
      markError($title, true);
    }

    if (desc.length < 30) {
      errors.push('La descripción tiene que tener 30 caracteres como poco.');
      markError($desc, true);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const advices = loadAdvices();
    const advice = {
      id: Date.now(),
      title: title,
      description: desc,
      author: author,
      createdAt: new Date().toISOString()
    };

    advices.unshift(advice);
    saveAdvices(advices);

    alert('Consejo guardado, gracias!');
    $form[0].reset();
    renderAdvices();
  }

  function initPurchase() {
    const $form = $('#compraForm');
    showPackFromHash();

    $(window).on('hashchange', function () {
      showPackFromHash();
    });

    $form.on('submit', function (evt) {
      evt.preventDefault();
      handlePurchase($form);
    });

    $form.on('reset', function () {
      clearFormErrors($form);
    });
  }

  function showPackFromHash() {
    const hash = window.location.hash || '#pack-peru';
    $('.pack_detail').removeClass('active');

    const $target = $(hash);
    if ($target.length > 0) {
      $target.addClass('active');
    } else {
      $('#pack-peru').addClass('active');
    }
  }

  function handlePurchase($form) {
    clearFormErrors($form);

    const name = ($('#purchaseName').val() || '').trim();
    const email = ($('#purchaseEmail').val() || '').trim();
    const cardType = $('#purchaseCardType').val();
    const cardNumber = ($('#purchaseNumber').val() || '').trim();
    const cardHolder = ($('#purchaseHolder').val() || '').trim();
    const expiry = $('#purchaseExpiry').val();
    const cvv = ($('#purchaseCVV').val() || '').trim();

    const errors = [];

    if (name.length < 3) {
      errors.push('El nombre completo debe tener al menos 3 caracteres.');
      markError($('#purchaseName'), true);
    }

    if (!isValidEmail(email)) {
      errors.push('El correo electrónico no es válido.');
      markError($('#purchaseEmail'), true);
    }

    if (!cardType) {
      errors.push('Selecciona el tipo de tarjeta.');
      markError($('#purchaseCardType'), true);
    }

    if (!/^\d{13}$|^\d{15}$|^\d{16}$|^\d{19}$/.test(cardNumber)) {
      errors.push('El número de tarjeta debe tener 13, 15, 16 o 19 dígitos.');
      markError($('#purchaseNumber'), true);
    }

    if (cardHolder.length < 3) {
      errors.push('El nombre del titular es muy corto.');
      markError($('#purchaseHolder'), true);
    }

    if (!isValidExpiry(expiry)) {
      errors.push('La tarjeta está caducada o la fecha no es correcta.');
      markError($('#purchaseExpiry'), true);
    }

    if (!/^\d{3}$/.test(cvv)) {
      errors.push('El CVV debe tener 3 dígitos.');
      markError($('#purchaseCVV'), true);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    alert('Compra realizada');
    $form[0].reset();
  }

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function isValidBirthDate(value) {
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const year = date.getFullYear();
    if (year < 1900) {
      return false;
    }

    const today = new Date();
    if (date > today) {
      return false;
    }

    return true;
  }

  function isValidPassword(password) {
    if (password.length < 8) {
      return false;
    }

    const digits = password.match(/\d/g) || [];
    const specials = password.match(/[^A-Za-z0-9]/g) || [];
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    return digits.length >= 2 && specials.length >= 1 && hasUpper && hasLower;
  }

  function isValidExpiry(value) {
    if (!value) {
      return false;
    }

    const parts = value.split('-');
    if (parts.length !== 2) {
      return false;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return false;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (year < currentYear) {
      return false;
    }

    if (year === currentYear && month < currentMonth) {
      return false;
    }

    return month >= 1 && month <= 12;
  }

  function clearFormErrors($form) {
    $form.find('.form_input').removeClass('error');
  }

  function markError($input, hasError) {
    if (!$input || $input.length === 0) {
      return;
    }
    if (hasError) {
      $input.addClass('error');
    } else {
      $input.removeClass('error');
    }
  }

  function loadUsers() {
    const raw = window.localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('users mal formateados, reseteo', error);
      return {};
    }
  }

  function saveUsers(users) {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  function setSession(login) {
    window.localStorage.setItem(STORAGE_KEYS.session, login);
  }

  function getSession() {
    return window.localStorage.getItem(STORAGE_KEYS.session);
  }

  function clearSession() {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  }

  function loadAdvices() {
    const raw = window.localStorage.getItem(STORAGE_KEYS.advices);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.warn('no pude leer los consejos', error);
      return [];
    }
  }

  function saveAdvices(entries) {
    window.localStorage.setItem(STORAGE_KEYS.advices, JSON.stringify(entries));
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, function (ch) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return map[ch] || ch;
    });
  }
})();
