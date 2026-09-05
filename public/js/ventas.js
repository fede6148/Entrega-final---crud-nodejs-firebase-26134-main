// public/js/ventas.js
// Pantalla para armar una venta con varios productos (carrito),
// registrarla, y ver el historial reciente con acceso al ticket.

const money = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value || 0);

const fechaCorta = (fechaISO) =>
  new Date(fechaISO.replace(' ', 'T') + 'Z').toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const selectProducto = document.getElementById('venta-producto');
const inputCantidad = document.getElementById('venta-cantidad');
const stockHint = document.getElementById('stock-hint');
const agregarBtn = document.getElementById('agregar-btn');
const registrarBtn = document.getElementById('registrar-btn');
const vaciarBtn = document.getElementById('vaciar-btn');
const formFeedback = document.getElementById('form-feedback');

const carritoVacio = document.getElementById('carrito-vacio');
const carritoWrap = document.getElementById('carrito-wrap');
const carritoTbody = document.getElementById('carrito-tbody');
const carritoTotal = document.getElementById('carrito-total');

const tablaLoading = document.getElementById('tabla-loading');
const tablaError = document.getElementById('tabla-error');
const tablaVacia = document.getElementById('tabla-vacia');
const ventasLista = document.getElementById('ventas-lista');

// Mapa id -> producto, para no repreguntarle a la API en cada tecla
let productosPorId = {};

// El carrito de la venta que se está armando: [{ productId, quantity }]
let carrito = [];

const mostrarFeedback = (mensaje, tipo) => {
  formFeedback.textContent = mensaje;
  formFeedback.className = `feedback feedback--${tipo}`;
  formFeedback.hidden = false;
};

const ocultarFeedback = () => {
  formFeedback.hidden = true;
};

const etiquetaProducto = (producto) => {
  const variante = [producto.size, producto.color].filter(Boolean).join(' / ');
  return variante ? `${producto.name} (${variante})` : producto.name;
};

const actualizarHintStock = () => {
  const producto = productosPorId[selectProducto.value];
  stockHint.textContent = producto
    ? `Stock disponible: ${producto.stock} unidad(es) — ${money(producto.price)} c/u`
    : '';
};

const cargarProductosEnSelect = async () => {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Respuesta no exitosa');

    const productos = await res.json();
    productosPorId = Object.fromEntries(productos.map((p) => [p.id, p]));

    const seleccionActual = selectProducto.value;
    selectProducto.innerHTML = '<option value="" disabled>Elegí un producto…</option>';

    for (const producto of productos) {
      const option = document.createElement('option');
      option.value = producto.id;
      option.textContent = `${etiquetaProducto(producto)} — stock: ${producto.stock}`;
      if (producto.stock === 0) {
        option.disabled = true;
        option.textContent += ' — sin stock';
      }
      selectProducto.appendChild(option);
    }

    if (seleccionActual && productosPorId[seleccionActual]) {
      selectProducto.value = seleccionActual;
    } else {
      selectProducto.selectedIndex = 0;
    }

    actualizarHintStock();

  } catch (error) {
    console.error('Error cargando productos:', error);
    mostrarFeedback('No se pudieron cargar los productos disponibles.', 'error');
  }
};

// Cuánto de un producto ya está puesto en el carrito (para no dejar
// agregar más de lo que hay en stock entre varias líneas)
const cantidadEnCarrito = (productId) =>
  carrito
    .filter((item) => item.productId === productId)
    .reduce((acc, item) => acc + item.quantity, 0);

const renderCarrito = () => {
  registrarBtn.disabled = carrito.length === 0;

  if (carrito.length === 0) {
    carritoVacio.hidden = false;
    carritoWrap.hidden = true;
    carritoTotal.textContent = money(0);
    return;
  }

  carritoVacio.hidden = true;
  carritoWrap.hidden = false;
  carritoTbody.innerHTML = '';

  let total = 0;

  carrito.forEach((item, index) => {
    const producto = productosPorId[item.productId];
    const subtotal = producto.price * item.quantity;
    total += subtotal;

    const tr = document.createElement('tr');

    const tdProducto = document.createElement('td');
    tdProducto.textContent = etiquetaProducto(producto);

    const tdCantidad = document.createElement('td');
    tdCantidad.textContent = item.quantity;

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = money(producto.price);

    const tdSubtotal = document.createElement('td');
    tdSubtotal.textContent = money(subtotal);

    const tdQuitar = document.createElement('td');
    const btnQuitar = document.createElement('button');
    btnQuitar.type = 'button';
    btnQuitar.className = 'icon-btn icon-btn--danger';
    btnQuitar.textContent = 'Quitar';
    btnQuitar.addEventListener('click', () => {
      carrito.splice(index, 1);
      renderCarrito();
    });
    tdQuitar.appendChild(btnQuitar);

    tr.appendChild(tdProducto);
    tr.appendChild(tdCantidad);
    tr.appendChild(tdPrecio);
    tr.appendChild(tdSubtotal);
    tr.appendChild(tdQuitar);

    carritoTbody.appendChild(tr);
  });

  carritoTotal.textContent = money(total);
};

agregarBtn.addEventListener('click', () => {
  ocultarFeedback();

  const productId = Number(selectProducto.value);
  const quantity = Number(inputCantidad.value);
  const producto = productosPorId[productId];

  if (!productId || !producto) {
    mostrarFeedback('Elegí un producto para agregar.', 'error');
    return;
  }

  if (!quantity || quantity <= 0) {
    mostrarFeedback('La cantidad tiene que ser mayor a 0.', 'error');
    return;
  }

  const yaEnCarrito = cantidadEnCarrito(productId);

  if (yaEnCarrito + quantity > producto.stock) {
    mostrarFeedback(
      `No hay suficiente stock de "${producto.name}" (disponible: ${producto.stock}, ya tenés ${yaEnCarrito} en la venta).`,
      'error'
    );
    return;
  }

  const existente = carrito.find((item) => item.productId === productId);
  if (existente) {
    existente.quantity += quantity;
  } else {
    carrito.push({ productId, quantity });
  }

  inputCantidad.value = 1;
  renderCarrito();
});

vaciarBtn.addEventListener('click', () => {
  carrito = [];
  renderCarrito();
  ocultarFeedback();
});

selectProducto.addEventListener('change', actualizarHintStock);

const renderVentas = (ventas) => {
  tablaLoading.hidden = true;
  tablaError.hidden = true;

  if (ventas.length === 0) {
    ventasLista.innerHTML = '';
    tablaVacia.hidden = false;
    return;
  }

  tablaVacia.hidden = true;
  ventasLista.innerHTML = '';

  for (const venta of ventas.slice(0, 10)) {
    const card = document.createElement('div');
    card.className = 'venta-card';

    const header = document.createElement('div');
    header.className = 'venta-card__header';

    const info = document.createElement('span');
    info.innerHTML = `<strong>Venta #${venta.id}</strong> — ${fechaCorta(venta.createdAt)}`;

    const total = document.createElement('span');
    total.className = 'venta-card__total';
    total.textContent = money(venta.total);

    header.appendChild(info);
    header.appendChild(total);

    const items = document.createElement('ul');
    items.className = 'venta-card__items';

    for (const item of venta.items) {
      const li = document.createElement('li');
      const variante = [item.productSize, item.productColor].filter(Boolean).join(' / ');
      const nombre = variante ? `${item.productName} (${variante})` : item.productName;
      li.textContent = `${item.quantity} × ${nombre}`;
      items.appendChild(li);
    }

    const ticketLink = document.createElement('a');
    ticketLink.href = `/ticket.html?venta=${venta.id}`;
    ticketLink.target = '_blank';
    ticketLink.className = 'icon-btn';
    ticketLink.style.marginTop = '10px';
    ticketLink.style.display = 'inline-block';
    ticketLink.textContent = 'Ver ticket';

    card.appendChild(header);
    card.appendChild(items);
    card.appendChild(ticketLink);
    ventasLista.appendChild(card);
  }
};

const cargarVentas = async () => {
  tablaLoading.hidden = false;
  tablaError.hidden = true;

  try {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error('Respuesta no exitosa');

    const ventas = await res.json();
    renderVentas(ventas);

  } catch (error) {
    console.error('Error cargando ventas:', error);
    tablaLoading.hidden = true;
    tablaError.hidden = false;
  }
};

registrarBtn.addEventListener('click', async () => {
  ocultarFeedback();

  if (carrito.length === 0) {
    mostrarFeedback('Agregá al menos un producto antes de registrar la venta.', 'error');
    return;
  }

  registrarBtn.disabled = true;

  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: carrito })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarFeedback(data.error || 'No se pudo registrar la venta.', 'error');
      return;
    }

    formFeedback.innerHTML = '';
    formFeedback.className = 'feedback feedback--ok';
    formFeedback.hidden = false;
    formFeedback.textContent = `Venta #${data.id} registrada por ${money(data.total)}. `;

    const linkTicket = document.createElement('a');
    linkTicket.href = `/ticket.html?venta=${data.id}`;
    linkTicket.target = '_blank';
    linkTicket.textContent = 'Ver / imprimir ticket';
    linkTicket.style.fontWeight = '700';
    formFeedback.appendChild(linkTicket);

    carrito = [];
    renderCarrito();
    await cargarProductosEnSelect();
    cargarVentas();

  } catch (error) {
    console.error('Error registrando venta:', error);
    mostrarFeedback('No se pudo conectar con el servidor.', 'error');
  } finally {
    registrarBtn.disabled = carrito.length === 0;
  }
});

cargarProductosEnSelect();
cargarVentas();
renderCarrito();
