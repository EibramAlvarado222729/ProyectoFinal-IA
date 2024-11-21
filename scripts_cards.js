document.querySelectorAll('.cards').forEach(div => {
    div.addEventListener('click', () => {
        if (div.classList.contains('active')) return;

        const divId = div.id;

        // Ocultar todos los feedback-containers
        document.querySelectorAll('.feedback-container').forEach(container => {
            container.style.display = 'none';
        });

        // Remover clases activas de otras tarjetas
        document.querySelectorAll('.cards').forEach(otherDiv => {
            otherDiv.classList.remove('active', 'slide-left', 'slide-right', 'quick-transition');
            otherDiv.querySelector('span').style.opacity = '1';
        });

        // Mostrar feedback-container solo en la tarjeta activa
        if (divId === 'recomendacion') {
            const feedbackContainer = div.querySelector('.feedback-container');
            if (feedbackContainer) {
                feedbackContainer.style.display = 'block';
            }
        }

        // Agregar animaciones a otras tarjetas
        document.querySelectorAll('.cards').forEach(otherDiv => {
            if (otherDiv !== div) {
                if (divId === 'recomendacion') {
                    otherDiv.classList.add('slide-right');
                } else if (divId === 'artista') {
                    otherDiv.id === 'recomendacion' ? otherDiv.classList.add('slide-left') : otherDiv.classList.add('slide-right');
                } else if (divId === 'chat') {
                    otherDiv.classList.add('slide-left');
                }
            }
        });

        div.classList.add('active');
    });

    const closeButton = div.querySelector('.close-btn');
    closeButton.addEventListener('click', (event) => {
        event.stopPropagation();

        // Ocultar feedback-container al cerrar la tarjeta
        const feedbackContainer = div.querySelector('.feedback-container');
        if (feedbackContainer) {
            feedbackContainer.style.display = 'none';
        }

        div.classList.add('quick-transition');
        div.classList.remove('active');

        setTimeout(() => {
            div.classList.remove('quick-transition');
        }, 200);

        document.querySelectorAll('.cards').forEach(otherDiv => {
            otherDiv.classList.remove('slide-left', 'slide-right');
            otherDiv.style.opacity = '1';
        });
    });
});

// Control de emojis y barra de progreso
const emojis = document.querySelectorAll('.emoji');
const progress = document.querySelector('.progress');
const progressText = document.querySelector('.progress-text');

emojis.forEach(emoji => {
    emoji.addEventListener('click', () => {
        const value = emoji.getAttribute('data-value');
        progress.style.width = value;

        let estadoAnimo = '';
        switch (value) {
            case '0%':
                progressText.innerText = 'Tu selección: Muy triste 😢';
                estadoAnimo = 'sad';
                break;
            case '25%':
                progressText.innerText = 'Tu selección: Triste 😞';
                estadoAnimo = 'blues';
                break;
            case '50%':
                progressText.innerText = 'Tu selección: Normal 😐';
                estadoAnimo = 'pop';
                break;
            case '75%':
                progressText.innerText = 'Tu selección: Feliz 🙂';
                estadoAnimo = 'happy';
                break;
            case '100%':
                progressText.innerText = 'Tu selección: Muy feliz 😁';
                estadoAnimo = 'party';
                break;
        }

        // Llamar la función para obtener recomendaciones
        obtenerRecomendaciones(estadoAnimo);
    });
});



let userId = ''; // Variable para almacenar el ID del usuario

// Función para obtener el ID del usuario autenticado
async function obtenerUsuarioAutenticado() {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la información del usuario.');
        }

        const data = await response.json();
        userId = data.id; // Guardar el ID del usuario
        console.log(`Usuario autenticado: ${userId}`);
        return userId;
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
    }
}

let player; // Variable global para el reproductor

// Inicializar el reproductor de Spotify
function inicializarReproductor(accessToken) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        player = new Spotify.Player({
            name: 'Mi Reproductor Web', // Nombre del reproductor
            getOAuthToken: (cb) => { cb(accessToken); },
            volume: 0.8, // Ajustar volumen inicial
        });

        // Manejar eventos del reproductor
        player.addListener('ready', ({ device_id }) => {
            console.log('El reproductor está listo con el dispositivo ID:', device_id);
            transferPlayback(device_id); // Transferir reproducción al dispositivo
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('El dispositivo no está listo:', device_id);
        });

        player.addListener('player_state_changed', (state) => {
            console.log('Estado del reproductor cambiado:', state);
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error('Error de inicialización:', message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('Error de autenticación:', message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Error de cuenta:', message);
        });

        player.connect(); // Conectar el reproductor
    };
}

// Transferir la reproducción al dispositivo web
function transferPlayback(deviceId) {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false, // No empezar a reproducir automáticamente
        }),
    }).then((response) => {
        if (!response.ok) {
            console.error('Error al transferir la reproducción:', response.statusText);
        }
    });
}

// Función para reproducir una canción usando el reproductor web
function playTrack(trackUri) {
    if (!player) {
        console.error('El reproductor aún no está inicializado.');
        return;
    }

    player.getCurrentState().then((state) => {
        if (!state || state.paused) {
            // Reproducir la canción
            player.resume().then(() => {
                console.log('Reproduciendo:', trackUri);
                player._options.getOAuthToken((accessToken) => {
                    fetch('https://api.spotify.com/v1/me/player/play', {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uris: [trackUri] }),
                    }).catch((error) => console.error('Error al reproducir la canción:', error));
                });
            });
        } else {
            // Pausar la canción
            player.pause().then(() => {
                console.log('Pausado');
            });
        }
    });
}

// Función para agregar una canción a la lista de reproducción
async function addToPlaylist(trackUri) {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    const playlistId = await getOrCreateFavoritesPlaylist(accessToken);

    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [trackUri] }),
    })
    .then(response => {
        if (response.ok) {
            console.log('Canción agregada a la playlist');
        } else {
            console.error('Error al agregar canción a la playlist:', response.statusText);
        }
    })
    .catch(error => console.error('Error al agregar canción a la playlist:', error));
}

// Función auxiliar para obtener o crear la lista de favoritos
async function getOrCreateFavoritesPlaylist(accessToken) {
    const playlists = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => res.json());

    let favorites = playlists.items.find(p => p.name === 'Favoritos');
    if (!favorites) {
        favorites = await fetch('https://api.spotify.com/v1/users/YOUR_USER_ID/playlists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Favoritos',
                description: 'Mis canciones favoritas',
                public: false,
            }),
        }).then(res => res.json());
    }
    return favorites.id;
}

// Función para obtener las recomendaciones basadas en el estado de ánimo
function obtenerRecomendaciones(estadoAnimo) {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    // Mostrar un ícono de carga
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Cargando recomendaciones...';
    document.querySelector('#recomendaciones-container').appendChild(loadingElement);

    // Llamada a la API de Spotify para obtener canciones recomendadas
    fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${estadoAnimo}&limit=5`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    })
    .then(response => response.json())
    .then(data => {
        // Eliminar el ícono de carga
        loadingElement.remove();

        // Mostrar las recomendaciones de canciones
        const recomendacionContainer = document.querySelector('#recomendaciones-container');
        recomendacionContainer.innerHTML = ''; // Limpiar contenido anterior
        data.tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track-item');

            trackElement.innerHTML = `
                <div class="track-info">
                    <img src="${track.album.images[0].url}" alt="${track.name}" class="track-image"/>
                    <p><strong>${track.name}</strong></p>
                    <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                </div>
                <div class="track-actions">
                    <button class="play-button" data-uri="${track.uri}">Reproducir</button>
                    <button class="add-button" data-uri="${track.uri}">Agregar a Playlist</button>
                </div>
            `;
            recomendacionContainer.appendChild(trackElement);
        });

        // Agregar eventos a los botones
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const trackUri = event.target.dataset.uri;
                playTrack(trackUri);
            });
        });

        document.querySelectorAll('.add-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const trackUri = event.target.dataset.uri;
                addToPlaylist(trackUri);
            });
        });
    })
    .catch(error => {
        console.error('Error al obtener las recomendaciones:', error);
        loadingElement.textContent = 'Hubo un problema al cargar las recomendaciones';
    });
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        alert('Por favor, inicia sesión');
        return;
    }

    await obtenerUsuarioAutenticado(); // Obtener el ID del usuario autenticado
    inicializarReproductor(accessToken); // Inicializar el reproductor
});
