let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const frete = 15.00;
const desconto = 10.00;

const els = {
    cartCount: document.getElementById('cart-count'),
    modalCarrinho: document.getElementById('modal-carrinho'),
    listaCarrinho: document.getElementById('lista-carrinho'),
    resumoTotal: document.getElementById('resumo-total'),
    modalCompra: document.getElementById('modal-compra')
};

document.addEventListener('DOMContentLoaded', () => {
    atualizarUI_Carrinho();
    setupGlobalListeners();

    if (document.getElementById('produtos-container')) {
        initHome();
        initMap();
    }
    if (document.getElementById('detalhe-produto-container')) {
        initDetalhes();
    }
});

function initHome() {
    let skip = 0;
    const container = document.getElementById('produtos-container');

    const carregar = () => {
        fetch(`https://dummyjson.com/products?limit=8&skip=${skip}`)
            .then(r => r.json())
            .then(data => {
                data.products.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.innerHTML = `
                        <a href="produto.html?id=${p.id}">
                            <img src="${p.thumbnail}" loading="lazy">
                            <h2>${p.title}</h2>
                        </a>
                        <p class="price">R$ ${p.price.toFixed(2)}</p>
                        <button class="btn" onclick="addAoCarrinho(${p.id}, '${p.title}', ${p.price}, '${p.thumbnail}')">Adicionar</button>
                    `;
                    container.appendChild(div);
                });
                skip += 8;
            });
    };
    carregar();
    document.getElementById('btn-carregar')?.addEventListener('click', carregar);
}

function initMap() {
    const btnGeo = document.getElementById('btn-geo');
    const defaultLat = -23.5505;
    const defaultLng = -46.6333;

    if (!document.getElementById('map')) return;

    const map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([defaultLat, defaultLng]).addTo(map)
        .bindPopup('Nossa Loja Matriz')
        .openPopup();

    btnGeo.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }

        btnGeo.innerText = "Localizando...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 15);

                L.marker([lat, lng]).addTo(map)
                    .bindPopup('📍 Você está aqui!')
                    .openPopup();

                btnGeo.innerText = "Localização Encontrada!";
            },
            (error) => {
                console.error(error);
                alert("Erro ao obter localização. Verifique as permissões.");
                btnGeo.innerText = "Tentar Novamente";
            }
        );
    });
}

function initDetalhes() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    fetch(`https://dummyjson.com/products/${id}`)
        .then(r => r.json())
        .then(p => {
            document.title = p.title;
            document.getElementById('main-product-image').src = p.thumbnail;
            document.getElementById('product-name').innerText = p.title;
            document.getElementById('product-price').innerText = `R$ ${p.price.toFixed(2)}`;
            document.getElementById('product-description').innerText = p.description;

            const galeria = document.querySelector('.thumbnail-gallery');
            if (p.images) {
                p.images.slice(0, 4).forEach(img => {
                    galeria.innerHTML += `<img src="${img}" onclick="document.getElementById('main-product-image').src='${img}'">`;
                });
            }

            document.getElementById('btn-add-carrinho').onclick = () => {
                const qtd = parseInt(document.getElementById('quantity-input').value);
                for (let i = 0; i < qtd; i++) addAoCarrinho(p.id, p.title, p.price, p.thumbnail);
                alert('Produto adicionado!');
            };

            compararProduto(p);
        });

    const input = document.getElementById('quantity-input');
    document.getElementById('btn-diminuir').onclick = () => { if (input.value > 1) input.value--; };
    document.getElementById('btn-aumentar').onclick = () => input.value++;
}

function compararProduto(produtoAtual) {
    const randomId = Math.floor(Math.random() * 30) + 1;
    fetch(`https://dummyjson.com/products/${randomId}`)
        .then(r => r.json())
        .then(produtoComparacao => {
            renderChart(produtoAtual, produtoComparacao);
        });
}

function renderChart(p1, p2) {
    const ctx = document.getElementById('graficoProduto');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Preço ($)', 'Nota (0-5)', 'Estoque', 'Desconto (%)'],
            datasets: [
                {
                    label: p1.title,
                    data: [p1.price, p1.rating, p1.stock, p1.discountPercentage],
                    backgroundColor: 'rgba(17, 68, 179, 0.7)',
                    borderColor: '#1144b3',
                    borderWidth: 1
                },
                {
                    label: p2.title,
                    data: [p2.price, p2.rating, p2.stock, p2.discountPercentage],
                    backgroundColor: 'rgba(56, 102, 65, 0.7)',
                    borderColor: '#386641',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Comparativo de Especificações' }
            }
        }
    });
}

window.addAoCarrinho = (id, title, price, img) => {
    carrinho.push({ id, title, price, img });
    salvarCarrinho();
};

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarUI_Carrinho();
}

function atualizarUI_Carrinho() {
    if (els.cartCount) els.cartCount.innerText = carrinho.length;
    if (!els.listaCarrinho) return;

    els.listaCarrinho.innerHTML = '';
    let subtotal = 0;

    carrinho.forEach((item, idx) => {
        subtotal += item.price;
        els.listaCarrinho.innerHTML += `
            <div class="item-carrinho">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.img}" style="width:40px; height:40px; object-fit:cover;">
                    <div>${item.title}<br><b>R$ ${item.price.toFixed(2)}</b></div>
                </div>
                <button style="background:red; color:white; border:none; cursor:pointer;" onclick="removerItem(${idx})">X</button>
            </div>`;
    });

    const total = Math.max(0, subtotal + frete - desconto);
    if (document.getElementById('resumo-subtotal')) document.getElementById('resumo-subtotal').innerText = `R$ ${subtotal.toFixed(2)}`;
    if (els.resumoTotal) els.resumoTotal.innerText = `R$ ${total.toFixed(2)}`;
}

window.removerItem = (idx) => {
    carrinho.splice(idx, 1);
    salvarCarrinho();
};

function setupGlobalListeners() {
    const btnCart = document.getElementById('btn-carrinho');
    if (btnCart) btnCart.onclick = () => els.modalCarrinho.style.display = 'block';

    document.querySelectorAll('.close, .close-carrinho').forEach(el =>
        el.onclick = () => el.closest('.modal').style.display = 'none'
    );

    window.onclick = (e) => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

    document.getElementById('btn-finalizar')?.addEventListener('click', () => {
        if (!carrinho.length) return alert('Carrinho vazio');
        els.modalCarrinho.style.display = 'none';
        els.modalCompra.style.display = 'block';
        document.getElementById('qrcode').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PagamentoEcom${Date.now()}`;
        carrinho = [];
        salvarCarrinho();
    });
}