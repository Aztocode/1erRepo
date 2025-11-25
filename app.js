const cartaRegistro = document.getElementById('carta-registro')
const cartaOrden = document.getElementById('carta-orden')
const formRegistro = document.getElementById('form-registro')
const formOrden = document.getElementById('form-orden')
const mostrarCliente = document.getElementById('mostrar-cliente')
const cartasMenu = document.querySelectorAll('.carta-menu')
const menuSeleccion = document.getElementById('menu-seleccion')
const listaCola = document.getElementById('lista-cola')
const ordenActualEl = document.getElementById('orden-actual')
const registroFactura = document.getElementById('registro-factura')

let contadorOrden = 1
let clienteActivo = null
const colaOrdenes = []
let ordenProcesando = null

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
})

function parsearPrecio(valor) {
    if (typeof valor !== 'string') return 0
    const limpio = valor.replace(/\./g, '').replace(/[^\d]/g, '')
    return Number(limpio || 0)
}

function mostrarCartaOrden() {
    cartaRegistro.classList.add('carta-oculta')
    cartaOrden.classList.remove('carta-oculta')
    cartaOrden.scrollIntoView({ behavior: 'smooth' })
}

function mostrarCartaRegistro() {
    cartaRegistro.classList.remove('carta-oculta')
    cartaOrden.classList.add('carta-oculta')
    cartaRegistro.scrollIntoView({ behavior: 'smooth' })
}

formRegistro.addEventListener('submit', (event) => {
    event.preventDefault()
    const nombre = formRegistro['nombre-cliente']?.value.trim()
    const email = formRegistro['email-cliente']?.value.trim()
    if (!nombre || !email) return
    clienteActivo = { nombre, email }
    mostrarCliente.textContent = nombre
    mostrarCartaOrden()
})

cartasMenu.forEach((carta) => {
    carta.addEventListener('click', () => {
        cartasMenu.forEach((item) => item.classList.remove('selected'))
        carta.classList.add('selected')
        menuSeleccion.value = carta.dataset.value
        menuSeleccion.dataset.name = carta.dataset.name
        menuSeleccion.dataset.price = carta.dataset.price
    })
})

formOrden.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!clienteActivo) return
    if (!menuSeleccion.value) {
        alert('Selecciona un menú antes de continuar.')
        return
    }

    const orden = {
        id: contadorOrden++,
        cliente: { ...clienteActivo },
        menuId: menuSeleccion.value,
        menuNombre: menuSeleccion.dataset.name,
        precio: parsearPrecio(menuSeleccion.dataset.price)
    }

    encolarOrden(orden)

    const payload = {
        nombre: orden.cliente.nombre,
        email: orden.cliente.email,
        menu: orden.menuNombre,
        precio: orden.precio
    }

    fetch('http://localhost:4000/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => console.log('Pedido enviado al backend:', data))
        .catch(err => console.error('Error enviando pedido:', err))

    reiniciarARegistro()
})

function encolarOrden(orden) {
    colaOrdenes.push(orden)
    actualizarCola()
    procesarCola()
}

function procesarCola() {
    if (ordenProcesando || colaOrdenes.length === 0) return
    ordenProcesando = colaOrdenes.shift()
    actualizarCola()
    ordenActualEl.textContent =
        `Preparando pedido #${ordenProcesando.id} para ${ordenProcesando.cliente.nombre} (${ordenProcesando.menuNombre})...`
    setTimeout(() => {
        const numeroFactura = `FF-${String(ordenProcesando.id).padStart(4, '0')}`
        const li = document.createElement('li')
        li.innerHTML =
            `Factura <strong>${numeroFactura}</strong> enviada a <strong>${ordenProcesando.cliente.email}</strong> por el pedido <em>${ordenProcesando.menuNombre}</em> (${formatoCOP.format(ordenProcesando.precio)}).`
        registroFactura.prepend(li)
        ordenActualEl.textContent = 'No hay pedidos en procesamiento.'
        ordenProcesando = null
        procesarCola()
    }, 15000)
}

function actualizarCola() {
    if (colaOrdenes.length === 0) {
        listaCola.innerHTML = '<p>No hay pedidos en espera.</p>'
        return
    }
    const fragment = document.createDocumentFragment()
    colaOrdenes.forEach((orden, index) => {
        const div = document.createElement('div')
        div.className = 'queue-item'
        div.innerHTML = `
            <div class="badge">#${orden.id}</div>
            <div><strong>${orden.cliente.nombre}</strong> - ${orden.menuNombre}</div>
            <small>Turno en cola: ${index + 1}</small>
        `
        fragment.appendChild(div)
    })
    listaCola.innerHTML = ''
    listaCola.appendChild(fragment)
}

function reiniciarARegistro() {
    formRegistro.reset()
    formOrden.reset()
    menuSeleccion.value = ''
    delete menuSeleccion.dataset.name
    delete menuSeleccion.dataset.price
    cartasMenu.forEach((c) => c.classList.remove('selected'))
    clienteActivo = null
    mostrarCartaRegistro()
}