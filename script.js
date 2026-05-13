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
// Contador de sugerencias realizadas por el jugador en la partida actual
let suggestionCount = 0;
// --- Firebase (CDN modular) ---
// Sustituye los valores en firebaseConfig por los de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyDBnfDeDvBhbh3cMz7fweOCpbr2iGeMTf4",
  authDomain: "guillermo-ed821.firebaseapp.com",
  databaseURL: "https://guillermo-ed821-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "guillermo-ed821",
  storageBucket: "guillermo-ed821.firebasestorage.app",
  messagingSenderId: "681384794020",
  appId: "1:681384794020:web:e668b41d9ea21a059c1331",
  measurementId: "G-P62E23V4KF"
};

let fb = null;

async function initFirebaseAuth() {
    try {
        // Validación básica del config
        if (!firebaseConfig || firebaseConfig.apiKey === "AIzaSyDBnfDeDvBhbh3cMz7fweOCpbr2iGeMTf4") {
            console.error('firebaseConfig no está configurado. Reemplaza los valores en script.js');
            alert('firebaseConfig no está configurado en script.js. Rellena las credenciales de tu proyecto Firebase.');
            return;
        }
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
                const msg = (err && err.message) ? err.message : String(err);
                alert('Error al iniciar sesión. Detalle: ' + msg + '\nMira la consola para más información.');
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

        // Exponer para depuración en consola
        window.__fb = fb;

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

    // reset contador de sugerencias
    suggestionCount = 0;

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
    // Mostrar la acción del jugador en el centro para que sea claramente visible
    showCenterMessage(game.isAccusing ? `ACUSACIÓN: ${char} con ${weapon} en ${game.currentRoom}` : `Sugerencia: ${char} con ${weapon} en ${room}`, 1400);

    // Procesar la acción tras un pequeño retardo para que el jugador vea el mensaje
    setTimeout(() => {
        if (game.isAccusing) {
            // En una acusación final real preguntaríamos también la sala
            // Para este MVP, usaremos la última sala visitada como parte de la acusación
            processAccusation(char, weapon, game.currentRoom);
        } else {
            processSuggestion(char, weapon, room);
        }
        document.getElementById('modal').classList.add('hidden');
    }, 450);
};

function processSuggestion(c, w, r) {
    log(`Sugerencia: ${c} con ${w} en ${r}.`);
    suggestionCount += 1;
    
    // La máquina intenta refutar
    let possibleCards = game.machineHand.filter(card => card === c || card === w || card === r);
    
    if (possibleCards.length > 0) {
        let shown = possibleCards[Math.floor(Math.random() * possibleCards.length)];
        log(`La máquina te enseña: <b>${shown}</b>. No es parte del crimen.`);
        // Mostrar acción de la máquina
        showMachineAction(`La máquina muestra: ${shown}`, 2500);
    } else {
        log(`La máquina no tiene ninguna de esas cartas... ¡Interesante!`);
        showMachineAction('La máquina no puede refutar. ¡Avanza el turno!', 2500);
    }
        showCenterMessage(`Sugerencia: ${c} con ${w} en ${r}.`, 1800);
}

// Muestra una notificación grande con la acción de la máquina
function showMachineAction(text, duration = 2000) {
    const banner = document.getElementById('machine-action-banner');
    const content = document.getElementById('machine-action-text');
    if (!banner || !content) return;
    content.textContent = text;
    banner.classList.remove('hidden');
    banner.classList.remove('hide');
    // force reflow para aplicar la animación si ya estaba visible
    // eslint-disable-next-line no-unused-expressions
    banner.offsetHeight;
    banner.classList.add('show');

    // mostrar también en centro para máxima visibilidad
    showCenterMessage(text, Math.max(duration, 1400));

    setTimeout(() => {
        banner.classList.remove('show');
        banner.classList.add('hide');
        setTimeout(() => {
            banner.classList.add('hidden');
        }, 350);
    }, duration);
}

function processAccusation(c, w, r) {
    if (!r) {
        alert("Primero selecciona una región en el mapa para situar la acusación.");
        return;
    }

    if (c === game.solution.char && w === game.solution.weapon && r === game.solution.room) {
        alert(`¡VICTORIA! Has descubierto que fue ${c} en ${r} con ${w}.`);
        saveResult(true);
        location.reload();
    } else {
        alert(`ERROR. No fue así. La respuesta era: ${game.solution.char} en ${game.solution.room} con ${game.solution.weapon}. HAS PERDIDO.`);
        saveResult(false);
        location.reload();
    }
}

// --- Ranking: almacenar y renderizar ---
function getRankings() {
    try {
        const raw = localStorage.getItem('tic_rankings');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Error parseando rankings:', e);
        return [];
    }
}

function saveRankings(list) {
    localStorage.setItem('tic_rankings', JSON.stringify(list));
}

function saveResult(won) {
    const rankings = getRankings();
    // usuario: si está logueado usar nombre/email, si no 'Anónimo'
    let userName = 'Anónimo';
    try {
        const user = window.__fb?.auth?.currentUser;
        if (user) userName = user.displayName || user.email || 'Usuario';
    } catch(e) {}

    const entry = {
        user: userName,
        questions: suggestionCount,
        won: won,
        timestamp: Date.now()
    };

    rankings.push(entry);
    // ordenar por menos preguntas (asc)
    rankings.sort((a,b) => a.questions - b.questions || a.timestamp - b.timestamp);
    // mantener top 20
    saveRankings(rankings.slice(0,20));
    // actualizar vista
    renderRanking();
}

function renderRanking() {
    const list = getRankings();
    const ol = document.getElementById('ranking-list');
    if (!ol) return;
    ol.innerHTML = '';
    list.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `${item.user} — ${item.questions} pregunta(s)` + (item.won ? ' 🏆' : '');
        ol.appendChild(li);
    });
}

// handler para limpiar ranking
document.addEventListener('DOMContentLoaded', () => {
    const btnClear = document.getElementById('btn-clear-ranking');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (!confirm('¿Borrar todo el ranking?')) return;
            localStorage.removeItem('tic_rankings');
            renderRanking();
        });
    }
    // render al cargar
    renderRanking();
});

function log(msg) {
    const logDiv = document.getElementById('game-log');
    logDiv.innerHTML = `<p>> ${msg}</p>` + logDiv.innerHTML;
}

// Mostrar mensaje grande en el centro temporalmente
let _centerMsgTimer = null;
function showCenterMessage(msg, duration = 1800) {
    const wrapper = document.getElementById('center-message');
    const content = document.getElementById('center-message-text');
    if (!wrapper || !content) return;

    // Si ya hay un timer en curso, clear y mostrar el nuevo inmediatamente
    if (_centerMsgTimer) {
        clearTimeout(_centerMsgTimer);
        _centerMsgTimer = null;
    }

    content.textContent = msg;
    wrapper.classList.remove('hidden');
    wrapper.classList.remove('hide');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    wrapper.offsetHeight;
    wrapper.classList.add('show');

    _centerMsgTimer = setTimeout(() => {
        wrapper.classList.remove('show');
        wrapper.classList.add('hide');
        setTimeout(() => {
            wrapper.classList.add('hidden');
            _centerMsgTimer = null;
        }, 240);
    }, duration);
}

// Modificamos log para además mostrar en el centro
const _origLog = log;
function log(msg) {
    const logDiv = document.getElementById('game-log');
    logDiv.innerHTML = `<p>> ${msg}</p>` + logDiv.innerHTML;
    // mostrar en centro (si es relevante)
    showCenterMessage(msg);
}

init();
// Inicializar Firebase Auth en segundo plano (no bloquea el juego)
initFirebaseAuth();