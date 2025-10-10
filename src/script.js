const clientId = ""; /** Inserez ici votre identifiant */
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

/**
 * Cette partition permet le traitement des données.
 * Si l'utilisateur n'est pas connecté, il redirige vers la page de spotify pour l'autoristion d'acces aux données du compte.
 * S'il existe un token dans le local storage, il utilise celui-ci.
 * Sinon il le recupere via l'api spotify grace aux client_id et au code.
 */
if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    let accessToken = getStoredAccessToken();

    if (!accessToken) {
        accessToken = await getAccessToken(clientId, code);
    }

    /**
     * Cette partie permet lors de l'envoie du formulaire de recuperer et afficher les musiques.
     */
    document.getElementById("search-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const query = document.getElementById("search-input").value;

        const tracksData = await searchTracks(query, accessToken);
        const tracks = tracksData.tracks.items;

        displayTracks(tracks);
    });

    /**
     * Cette partie permet de traiter les informations de l'utilisateuur et de les afficher.
     */
    const profile = await fetchProfile(accessToken);
    const folowedArtistsData = await fetchFollowedArtist(accessToken);
    const folowedArtists = folowedArtistsData.artists.items;
    displayArtists(folowedArtists);
    populateUI(profile);
}

/**
 * Cette fonction permet via l'api de spotify de verifier si l'utilisateur peut acceder à la plateforme.
 * Elle redirige vers le site spotify pour demander à l'utilisateur l'autorisation d'acces aux données de
 * son compte.
 * @param {string} clientId - l'identifiant de l'utilisateur
 */
export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/callback");
    params.append("scope", "user-read-private user-read-email user-follow-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Cette fonction permet de generer le code verifier utilisée pour la sécurisation du flux des information entre l'api et le client.
 * @param {number} length - longueur du code à génerer
 * @returns 
 */
function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Cette fonction permet de generer le code.
 * @param {string} codeVerifier - code géneré Aleatoirement par la plateforme
 * @returns 
 */
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
/**
 * Cette fonction permet de gerer le stokage du token de l'utilisateur afin d'eviter la reconnexion
 * au chargement de la page. Si la date du token expire l'utilisateur sera rediriger vers la page de
 * connexion.
 * @returns 
 */
export function getStoredAccessToken() {
    const token = localStorage.getItem("access_token");
    const expiresAt = localStorage.getItem("token_expires_at");

    if (!token || !expiresAt) return null;
    if (Date.now() > parseInt(expiresAt)) {
        localStorage.removeItem("verifier");
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expires_at");
        document.location = 'http://127.0.0.1:5173/callback';
    }
    return token;
}

/**
 * Cette fonction permet via l'api spotify de recuperer le token pour acceder aux informations
 * de l'utilisateur.
 * @param {string} clientId - identifiant de l'utilisateur
 * @param {string} code - code generé Aleatoirement par la plateforme
 * @returns 
 */
export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token, expires_in } = await result.json();

    const expiresAt = Date.now() + expires_in*1000;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("token_expires_at", expiresAt.toString());
    return access_token;
}

/**
 * Cette fonction permet via l'api spotify de recuperer les informations de l'utilisateur connecté.
 * @param {string} token - token de l'utilisateur connecté
 * @returns 
 */
async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

/**
 * Cette fonction permet via l'api spotify de recuperer la liste des artistes dont l'utilisateur connecté est abonné.
 * @param {string} token - token de l'utilisateur connecté
 * @returns 
 */
async function fetchFollowedArtist(token){
    const result = await fetch("https://api.spotify.com/v1/me/following?type=artist", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    }); 

    return await result.json();
}

/**
 * Cette fonction permet via l'api de spotify de recuperer 20 musiques grace à la saisie
 * de l'utilisateur dans le filtre recherche.
 * @param {string} search - Saisie du formulaire de recherche
 * @param {string} token - token de l'utilisateur connecté
 * @returns
 */
async function searchTracks(search, token){
    const result = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track&limit=20`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    return await result.json();
}

/**
 * Cette fonction permet d'afficher les informations de l'utilisateur connecté.
 * @param {Array} profile - Liste des informations du compte de l'utilisateur
 */
function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);
}

/**
 * Cette fonction permet d'afficher les musiques (recherchées via le filtre) sur la vue
 * @param {Array} tracks - liste des musiques
 */
function displayTracks(tracks){
    const grid = document.getElementById("tracks-grid");
    grid.innerHTML = ""; 

    tracks.forEach((track) => {
    const card = document.createElement("div");
    card.className = "track-card";

    const img = document.createElement("img");
    img.src = track.album.images[0]?.url || "https://via.placeholder.com/150";
    img.alt = track.name;

    const name = document.createElement("div");
    name.className = "track-name";
    name.textContent = track.name;

    const artist = document.createElement("div");
    artist.className = "track-artist";
    artist.textContent = track.artists.map(a => a.name).join(", ");

    card.addEventListener("click", () => {
      const playerContainer = document.getElementById("player-container");
      const player = document.getElementById("spotify-player");

      playerContainer.style.display = "block";

      player.src = `https://open.spotify.com/embed/track/${track.id}`;
    });

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(artist);
    grid.appendChild(card);
  });

}

/**
 * Cette fonction permet d'afficher les artistes dans la vue.
 * @param {Array} folowedArtists - liste des artistes suivis par l'utilisateur
 */
function displayArtists(folowedArtists){
    const grid = document.getElementById("artists-grid");
    grid.innerHTML = "";

    folowedArtists.forEach((artist) => {
        const card = document.createElement("div");
        card.className = "artist-card";

        const link = document.createElement("a");
        link.href = artist.external_urls.spotify;
        link.target = "_blank";
        link.style.textDecoration = "none";
        link.style.color = "inherit";

        const img = document.createElement("img");
        img.src = artist.images[0]?.url || "https://via.placeholder.com/150";
        img.alt = artist.name;

        const name = document.createElement("div");
        name.className = "artist-name";
        name.textContent = artist.name;

        link.appendChild(img);
        link.appendChild(name);
        card.appendChild(link);

        grid.appendChild(card);
    });
}