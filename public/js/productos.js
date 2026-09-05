// public/js/productos.js
// Pantalla de gestión de productos: lista, alta, edición y baja.

const money = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value || 0);

const form = document.getElementById('producto-form');
const idInput = document.getElementById('producto-id');
const nombreInput = document.getElementById('producto-nombre');
const precioInput = document.getElementById('producto-precio');
const stockInput = document.getElementById('producto-stock');
const categoriaInput = document.getElementById('producto-categoria');
const talleInput = document.getElementById('producto-talle');
const colorInput = document.getElementById('producto-color');
const descripcionInput = document.getElementById('producto-descripcion');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formFeedback = document.getElementById('form-feedback');

const tbody = document.getElementById('productos-tbody');
const tablaLoading = document.getElementById('tabla-loading');
const tablaError = document.getElementById('tabla-error');
const tablaWrap = document.getElementById('tabla-wrap');
const tablaVacia = document.getElementById('tabla-vacia');

const mostrarFeedback = (mensaje, tipo) => {
  formFeedback.textContent = mensaje;
  formFeedback.className = `feedback feedback--${tipo}`;
  formFeedback.hidden = false;
};

const ocultarFeedback = () => {
  formFeedback.hidden = true;
};

const resetForm = () => {
  form.reset();
  idInput.value = '';
  formTitle.textContent = 'Nuevo producto';
  submitBtn.textContent = 'Guardar producto';
  cancelBtn.hidden = true;
};

const cargarProductoEnForm = (producto) => {
  idInput.value = producto.id;
  nombreInput.value = producto.name;
  precioInput.value = producto.price;
  stockInput.value = producto.stock;
  categoriaInput.value = producto.category || '';
  talleInput.value = producto.size || '';
  colorInput.value = producto.color || '';
  descripcionInput.value = producto.description || '';
  formTitle.textContent = `Editando: ${producto.name}`;
  submitBtn.textContent = 'Guardar cambios';
  cancelBtn.hidden = false;
  ocultarFeedback();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const renderTabla = (productos) => {
  tablaLoading.hidden = true;
  tablaError.hidden = true;

  if (productos.length === 0) {
    tablaWrap.hidden = true;
    tablaVacia.hidden = false;
    return;
  }

  tablaVacia.hidden = true;
  tablaWrap.hidden = false;

  tbody.innerHTML = '';

  for (const producto of productos) {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.textContent = producto.name;

    const tdCategoria = document.createElement('td');
    tdCategoria.textContent = producto.category || '—';

    const tdTalle = document.createElement('td');
    tdTalle.textContent = producto.size || '—';

    const tdColor = document.createElement('td');
    tdColor.textContent = producto.color || '—';

    const tdDescripcion = document.createElement('td');
    tdDescripcion.textContent = producto.description || '—';

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = money(producto.price);

    const tdStock = document.createElement('td');
    tdStock.textContent = producto.stock;

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'table-actions';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'icon-btn';
    btnEditar.type = 'button';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => cargarProductoEnForm(producto));

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'icon-btn icon-btn--danger';
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => eliminarProducto(producto));

    tdAcciones.appendChild(btnEditar);
    tdAcciones.appendChild(btnEliminar);

    tr.appendChild(tdNombre);
    tr.appendChild(tdCategoria);
    tr.appendChild(tdTalle);
    tr.appendChild(tdColor);
    tr.appendChild(tdDescripcion);
    tr.appendChild(tdPrecio);
    tr.appendChild(tdStock);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  }
};

const cargarProductos = async () => {
  tablaLoading.hidden = false;
  tablaError.hidden = true;
  tablaWrap.hidden = true;
  tablaVacia.hidden = true;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Respuesta no exitosa');

    const productos = await res.json();
    renderTabla(productos);

  } catch (error) {
    console.error('Error cargando productos:', error);
    tablaLoading.hidden = true;
    tablaError.hidden = false;
  }
};

const eliminarProducto = async (producto) => {
  const confirmado = confirm(`¿Eliminar "${producto.name}"? Esta acción no se puede deshacer.`);
  if (!confirmado) return;

  try {
    const res = await fetch(`/api/products/${producto.id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo eliminar el producto.');
      return;
    }

    cargarProductos();

  } catch (error) {
    console.error('Error eliminando producto:', error);
    alert('No se pudo conectar con el servidor.');
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  ocultarFeedback();

  const id = idInput.value;
  const payload = {
    name: nombreInput.value.trim(),
    price: Number(precioInput.value),
    stock: Number(stockInput.value),
    category: categoriaInput.value || null,
    size: talleInput.value.trim() || null,
    color: colorInput.value.trim() || null,
    description: descripcionInput.value.trim() || null
  };

  const esEdicion = Boolean(id);
  const url = esEdicion ? `/api/products/${id}` : '/api/products';
  const method = esEdicion ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarFeedback(data.error || 'No se pudo guardar el producto', 'error');
      return;
    }

    mostrarFeedback(
      esEdicion ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
      'ok'
    );
    resetForm();
    cargarProductos();

  } catch (error) {
    console.error('Error guardando producto:', error);
    mostrarFeedback('No se pudo conectar con el servidor.', 'error');
  }
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  ocultarFeedback();
});

cargarProductos();
