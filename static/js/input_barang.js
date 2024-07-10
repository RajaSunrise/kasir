async function tambahBarangBaru() {
    const kodeBarang = document.getElementById('kode_barang_baru').value;
    const namaBarang = document.getElementById('nama_barang_baru').value;
    const hargaBarang = parseInt(document.getElementById('harga_barang_baru').value);
    const jumlahBarang = parseInt(document.getElementById('jumlah_barang_baru').value);

    if (!kodeBarang || !namaBarang || isNaN(hargaBarang) || isNaN(jumlahBarang)) {
        alert('Mohon isi semua field dengan nilai yang valid untuk menambahkan barang baru.');
        return;
    }

    if (hargaBarang < 0 || jumlahBarang < 0) {
        alert('Harga dan jumlah barang harus bernilai positif.');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/produk/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                kode: kodeBarang,
                nama: namaBarang,
                harga: hargaBarang,
                jumlah: jumlahBarang
            }),
        });

        if (response.ok) {
            alert('Barang baru berhasil ditambahkan!');
            // Reset form
            document.getElementById('kode_barang_baru').value = '';
            document.getElementById('nama_barang_baru').value = '';
            document.getElementById('harga_barang_baru').value = '';
            document.getElementById('jumlah_barang_baru').value = '';
        } else {
            const errorData = await response.json();
            alert(`Gagal menambahkan barang baru: ${errorData.detail}`);
        }
    } catch (error) {
        alert('Terjadi kesalahan saat menambahkan barang baru.');
        console.error('Error:', error);
    }
}
