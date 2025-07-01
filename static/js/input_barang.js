document.addEventListener('DOMContentLoaded', function() {
    loadStokBarang();
});

async function loadStokBarang() {
    const tbody = document.getElementById('tabel_stok').querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    try {
        const response = await fetch('/api/produk/');
        if (!response.ok) {
            throw new Error('Gagal memuat data stok.');
        }
        const produks = await response.json();

        tbody.innerHTML = '';
        if (produks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data barang.</td></tr>';
        } else {
            produks.forEach(produk => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${produk.kode}</td>
                    <td>${produk.nama}</td>
                    <td>${formatRupiah(produk.harga)}</td>
                    <td>${produk.jumlah}</td>
                `;
            });
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="color: red; text-align:center;">${error.message}</td></tr>`;
        showToast(error.message, 'error');
    }
}

async function tambahBarangBaru() {
    const kodeBarang = document.getElementById('kode_barang_baru').value.trim();
    const namaBarang = document.getElementById('nama_barang_baru').value.trim();
    const hargaBarang = parseInt(document.getElementById('harga_barang_baru').value);
    const jumlahBarang = parseInt(document.getElementById('jumlah_barang_baru').value);

    if (!kodeBarang || !namaBarang || isNaN(hargaBarang) || isNaN(jumlahBarang)) {
        showToast('Mohon isi semua field dengan nilai yang valid.', 'error');
        return;
    }

    const payload = {
        kode: kodeBarang,
        nama: namaBarang,
        harga: hargaBarang,
        jumlah: jumlahBarang
    };

    const simpanBtn = document.querySelector('button[onclick="tambahBarangBaru()"]');
    simpanBtn.disabled = true;
    simpanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const response = await fetch('/api/produk/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Barang baru berhasil ditambahkan!', 'success');
            document.getElementById('kode_barang_baru').value = '';
            document.getElementById('nama_barang_baru').value = '';
            document.getElementById('harga_barang_baru').value = '';
            document.getElementById('jumlah_barang_baru').value = '';
            loadStokBarang();
        } else {
            showToast(`Gagal: ${data.detail || 'Terjadi kesalahan'}`, 'error');
        }
    } catch (error) {
        showToast('Kesalahan jaringan saat menambahkan barang.', 'error');
        console.error('Error:', error);
    } finally {
        simpanBtn.disabled = false;
        simpanBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Barang Baru';
    }
}

function showToast(message, type = 'info') {
    const colors = {
        success: '#28a745', error: '#dc3545', info: '#0d6efd'
    };
    Toastify({
        text: message, duration: 3000, gravity: "top", position: "right", backgroundColor: colors[type]
    }).showToast();
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka);
}
