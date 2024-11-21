// Función para buscar un artista
document.getElementById('search-btn').addEventListener('click', () => {
    const artistName = document.getElementById('artist-search').value.trim();
    if (artistName) {
        buscarArtista(artistName);
    } else {
        alert('Por favor ingresa un nombre de artista.');
    }
});

// Función que consulta la API de Spotify para buscar un artista por nombre
function buscarArtista(artistName) {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    // Realizar la búsqueda del artista
    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.artists.items.length > 0) {
            mostrarInfoArtista(data.artists.items[0]);
        } else {
            document.getElementById('artist-info').innerHTML = 'No se encontró el artista.';
        }
    })
    .catch(error => {
        console.error('Error al buscar el artista:', error);
        document.getElementById('artist-info').innerHTML = 'Hubo un error al buscar el artista.';
    });
}

// Función para mostrar la información del artista
function mostrarInfoArtista(artista) {
    const artistInfoContainer = document.getElementById('artist-info');

    // Crear el HTML con la información del artista
    artistInfoContainer.innerHTML = `
        <img src="${artista.images[0] ? artista.images[0].url : ''}" alt="${artista.name}" />
        <p><strong>${artista.name}</strong></p>
        <p>Seguidores: ${artista.followers.total.toLocaleString()}</p>
        <p><a href="${artista.external_urls.spotify}" target="_blank" style="color: #1DB954;">Escuchar en Spotify</a></p>
    `;
}
