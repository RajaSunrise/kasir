let allProducts = [];
let cart = {};

document.addEventListener("DOMContentLoaded", async function () {
    await loadInitialData();
    setupAutocomplete();
    document.getElementById('uang_tunai').addEventListener('input', updateKembalian);
});

async function loadInitialData() {
    try {
        const response = await fetch('/api/produk/');
        if (!response.ok) throw new Error('Gagal mengambil daftar produk.');

        allProducts = await response.json();
        renderProductList();

    } catch (error) {
        console.error('Error fetching initial data:', error);
        showToast(error.message, 'error');
        const productContainer = document.getElementById('product-list-container');
        if (productContainer) {
            productContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }
}

function renderProductList() {
    const container = document.getElementById('product-list-container');
    container.innerHTML = '';

    if (allProducts.length === 0) {
        container.innerHTML = '<p>Tidak ada produk di database.</p>';
        return;
    }

    allProducts.forEach(produk => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addProductToCart(produk.kode);

        card.innerHTML = `
            <div class="product-card-name" title="${produk.nama}">${produk.nama}</div>
            <div class="product-card-price">${formatRupiah(produk.harga)}</div>
            <div class="product-card-stock">Stok: ${produk.jumlah}</div>
        `;
        container.appendChild(card);
    });
}

function addProductToCart(productCode, quantity = 1) {
    const produk = allProducts.find(p => p.kode === productCode);

    if (!produk) {
        showToast('Produk tidak valid!', 'error');
        return;
    }

    const currentQuantityInCart = cart[produk.kode] ? cart[produk.kode].quantity : 0;
    if (produk.jumlah < currentQuantityInCart + quantity) {
        showToast(`Stok '${produk.nama}' tidak mencukupi! Sisa: ${produk.jumlah}`, 'error');
        return;
    }

    if (cart[produk.kode]) {
        cart[produk.kode].quantity += quantity;
    } else {
        cart[produk.kode] = { data: produk, quantity: quantity };
    }

    renderCart();
    showToast(`${produk.nama} ditambahkan ke keranjang`, 'info');
}

function tambahBarang() {
    const namaBarang = document.getElementById('nama_barang').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);

    if (!namaBarang || isNaN(jumlah) || jumlah <= 0) {
        showToast('Pilih nama barang dan masukkan jumlah yang valid!', 'error');
        return;
    }

    const produk = allProducts.find(p => p.nama === namaBarang);
    if (produk) {
        addProductToCart(produk.kode, jumlah);
        document.getElementById('nama_barang').value = '';
        document.getElementById('jumlah').value = '1';
    } else {
        showToast('Produk tidak ditemukan. Pilih dari daftar atau autocomplete.', 'error');
    }
}

function setupAutocomplete() {
    const namaBarangInput = document.getElementById('nama_barang');
    const suggestionsContainer = document.getElementById('suggestions');
    const productNames = allProducts.map(p => p.nama);

    namaBarangInput.addEventListener('input', function () {
        const input = namaBarangInput.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (input.length > 0) {
            const filteredNames = productNames.filter(name => name.toLowerCase().includes(input));
            filteredNames.forEach(name => {
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = name;
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.onclick = function () {
                    namaBarangInput.value = name;
                    suggestionsContainer.style.display = 'none';
                };
                suggestionsContainer.appendChild(suggestionItem);
            });
            suggestionsContainer.style.display = filteredNames.length > 0 ? 'block' : 'none';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!namaBarangInput.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

function renderCart() {
    const tbody = document.getElementById('tabel_keranjang').querySelector('tbody');
    tbody.innerHTML = '';
    let total = 0;

    if (Object.keys(cart).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Keranjang kosong</td></tr>';
    } else {
        for (const kode in cart) {
            const item = cart[kode];
            const subtotal = item.data.harga * item.quantity;
            total += subtotal;

            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.data.nama}</td>
                <td>${item.quantity}</td>
                <td>${formatRupiah(subtotal)}</td>
                <td><button onclick="hapusBarang('${kode}')" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></td>
            `;
        }
    }

    document.getElementById('total').textContent = formatRupiah(total);
    updateKembalian();
}

function hapusBarang(kode) {
    delete cart[kode];
    renderCart();
}

function updateKembalian() {
    const totalText = document.getElementById('total').textContent.replace(/[^0-9]/g, '');
    const totalBelanja = parseInt(totalText) || 0;
    const uangTunai = parseInt(document.getElementById('uang_tunai').value) || 0;
    const kembalian = uangTunai - totalBelanja;

    document.getElementById('kembalian').textContent = formatRupiah(Math.max(0, kembalian));
}

async function prosesPembayaran() {
    if (Object.keys(cart).length === 0) {
        showToast('Keranjang belanja kosong!', 'error'); return;
    }

    const totalText = document.getElementById('total').textContent.replace(/[^0-9]/g, '');
    const totalBelanja = parseInt(totalText) || 0;
    const uangTunai = parseInt(document.getElementById('uang_tunai').value) || 0;

    if (uangTunai < totalBelanja) {
        showToast('Uang tunai tidak cukup!', 'error'); return;
    }

    const payload = {
        metode_pembayaran: 'tunai',
        produk_items: Object.values(cart).map(item => ({
            produk_id: item.data.kode,
            quantity: item.quantity
        }))
    };

    const prosesBtn = document.querySelector('button[onclick="prosesPembayaran()"]');
    prosesBtn.disabled = true;
    prosesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
        const response = await fetch('/api/penjualan/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Terjadi kesalahan server.');

        showToast('Pembayaran Berhasil!', 'success');
        tampilkanStruk(totalBelanja, uangTunai);
        resetKasir();
        await loadInitialData();

    } catch (error) {
        showToast(`Gagal: ${error.message}`, 'error');
        console.error('Error:', error);
    } finally {
        prosesBtn.disabled = false;
        prosesBtn.innerHTML = '<i class="fas fa-check-circle"></i> Proses Pembayaran';
    }
}

function tampilkanStruk(total, tunai) {
    const strukContent = document.getElementById('struk-content');
    const kembalian = tunai - total;

    let detailHTML = `
        KasirModern - Struk Pembayaran
        ================================
        Total Belanja  : ${formatRupiah(total)}
        Tunai          : ${formatRupiah(tunai)}
        Kembalian      : ${formatRupiah(kembalian)}
        --------------------------------
        Detail Barang:
    `;

    Object.values(cart).forEach(item => {
        detailHTML += `
        - ${item.data.nama}
          ${item.quantity} x ${formatRupiah(item.data.harga)} = ${formatRupiah(item.quantity * item.data.harga)}
        `;
    });

    detailHTML += `
        --------------------------------
        Terima kasih telah berbelanja!
        ${new Date().toLocaleString('id-ID')}
    `;

    strukContent.textContent = detailHTML;
    document.getElementById('struk').style.display = 'block';
}

function printStruk() {
    const strukKonten = document.getElementById('struk-content').textContent;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<pre>' + strukKonten + '</pre>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

function resetKasir() {
    cart = {};
    renderCart();
    document.getElementById('uang_tunai').value = '';
    updateKembalian();
}

function showToast(message, type = 'info') {
    const colors = {
        success: '#28a745', error: '#dc3545', info: '#4A90E2'
    };
    Toastify({ text: message, duration: 2500, gravity: "top", position: "right", backgroundColor: colors[type] }).showToast();
}

function formatRupiah(angka) {
    if (isNaN(angka)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}
