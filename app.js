// ==================== QUANTUM REALITY - MOBILE FIX ==================== //
// Version 2.1 | Fixes Chrome/Edge black screen and camera issues

// --------------------- GLOBAL STATE --------------------- //
let playerRole = 0; // 0 = Dreamer, 1 = Collapser
const playerId = `player_${Math.floor(Math.random() * 10000)}_${Date.now()}`;
let gunDB;
let arSessionActive = false;
const creationCooldown = 2000;
let lastCreationTime = 0;

// DOM References
const arPermission = document.getElementById('ar-permission');
const startARButton = document.getElementById('start-ar');
const warningDisplay = document.getElementById('support-warning');
const loadingText = document.getElementById('loading-text');
const hud = document.getElementById('hud');
const roleDisplay = document.getElementById('role-display');
const debtDisplay = document.getElementById('debt-display');
const prophecyDisplay = document.getElementById('prophecy-display');
const scene = document.querySelector('a-scene');
const dynamicContent = document.getElementById('dynamic-content');

// Device Detection
const isChrome = /Chrome/.test(navigator.userAgent);
const isEdge = /Edg/.test(navigator.userAgent);
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --------------------- INITIALIZATION --------------------- //
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AR system
    initARSystem();
    
    // Initialize game systems when scene loads
    scene.addEventListener('loaded', initGameSystems);
});

// --------------------- AR SYSTEM (FIXED FOR CHROME/EDGE) --------------------- //
function initARSystem() {
    startARButton.addEventListener('click', startARSession);
}

function startARSession() {
    arPermission.classList.add('hidden');
    loadingText.setAttribute('value', 'Initializing reality interface...');
    
    // Chrome/Edge need explicit camera activation
    if (isChrome || isEdge) {
        activateMobileCamera();
    } else {
        // For other browsers
        scene.setAttribute('arjs', 'sourceType: webcam;');
        setTimeout(() => {
            arSessionActive = true;
            hud.classList.remove('hidden');
            initGameSystems();
        }, 2000);
    }
}

function activateMobileCamera() {
    // Create temporary video element to trigger camera
    const tempVideo = document.createElement('video');
    tempVideo.setAttribute('autoplay', '');
    tempVideo.setAttribute('playsinline', '');
    tempVideo.style.display = 'none';
    document.body.appendChild(tempVideo);
    
    // Get camera stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            tempVideo.srcObject = stream;
            
            // Apply to A-Frame
            scene.setAttribute('arjs', 'sourceType: webcam; sourceWidth: 1280; sourceHeight: 720; displayWidth: 1280; displayHeight: 720;');
            
            // Delay for camera initialization
            setTimeout(() => {
                arSessionActive = true;
                hud.classList.remove('hidden');
                loadingText.setAttribute('visible', 'false');
                initGameSystems();
            }, 1500);
        })
        .catch(error => {
            console.error("Camera error:", error);
            showWarning(`Camera Error: ${error.message}`);
            arPermission.classList.remove('hidden');
        });
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
    const prophecyText = document.createElement('a-text');
    prophecyText.setAttribute('value', prophecy);
    prophecyText.setAttribute('position', '0 0.5 -2');
    prophecyText.setAttribute('color', '#FF00FF');
    prophecyText.setAttribute('align', 'center');
    dynamicContent.appendChild(prophecyText);
    
    // Remove after delay
    setTimeout(() => {
        dynamicContent.removeChild(prophecyText);
    }, 10000);
}

// --------------------- ROLE CONTROLS --------------------- //
function initRoleControls() {
    // Double-tap to switch roles
    scene.addEventListener('touchstart', (event) => {
        if (event.touches.length > 1) return; // Ignore multi-touch
        
        const now = Date.now();
        if (now - lastCreationTime < 300) {
            switchRole();
        }
        lastCreationTime = now;
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
        dynamicContent.removeChild(notification);
    }, 3000);
}

// --------------------- DREAMER CONTROLS --------------------- //
function initDreamerControls() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleDeviceTilt);
    } else {
        showWarning("Motion controls not available");
    }
}

function handleDeviceTilt(event) {
    if (playerRole !== 0 || !arSessionActive) return;
    if (Date.now() - lastCreationTime < creationCooldown) return;
    
    // Simplified position calculation
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
    if (playerRole !== 1 || !arSessionActive) return;
    
    const target = event.detail.intersection.object;
    if (target.classList.contains('quantum-object')) {
        const action = Math.random() > 0.5 ? 'freeze' : 'shatter';
        
        if (action === 'freeze') {
            target.setAttribute('material', 'color: #666');
            gunDB.get('events').put({ 
                type: 'freeze', 
                id: target.id
            });
        } else {
            target.parentNode.removeChild(target);
            gunDB.get('events').put({ 
                type: 'shatter', 
                id: target.id
            });
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
    gunDB.get('objects').put({
        id: entity.id,
        type: 'dream',
        position: { x, y, z },
        creator: playerId,
        timestamp: Date.now()
    });
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
            if (shatteredObj) {
                shatteredObj.parentNode.removeChild(shatteredObj);
            }
            break;
    }
}

// --------------------- UTILITIES --------------------- //
function showWarning(message) {
    warningDisplay.textContent = message;
    warningDisplay.style.display = 'block';
}

// --------------------- ERROR HANDLING --------------------- //
window.addEventListener('error', (event) => {
    console.error("Game error:", event.error);
    prophecyDisplay.textContent = "REALITY INSTABILITY DETECTED";
});

// ==================== END ==================== //