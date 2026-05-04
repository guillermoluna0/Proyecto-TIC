const DATA = {
    chars: ["Frodo", "Gandalf", "Aragorn", "Galadriel", "Gollum", "Sauron"],
    weapons: ["Daga de Morgul", "Andúril", "Hacha de batalla", "Arco de Galadhrim", "Vial de Galadriel", "Bastón de Mago"],
    rooms: ["La Comarca", "Rivendel", "Moria", "Lothlórien", "Isengard", "Edoras", "Abismo de Helm", "Minas Tirith", "Osgiliath", "Cirith Ungol", "Monte del Destino", "Puerta Negra"]
};

let game = {
    solution: {},
    playerHand: [],
    machineHand: [],
    currentRoom: null,
    isAccusing: false
};
// --- Firebase (CDN modular) ---
// Sustituye los valores en firebaseConfig por los de tu proyecto
const firebaseConfig = {
    apiKey: "REPLACE_WITH_API_KEY",
    authDomain: "REPLACE_WITH_PROJECT.firebaseapp.com",
    projectId: "REPLACE_WITH_PROJECT_ID",
    appId: "REPLACE_WITH_APP_ID"
};

let fb = null;

async function initFirebaseAuth() {
    try {
        const appModule = await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js');
        const authModule = await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js');

        const app = appModule.initializeApp(firebaseConfig);
        const auth = authModule.getAuth(app);

        fb = { auth, authModule };

        const btnLogin = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');

        btnLogin.addEventListener('click', async () => {
            const provider = new fb.authModule.GoogleAuthProvider();
            try {
                await fb.authModule.signInWithPopup(fb.auth, provider);
            } catch (err) {
                console.error('Login error', err);
                alert('Error al iniciar sesión. Mira la consola.');
            }
        });

        btnLogout.addEventListener('click', async () => {
            try {
                await fb.authModule.signOut(fb.auth);
            } catch (err) {
                console.error('Logout error', err);
            }
        });

        fb.authModule.onAuthStateChanged(fb.auth, user => {
            updateAuthUI(user);
        });

    } catch (err) {
        console.error('No se pudo cargar Firebase desde CDN:', err);
        alert('No se pudo cargar Firebase. Comprueba conexión o usa CDN alternativo.');
    }
}

function updateAuthUI(user) {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userPic = document.getElementById('user-pic');

    if (user) {
        btnLogin.classList.add('hidden');
        btnLogout.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userName.textContent = user.displayName || user.email;
        userPic.src = user.photoURL || '';
    } else {
        btnLogin.classList.remove('hidden');
        btnLogout.classList.add('hidden');
        userInfo.classList.add('hidden');
        userName.textContent = '';
        userPic.src = '';
    }
}
// --- Inicialización ---
function init() {
    // 1. Elegir solución
    game.solution = {
        char: DATA.chars[Math.floor(Math.random() * DATA.chars.length)],
        weapon: DATA.weapons[Math.floor(Math.random() * DATA.weapons.length)],
        room: DATA.rooms[Math.floor(Math.random() * DATA.rooms.length)]
    };

    // 2. Repartir el resto
    let deck = [];
    DATA.chars.forEach(c => { if(c !== game.solution.char) deck.push(c); });
    DATA.weapons.forEach(w => { if(w !== game.solution.weapon) deck.push(w); });
    DATA.rooms.forEach(r => { if(r !== game.solution.room) deck.push(r); });
    
    deck.sort(() => Math.random() - 0.5);

    game.playerHand = deck.slice(0, Math.floor(deck.length / 2));
    game.machineHand = deck.slice(Math.floor(deck.length / 2));

    renderMap();
    renderNotebook();
    populateSelects();
    log(`Se ha cometido un robo. El culpable está en algún lugar con un objeto prohibido.`);
    log(`Tus cartas: ${game.playerHand.join(", ")}. Táchelas en su libro.`);
}

// --- Renderizado ---
function renderMap() {
    const mapDiv = document.getElementById('map');
    DATA.rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'location';
        div.innerText = room;
        div.onclick = () => handleRoomClick(room);
        mapDiv.appendChild(div);
    });
}

function renderNotebook() {
    const container = document.getElementById('notes-list');
    const sections = [
        { title: "Personajes", items: DATA.chars },
        { title: "Armas", items: DATA.weapons },
        { title: "Lugares", items: DATA.rooms }
    ];

    sections.forEach(sec => {
        const h4 = document.createElement('h4');
        h4.innerText = sec.title;
        container.appendChild(h4);
        sec.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'note-item';
            const checked = game.playerHand.includes(item) ? 'checked' : '';
            div.innerHTML = `<input type="checkbox" ${checked}> <span>${item}</span>`;
            container.appendChild(div);
        });
    });
}

function populateSelects() {
    const sChar = document.getElementById('select-char');
    const sWeapon = document.getElementById('select-weapon');
    
    DATA.chars.forEach(c => sChar.innerHTML += `<option value="${c}">${c}</option>`);
    DATA.weapons.forEach(w => sWeapon.innerHTML += `<option value="${w}">${w}</option>`);
}

// --- Acciones ---
function handleRoomClick(room) {
    game.currentRoom = room;
    game.isAccusing = false;
    document.getElementById('modal-title').innerText = `Investigar en ${room}`;
    document.getElementById('btn-confirm-action').innerText = "Sugerir";
    document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('btn-accuse').onclick = () => {
    game.isAccusing = true;
    document.getElementById('modal-title').innerText = `ACUSACIÓN FINAL`;
    document.getElementById('btn-confirm-action').innerText = "¡ACUSAR!";
    document.getElementById('modal').classList.remove('hidden');
};

document.getElementById('btn-cancel').onclick = () => {
    document.getElementById('modal').classList.add('hidden');
};

document.getElementById('btn-confirm-action').onclick = () => {
    const char = document.getElementById('select-char').value;
    const weapon = document.getElementById('select-weapon').value;
    const room = game.isAccusing ? game.solution.room : game.currentRoom; // En acusación usamos el select si quisiéramos, pero simplificamos a que debes estar en el sitio o elegirlo.

    if (game.isAccusing) {
        // En una acusación final real preguntaríamos también la sala
        // Para este MVP, usaremos la última sala visitada como parte de la acusación
        processAccusation(char, weapon, game.currentRoom);
    } else {
        processSuggestion(char, weapon, room);
    }
    document.getElementById('modal').classList.add('hidden');
};

function processSuggestion(c, w, r) {
    log(`Sugerencia: ${c} con ${w} en ${r}.`);
    
    // La máquina intenta refutar
    let possibleCards = game.machineHand.filter(card => card === c || card === w || card === r);
    
    if (possibleCards.length > 0) {
        let shown = possibleCards[Math.floor(Math.random() * possibleCards.length)];
        log(`La máquina te enseña: <b>${shown}</b>. No es parte del crimen.`);
    } else {
        log(`La máquina no tiene ninguna de esas cartas... ¡Interesante!`);
    }
}

function processAccusation(c, w, r) {
    if (!r) {
        alert("Primero selecciona una región en el mapa para situar la acusación.");
        return;
    }

    if (c === game.solution.char && w === game.solution.weapon && r === game.solution.room) {
        alert(`¡VICTORIA! Has descubierto que fue ${c} en ${r} con ${w}.`);
        location.reload();
    } else {
        alert(`ERROR. No fue así. La respuesta era: ${game.solution.char} en ${game.solution.room} con ${game.solution.weapon}. HAS PERDIDO.`);
        location.reload();
    }
}

function log(msg) {
    const logDiv = document.getElementById('game-log');
    logDiv.innerHTML = `<p>> ${msg}</p>` + logDiv.innerHTML;
}

init();
// Inicializar Firebase Auth en segundo plano (no bloquea el juego)
initFirebaseAuth();