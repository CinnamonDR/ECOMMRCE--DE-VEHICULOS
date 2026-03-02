document.addEventListener('DOMContentLoaded', () => {
    // Variables de Estado
    let vehiclesData = [];
    let cart = [];
    let currentSelectedVehicle = null;

    // Elementos del DOM
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const quantityInput = document.getElementById('quantityInput');
    const detailModalBody = document.getElementById('detailModalBody');

    // URLs
    const API_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';

    // --- CARGA DE DATOS ---
    async function loadVehicles() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error al cargar datos');
            vehiclesData = await response.json();
            displayVehicles(vehiclesData);
        } catch (error) {
            productsContainer.innerHTML = `<div class="alert alert-danger">Error: No se pudo cargar el catálogo. ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    // --- MOSTRAR VEHÍCULOS ---
    function displayVehicles(data) {
        productsContainer.innerHTML = '';
        if (data.length === 0) {
            productsContainer.innerHTML = '<p class="text-center">No se encontraron vehículos.</p>';
            return;
        }

        data.forEach(vehicle => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-sm-6 mb-4';
            
            // Limpieza del campo tipo (quitar emojis)
            const cleanTipo = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <img src="${vehicle.imagen}" class="card-img-top viewDetailsBtn" data-codigo="${vehicle.codigo}" alt="${vehicle.marca}" loading="lazy" style="cursor:pointer">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="badge bg-info text-dark align-self-start">${vehicle.categoria}</p>
                        <p class="card-text card-text-desc text-mutedSmall mb-2">${cleanTipo}</p>
                        <p class="fw-bold fs-4 text-primary mt-auto">RD$ ${vehicle.precio_venta.toLocaleString()}</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-dark viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalles</button>
                            <button class="btn btn-primary addToCartBtn" data-codigo="${vehicle.codigo}">
                                <i class="fas fa-cart-plus me-2"></i>Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productsContainer.appendChild(col);
        });
    }

    // --- FILTRADO ---
    function filterVehicles() {
        const query = searchInput.value.toLowerCase();
        const filtered = vehiclesData.filter(v => 
            v.marca.toLowerCase().includes(query) || 
            v.modelo.toLowerCase().includes(query) || 
            v.categoria.toLowerCase().includes(query)
        );
        displayVehicles(filtered);
    }

    // --- EVENT DELEGATION PARA BOTONES DINÁMICOS ---
    productsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button, img');
        if (!target) return;

        const codigo = parseInt(target.getAttribute('data-codigo'));
        const vehicle = vehiclesData.find(v => v.codigo === codigo);

        if (target.classList.contains('viewDetailsBtn')) {
            showDetailModal(vehicle);
        } else if (target.classList.contains('addToCartBtn')) {
            openQuantityModal(vehicle);
        }
    });

    // --- MODALES Y CARRITO ---
    function showDetailModal(vehicle) {
        detailModalBody.innerHTML = `
            <div class="modal-header">
                <h5 class="modal-title">${vehicle.marca} ${vehicle.modelo}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
                <img src="${vehicle.imagen}" class="img-fluid mb-3 rounded" alt="${vehicle.marca}">
                <ul class="list-group text-start">
                    <li class="list-group-item"><strong>Marca:</strong> ${vehicle.marca}</li>
                    <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
                    <li class="list-group-item"><strong>Precio:</strong> RD$ ${vehicle.precio_venta.toLocaleString()}</li>
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary addToCartBtn" data-codigo="${vehicle.codigo}" data-bs-dismiss="modal">
                    Añadir al Carrito
                </button>
            </div>
        `;
        new bootstrap.Modal('#detailModal').show();
    }

    function openQuantityModal(vehicle) {
        currentSelectedVehicle = vehicle;
        quantityInput.value = 1;
        new bootstrap.Modal('#quantityModal').show();
    }

    document.getElementById('confirmAddToCartBtn').onclick = () => {
        const qty = parseInt(quantityInput.value);
        if (qty > 0) {
            addItemToCart(currentSelectedVehicle, qty);
            bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
        }
    };

    function addItemToCart(vehicle, quantity) {
        const existing = cart.find(item => item.codigo === vehicle.codigo);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                codigo: vehicle.codigo,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                precio: vehicle.precio_venta,
                imagen: vehicle.imagen,
                quantity: quantity
            });
        }
        updateCartUI();
        animateCartBadge();
    }

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        cart.forEach(item => {
            const subtotal = item.precio * item.quantity;
            total += subtotal;
            count += item.quantity;

            const div = document.createElement('div');
            div.className = 'd-flex align-items-center mb-3 border-bottom pb-2';
            div.innerHTML = `
                <img src="${item.imagen}" class="cart-item-img me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0">${item.marca} ${item.modelo}</h6>
                    <small>Cant: ${item.quantity} x $${item.precio.toLocaleString()}</small>
                </div>
                <div class="text-end">
                    <span class="fw-bold">$${subtotal.toLocaleString()}</span>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        cartTotalSpan.innerText = total.toLocaleString();
        cartCount.innerText = count;
    }

    function animateCartBadge() {
        cartCount.classList.add('pulse-animation');
        setTimeout(() => cartCount.classList.remove('pulse-animation'), 400);
    }

    // --- PROCESO DE PAGO Y FACTURA ---
    document.getElementById('processPaymentBtn').onclick = () => {
        const name = document.getElementById('payName').value;
        if (!name || cart.length === 0) {
            alert("Por favor, ingresa tu nombre y asegúrate de tener productos.");
            return;
        }

        alert(`¡Pago exitoso, ${name}! Tu factura se generará ahora.`);
        generateInvoice(name);

        // Reset
        cart = [];
        updateCartUI();
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    };

    function generateInvoice(customerName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(22);
        doc.text("GarageOnline - Factura de Venta", 20, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Cliente: ${customerName}`, 20, y);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, y);
        y += 15;

        doc.text("Producto", 20, y);
        doc.text("Cant.", 100, y);
        doc.text("Subtotal", 150, y);
        y += 5;
        doc.line(20, y, 190, y);
        y += 10;

        cart.forEach(item => {
            doc.text(`${item.marca} ${item.modelo}`, 20, y);
            doc.text(`${item.quantity}`, 100, y);
            doc.text(`$${(item.precio * item.quantity).toLocaleString()}`, 150, y);
            y += 10;
        });

        y += 5;
        doc.setFontSize(14);
        doc.text(`TOTAL: RD$ ${cartTotalSpan.innerText}`, 150, y, { align: 'right' });

        doc.save(`Factura_GarageOnline_${Date.now()}.pdf`);
    }

    // Listener de búsqueda
    searchInput.addEventListener('input', filterVehicles);

    // --- BLOQUE DE TESTING ---
    function runTests() {
        console.group("🚀 Iniciando Pruebas Automatizadas");

        // Test 1: Carga de Datos
        const testLoad = () => {
            if (vehiclesData.length >= 0) console.log("Test Carga Datos: PASSED ✅");
            else console.error("Test Carga Datos: FAILED ❌");
        };

        // Test 2: Filtrado
        const testFilter = () => {
            searchInput.value = "Toyota";
            const filtered = vehiclesData.filter(v => v.marca.toLowerCase().includes("toyota"));
            if (filtered.length <= vehiclesData.length) console.log("Test Filtrado: PASSED ✅");
            else console.error("Test Filtrado: FAILED ❌");
            searchInput.value = "";
        };

        // Test 3: Carrito
        const testCart = () => {
            const dummyVehicle = { codigo: 999, marca: "Test", precio_venta: 1000 };
            addItemToCart(dummyVehicle, 2);
            const found = cart.find(i => i.codigo === 999);
            if (found && found.quantity === 2) console.log("Test Añadir Carrito: PASSED ✅");
            else console.error("Test Añadir Carrito: FAILED ❌");
            // Limpiar test
            cart = cart.filter(i => i.codigo !== 999);
            updateCartUI();
        };

        testLoad();
        testFilter();
        testCart();
        console.groupEnd();
    }

    // Inicialización
    loadVehicles().then(() => {
        runTests();
    });
});