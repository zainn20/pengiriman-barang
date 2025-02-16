$(document).ready(function () {
    // Inisialisasi peta menggunakan Leaflet
    var map = L.map('map').setView([-6.2088, 106.8456], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Fungsi untuk mendapatkan koordinat dari alamat menggunakan AJAX
    function getCoordinates(address, callback) {
        $.ajax({
            url: `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}`,
            method: "GET",
            success: function (data) {
                if (data.features && data.features.length > 0) {
                    let coords = data.features[0].geometry.coordinates;
                    callback(coords[1], coords[0]); // Photon API mengembalikan [longitude, latitude]
                } else {
                    $("#result").html("⚠️ Alamat tidak ditemukan. Coba lagi!");
                }
            },
            error: function () {
                $("#result").html("⚠️ Terjadi kesalahan saat memproses alamat.");
            }
        });
    }

    // Event klik tombol hitung biaya
    $("#calculateBtn").click(function () {
        var origin = $("#origin").val();
        var destination = $("#destination").val();
        var weight = parseFloat($("#weight").val());
        var apiKey = "5b3ce3597851110001cf62486315cf517b7045088379273a974b0a01"; // API Key OpenRouteService

        if (!origin || !destination || isNaN(weight)) {
            $("#result").html("⚠️ Harap isi semua field dengan benar!");
            return;
        }

        getCoordinates(origin, function (lat1, lon1) {
            getCoordinates(destination, function (lat2, lon2) {
                var requestBody = {
                    coordinates: [[lon1, lat1], [lon2, lat2]],
                    format: "geojson"
                };

                // AJAX request untuk mendapatkan jarak menggunakan OpenRouteService
                $.ajax({
                    url: "https://api.openrouteservice.org/v2/directions/driving-car",
                    method: "POST",
                    headers: {
                        "Authorization": apiKey,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(requestBody),
                    success: function (data) {
                        if (data.routes && data.routes.length > 0) {
                            var distance = data.routes[0].summary.distance / 1000; // Konversi ke km
                            var estimasiWaktu = (distance < 50) ? "Sampai di hari yang sama" : Math.ceil(distance / 50) * 12 + " jam";
                            var biayaTotal = (weight * 10000) + (distance * 2000);
                            var biayaTotalFormatted = biayaTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR" });

                            // Tampilkan hasil perhitungan
                            $("#result").html(`
                                <strong>Jarak:</strong> ${distance.toFixed(2)} km <br>
                                <strong>Estimasi waktu:</strong> ${estimasiWaktu} <br>
                                <strong>Total Biaya:</strong> ${biayaTotalFormatted}
                            `);

                            // Tambahkan marker ke peta
                            map.setView([lat1, lon1], 10);
                            L.marker([lat1, lon1]).addTo(map).bindPopup("Pengirim").openPopup();
                            L.marker([lat2, lon2]).addTo(map).bindPopup("Penerima");

                            // Simpan data ke local storage
                            localStorage.setItem('origin', origin);
                            localStorage.setItem('destination', destination);
                            localStorage.setItem('distance', distance.toFixed(2));
                            localStorage.setItem('estimasiWaktu', estimasiWaktu);
                            localStorage.setItem('biayaTotal', biayaTotalFormatted);

                            // Tampilkan data tersimpan
                            displaySavedData();
                        } else {
                            $("#result").html("⚠️ Gagal mendapatkan data rute!");
                        }
                    },
                    error: function () {
                        $("#result").html("⚠️ Terjadi kesalahan saat memproses rute.");
                    }
                });
            });
        });
    });

    // Fungsi untuk menampilkan data yang tersimpan
    function displaySavedData() {
        var savedData = localStorage.getItem('origin');
        if (savedData) {
            $("#savedData").html(`
                <h3>Data Tersimpan:</h3>
                <p><strong>Alamat Pengirim:</strong> ${localStorage.getItem('origin')}</p>
                <p><strong>Alamat Penerima:</strong> ${localStorage.getItem('destination')}</p>
                <p><strong>Jarak:</strong> ${localStorage.getItem('distance')} km</p>
                <p><strong>Estimasi Waktu:</strong> ${localStorage.getItem('estimasiWaktu')}</p>
                <p><strong>Total Biaya:</strong> ${localStorage.getItem('biayaTotal')}</p>
            `);
        }
    }

    // Tampilkan data tersimpan saat halaman dimuat
    displaySavedData();
});
