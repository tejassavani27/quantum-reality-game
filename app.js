// ==================== QUANTUM REALITY - UNIVERSAL FIX ==================== //
// Version 3.0 | Works on mobile (Chrome/Edge) and desktop browsers

// --------------------- GLOBAL STATE --------------------- //
let playerRole = 0; // 0 = Dreamer, 1 = Collapser
const playerId = `player_${Math.floor(Math.random() * 10000)}_${Date.now()}`;
let gunDB;
let arSessionActive = false;
const creationCooldown = 2000;
let lastCreationTime = 0;
let isDesktopMode = false;

// DOM References
const arPermission = document.getElementById('ar-permission');
const startARButton = document.getElementById('start-ar');
const desktopOverlay = document.getElementById('desktop-overlay');
const startDesktopButton = document.getElementById('start-desktop');
const warningDisplay = document.getElementById('support-warning');
const loadingText = document.getElementById('loading-text');
const hud = document.getElementById('hud');
const roleDisplay = document.getElementById('role-display');
const debtDisplay = document.getElementById('debt-display');
const prophecyDisplay = document.getElementById('prophecy-display');
const scene = document.querySelector('a-scene');
const dynamicContent = document.getElementById('dynamic-content');

// Device Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --------------------- INITIALIZATION --------------------- //
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI listeners
    startARButton.addEventListener('click', startARSession);
    startDesktopButton.addEventListener('click', startDesktopSession);
    
    // Auto-show desktop mode on non-mobile
    if (!isMobile) {
        desktopOverlay.style.display = 'block';
    }
});

// --------------------- AR SESSION --------------------- //
async function startARSession() {
    arPermission.classList.add('hidden');
    loadingText.setAttribute('value', 'Initializing quantum interface...');
    
    try {
        // Start camera
        await window.restartCamera();
        
        // Activate AR
        scene.setAttribute('arjs', 'sourceType: webcam;');
        arSessionActive = true;
        hud.classList.remove('hidden');
        
        // Initialize game systems
        initGameSystems();
        
    } catch (error) {
        console.error("AR startup failed:", error);
        warningDisplay.innerHTML = `
            AR Error: ${error.message}<br>
            <button onclick="window.restartCamera()">Retry Camera</button>
            <button onclick="startDesktopSession()">Switch to Desktop Mode</button>
        `;
        arPermission.classList.remove('hidden');
    }
}

// --------------------- DESKTOP SESSION --------------------- //
function startDesktopSession() {
    desktopOverlay.style.display = 'none';
    arPermission.classList.add('hidden');
    isDesktopMode = true;
    
    // Configure scene for desktop
    scene.setAttribute('arjs', 'debugUIEnabled: false;');
    scene.setAttribute('background', 'color: #000000');
    scene.setAttribute('camera', 'position: 0 0 5');
    
    // Create desktop environment
    const floor = document.createElement('a-plane');
    floor.setAttribute('position', '0 -1 0');
    floor.setAttribute('rotation', '-90 0 0');
    floor.setAttribute('width', '10');
    floor.setAttribute('height', '10');
    floor.setAttribute('color', '#333333');
    dynamicContent.appendChild(floor);
    
    // Add desktop camera controls
    const camera = document.querySelector('a-camera');
    camera.setAttribute('look-controls', 'pointerLockEnabled: true');
    camera.setAttribute('wasd-controls', 'enabled: true');
    
    hud.classList.remove('hidden');
    initGameSystems();
}

// --------------------- GAME SYSTEMS --------------------- //
function initGameSystems() {
    initNetwork();
    initDebtSystem();
    initProphecySystem();
    initRoleControls();
    
    // Initialize role-specific controls
    if (playerRole === 0) initDreamerControls();
    else initCollapserControls();
}

// --------------------- NETWORK SYSTEM --------------------- //
function initNetwork() {
    try {
        gunDB = Gun(['https://gun-manhattan.herokuapp.com/gun']);
        const peer = new Peer(playerId, { host: '0.peerjs.com', port: 443, debug: 0 });
        
        // Object synchronization
        gunDB.get('objects').map().on((data, id) => {
            if (data && data.creator !== playerId) {
                createRemoteObject(data);
            }
        });
        
        // Event handling
        gunDB.get('events').on((data) => {
            if (data) handleGlobalEvent(data);
        });
        
    } catch (error) {
        console.error("Network failure:", error);
        prophecyDisplay.textContent = "NETWORK ERROR";
    }
}

// --------------------- DEBT SYSTEM --------------------- //
function initDebtSystem() {
    let debt = parseInt(localStorage.getItem('quantumDebt') || 100);
    updateDebtDisplay(debt);
    
    setInterval(() => {
        if (playerRole === 1) {
            updateQuantumDebt(-0.1);
        }
    }, 60000);
}

function updateQuantumDebt(change) {
    let debt = parseInt(localStorage.getItem('quantumDebt') || 100);
    debt = Math.max(0, Math.min(100, debt + change));
    localStorage.setItem('quantumDebt', debt);
    updateDebtDisplay(debt);
    
    // Visual effect
    const opacity = 0.3 + (debt / 100 * 0.7);
    document.querySelectorAll('.quantum-object').forEach(obj => {
        obj.setAttribute('material', 'opacity', opacity);
    });
}

function updateDebtDisplay(debt) {
    debtDisplay.textContent = `${debt}%`;
}

// --------------------- PROPHECY SYSTEM --------------------- //
function initProphecySystem() {
    const prophecies = [
        "Build bridges where shadows weep",
        "Drown sorrows in dry riverbeds",
        "Plant fire in frozen gardens",
        "Bury light beneath stone giants"
    ];
    
    // Set initial prophecy
    const prophecy = prophecies[Math.floor(Math.random() * prophecies.length)];
    prophecyDisplay.textContent = prophecy;
    
    // Create AR text entity
    if (!isDesktopMode) {
        const prophecyText = document.createElement('a-text');
        prophecyText.setAttribute('value', prophecy);
        prophecyText.setAttribute('position', '0 0.5 -2');
        prophecyText.setAttribute('color', '#FF00FF');
        prophecyText.setAttribute('align', 'center');
        dynamicContent.appendChild(prophecyText);
        
        setTimeout(() => {
            if (prophecyText.parentNode) {
                dynamicContent.removeChild(prophecyText);
            }
        }, 10000);
    }
}

// --------------------- ROLE CONTROLS --------------------- //
function initRoleControls() {
    // Double-tap to switch roles (mobile)
    if (isMobile) {
        scene.addEventListener('touchstart', (event) => {
            if (event.touches.length > 1) return;
            const now = Date.now();
            if (now - lastCreationTime < 300) switchRole();
            lastCreationTime = now;
        });
    }
    
    // Double-click for desktop
    scene.addEventListener('dblclick', switchRole);
    
    // Keyboard shortcut (R key)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'r') switchRole();
    });
}

function switchRole() {
    playerRole = playerRole === 0 ? 1 : 0;
    roleDisplay.textContent = playerRole === 0 ? 'DREAMER' : 'COLLAPSER';
    
    // Show notification
    const notification = document.createElement('a-text');
    notification.setAttribute('value', `ROLE: ${roleDisplay.textContent}`);
    notification.setAttribute('position', '0 0 -1');
    notification.setAttribute('color', '#FF00FF');
    dynamicContent.appendChild(notification);
    
    // Reinitialize controls
    if (playerRole === 0) initDreamerControls();
    else initCollapserControls();
    
    setTimeout(() => {
        if (notification.parentNode) {
            dynamicContent.removeChild(notification);
        }
    }, 3000);
}

// --------------------- DREAMER CONTROLS --------------------- //
function initDreamerControls() {
    // Mobile controls
    if (isMobile && !isDesktopMode) {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceTilt);
        } else {
            showWarning("Motion controls not available");
        }
    } 
    // Desktop controls
    else {
        scene.addEventListener('click', (event) => {
            if (playerRole !== 0 || !arSessionActive) return;
            if (Date.now() - lastCreationTime < creationCooldown) return;
            
            const pos = event.detail.intersection.point;
            createObject(pos.x, pos.y, pos.z);
            lastCreationTime = Date.now();
        });
    }
}

function handleDeviceTilt(event) {
    if (playerRole !== 0 || !arSessionActive) return;
    if (Date.now() - lastCreationTime < creationCooldown) return;
    
    const x = (event.gamma / 60).toFixed(2);
    const y = (event.beta / 120).toFixed(2);
    
    createObject(x, y, -1.5);
    lastCreationTime = Date.now();
}

// --------------------- COLLAPSER CONTROLS --------------------- //
function initCollapserControls() {
    scene.addEventListener('click', handleObjectInteraction);
}

function handleObjectInteraction(event) {
    if (playerRole !== 1) return;
    
    const target = event.detail.intersection.object;
    if (target.classList.contains('quantum-object')) {
        const action = Math.random() > 0.5 ? 'freeze' : 'shatter';
        
        if (action === 'freeze') {
            target.setAttribute('material', 'color: #666');
            if (gunDB) {
                gunDB.get('events').put({ 
                    type: 'freeze', 
                    id: target.id
                });
            }
        } else {
            if (target.parentNode) {
                target.parentNode.removeChild(target);
            }
            if (gunDB) {
                gunDB.get('events').put({ 
                    type: 'shatter', 
                    id: target.id
                });
            }
        }
        
        updateQuantumDebt(-5);
    }
}

// --------------------- OBJECT MANAGEMENT --------------------- //
function createObject(x, y, z) {
    const entity = document.createElement('a-sphere');
    entity.setAttribute('position', `${x} ${y} ${z}`);
    entity.setAttribute('radius', '0.2');
    entity.setAttribute('color', getRandomColor());
    entity.setAttribute('opacity', '0.8');
    entity.setAttribute('animation', 'property: scale; to: 1.5 1.5 1.5; dur: 1000; easing: easeInOutQuad; dir: alternate; loop: true');
    entity.classList.add('quantum-object');
    entity.id = `obj_${playerId}_${Date.now()}`;
    dynamicContent.appendChild(entity);
    
    // Sync to network
    if (gunDB) {
        gunDB.get('objects').put({
            id: entity.id,
            type: 'dream',
            position: { x, y, z },
            creator: playerId,
            timestamp: Date.now()
        });
    }
}

function createRemoteObject(data) {
    if (document.getElementById(data.id)) return;
    
    const entity = document.createElement('a-sphere');
    entity.setAttribute('position', `${data.position.x} ${data.position.y} ${data.position.z}`);
    entity.setAttribute('radius', '0.2');
    entity.setAttribute('color', getRandomColor());
    entity.setAttribute('opacity', '0.8');
    entity.classList.add('quantum-object');
    entity.id = data.id;
    dynamicContent.appendChild(entity);
}

function getRandomColor() {
    const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF6600'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// --------------------- GLOBAL EVENTS --------------------- //
function handleGlobalEvent(data) {
    if (!data) return;
    
    switch(data.type) {
        case 'freeze':
            const frozenObj = document.getElementById(data.id);
            if (frozenObj) {
                frozenObj.setAttribute('color', '#666666');
                frozenObj.removeAttribute('animation');
            }
            break;
            
        case 'shatter':
            const shatteredObj = document.getElementById(data.id);
            if (shatteredObj && shatteredObj.parentNode) {
                shatteredObj.parentNode.removeChild(shatteredObj);
            }
            break;
    }
}

// --------------------- UTILITIES --------------------- //
function showWarning(message) {
    if (warningDisplay) {
        warningDisplay.textContent = message;
        warningDisplay.style.display = 'block';
    }
}

// --------------------- ERROR HANDLING --------------------- //
window.addEventListener('error', (event) => {
    console.error("Game error:", event.error);
    if (prophecyDisplay) {
        prophecyDisplay.textContent = "REALITY INSTABILITY DETECTED";
    }
});

// ==================== END ==================== //