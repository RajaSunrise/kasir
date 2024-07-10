document.addEventListener("DOMContentLoaded", function () {
    // Fetch all product names for the suggestions
    fetch('http://localhost:8000/produk/nama/')
        .then(response => response.json())
        .then(data => {
            const suggestionsContainer = document.getElementById('suggestions');
            const namaBarangInput = document.getElementById('nama_barang');

            namaBarangInput.addEventListener('input', function () {
                const input = namaBarangInput.value.toLowerCase();
                suggestionsContainer.innerHTML = '';
                if (input) {
                    const filteredNames = data.filter(name => name.toLowerCase().includes(input));
                    filteredNames.forEach(name => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.textContent = name;
                        suggestionItem.classList.add('suggestion-item');
                        suggestionItem.onclick = function () {
                            namaBarangInput.value = name;
                            suggestionsContainer.innerHTML = '';
                        };
                        suggestionsContainer.appendChild(suggestionItem);
                    });
                }
            });
        })
        .catch(error => console.error('Error fetching nama barang:', error));
});

async function tambahBarang() {
    const namaBarang = document.getElementById('nama_barang').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);

    if (namaBarang && jumlah > 0) {
        try {
            const response = await fetch(`http://localhost:8000/produk/nama/${namaBarang}`);
            if (response.ok) {
                const result = await response.json();
                const subtotal = result.harga * jumlah;
                const tbody = document.getElementById('tabel_keranjang').querySelector('tbody');
                let row = tbody.insertRow();

                row.innerHTML = `
                    <td>${result.kode}</td>
                    <td>${result.nama}</td>
                    <td>${result.harga}</td>
                    <td>${jumlah}</td>
                    <td>${subtotal}</td>
                    <td><button onclick="hapusBarang(this)">Hapus</button></td>
                `;

                updateTotalBelanja();
                document.getElementById('nama_barang').value = '';
                document.getElementById('jumlah').value = '';
            } else {
                alert('Produk tidak ditemukan!');
            }
        } catch (error) {
            alert('Terjadi kesalahan saat mengambil data produk.');
            console.error('Error:', error);
        }
    } else {
        alert('Mohon pilih nama barang dan masukkan jumlah yang valid!');
    }
}

function updateTotalBelanja() {
    const tbody = document.getElementById('tabel_keranjang').querySelector('tbody');
    let total = 0;
    for (let row of tbody.rows) {
        total += parseInt(row.cells[4].textContent);
    }
    document.getElementById('total').textContent = total;
}

function hapusBarang(button) {
    const row = button.closest('tr');
    row.remove();
    updateTotalBelanja();
}

async function prosesPembayaran() {
    const totalBelanja = parseInt(document.getElementById('total').textContent);
    let uangTunai = parseInt(document.getElementById('uang_tunai').value) || 0;

    if(uangTunai === 0){
         uangTunai = parseInt(prompt("Masukkan Jumlah Uang: ", 0));
    }

    let kembalian = uangTunai - totalBelanja;

    if (kembalian < 0) {
        alert('Uang tunai tidak cukup!');
        return;
    }

    // Tampilkan data struk
    const strukContent = `
        <p>Total Belanja: Rp ${totalBelanja}</p>
        <p>Uang Tunai: Rp ${uangTunai}</p>
        <p>Kembalian: Rp ${kembalian}</p>
        <h4>Detail Belanja:</h4>
        <table>
            <thead>
                <tr>
                    <th>Kode Barang</th>
                    <th>Nama Barang</th>
                    <th>Harga</th>
                    <th>Jumlah</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${getStrukDetail()}
            </tbody>
        </table>
    `;
    document.getElementById('struk-content').innerHTML = strukContent;
    document.getElementById('struk').style.display = 'block';

    // Tunggu konfirmasi cetak struk
    if (confirm("Cetak struk?")) {
        printStruk();

        // Ambil data dari tabel keranjang
        const cartItems = [];
        const tbody = document.getElementById('tabel_keranjang').querySelector('tbody');
        for (let row of tbody.rows) {
            cartItems.push({
                produk_id: row.cells[0].textContent, 
                quantity: parseInt(row.cells[3].textContent)
            });
        }

       
        try {
            const response = await fetch('http://localhost:8000/penjualan/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metode_pembayaran: 'tunai',
                    produk_items: cartItems
                })
            });

            if (response.ok) {
                alert('Pembayaran Berhasil dan Selesai.');
            } else {
                alert('Terjadi kesalahan saat memproses pembayaran.');
            }
        } catch (error) {
            alert('Terjadi kesalahan saat menghubungi server.');
            console.error('Error:', error);
        }
    }
}


function getStrukDetail() {
    const tbody = document.getElementById('tabel_keranjang').querySelector('tbody');
    let detail = '';
    for (let row of tbody.rows) {
        detail += `
            <tr>
                <td>${row.cells[0].textContent}</td>
                <td>${row.cells[1].textContent}</td>
                <td>${row.cells[2].textContent}</td>
                <td>${row.cells[3].textContent}</td>
                <td>${row.cells[4].textContent}</td>
            </tr>
        `;
    }
    return detail;
}

function printStruk() {
    const printContent = document.getElementById('struk-content').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
}

function toggleTunaiInput(value) {
    // Jika nanti ada pilihan non-tunai, fungsi ini akan digunakan.
    // Untuk saat ini pembayaran tunai selalu ditampilkan
    // karena hanya itu pilihan yang ada.
    document.getElementById('pembayaran_tunai').style.display = 'block'; 
}