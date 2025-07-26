// ==================== QUANTUM REALITY CORE ENGINE ==================== //
// Version 2.0 | WebXR AR Multiplayer Experience
// Fixes: WebXR compatibility, iOS support, session initialization

// --------------------- GLOBAL STATE --------------------- //
let playerRole = 0; // 0 = Dreamer, 1 = Collapser
const playerId = `player_${Math.floor(Math.random() * 10000)}_${Date.now()}`;
let gunDB;
let arSession = null;
let arSessionActive = false;
const creationCooldown = 2000; // 2 seconds between creations
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

// Device Detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

// --------------------- INITIALIZATION --------------------- //
document.addEventListener('DOMContentLoaded', async () => {
    // Apply iOS-specific fixes
    if (isIOS) applyIOSFixes();
    
    // Initialize AR system
    initARSystem();
    
    // Initialize other game systems after AR starts
    scene.addEventListener('loaded', initGameSystems);
});

// --------------------- AR SYSTEM --------------------- //
function initARSystem() {
    // Check WebXR support
    if (!navigator.xr) {
        showWarning("WebXR not supported. Use Chrome on Android or Safari on iOS 15+");
        return;
    }

    // Configure AR button
    startARButton.addEventListener('click', startARSession);
    
    // Check session support
    navigator.xr.isSessionSupported('immersive-ar')
        .then(supported => {
            if (!supported) {
                showWarning("AR not available. Try a different device or browser.");
            }
        })
        .catch(err => {
            console.error("AR support check failed:", err);
            showWarning("AR compatibility check failed");
        });
}

async function startARSession() {
    try {
        // Hide permission UI
        arPermission.classList.add('hidden');
        loadingText.setAttribute('value', 'Starting quantum interface...');
        
        // Request AR session
        arSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local'],
            optionalFeatures: ['dom-overlay', 'hit-test']
        });
        
        console.log("AR session started");
        arSessionActive = true;
        
        // Configure rendering
        const renderer = scene.renderer;
        const gl = renderer.getContext();
        
        // Make context compatible
        if (gl.makeXRCompatible) {
            await gl.makeXRCompatible();
        }
        
        // Update session state
        arSession.updateRenderState({
            baseLayer: new XRWebGLLayer(arSession, gl)
        });
        
        // Get reference space
        const refSpace = await arSession.requestReferenceSpace('local');
        
        // Set up render loop
        arSession.requestAnimationFrame(onXRFrame);
        
        // Initialize game systems
        initGameSystems();
        
        // Show HUD
        hud.classList.remove('hidden');
        loadingText.setAttribute('value', 'Reality stabilized');
        setTimeout(() => loadingText.setAttribute('visible', 'false'), 3000);
        
        // Handle session end
        arSession.addEventListener('end', () => {
            arSessionActive = false;
            arPermission.classList.remove('hidden');
            loadingText.setAttribute('value', 'Quantum field collapsed');
            loadingText.setAttribute('visible', 'true');
            hud.classList.add('hidden');
        });
        
    } catch (error) {
        console.error("AR session failed:", error);
        showWarning(`AR Error: ${error.message}`);
        arPermission.classList.remove('hidden');
    }
}

function onXRFrame(time, frame) {
    if (!arSessionActive) return;
    
    const session = frame.session;
    const refSpace = scene.renderer.xr.getReferenceSpace();
    const pose = frame.getViewerPose(refSpace);
    
    if (pose) {
        // Update camera position
        const position = pose.transform.position;
        scene.camera.object3D.position.set(position.x, position.y, position.z);
        
        // Update camera rotation
        const orientation = pose.transform.orientation;
        scene.camera.object3D.quaternion.set(
            orientation.x,
            orientation.y,
            orientation.z,
            orientation.w
        );
    }
    
    // Continue animation loop
    session.requestAnimationFrame(onXRFrame);
}

// --------------------- GAME SYSTEMS --------------------- //
function initGameSystems() {
    initNetwork();
    initDebtSystem();
    initProphecySystem();
    initRoleControls();
}

// NETWORK SYSTEM
function initNetwork() {
    try {
        gunDB = Gun(['https://gun-manhattan.herokuapp.com/gun']);
        const peer = new Peer(playerId, { host: '0.peerjs.com', port: 443, debug: 0 });
        
        gunDB.get('objects').map().on((data, id) => {
            if (data && data.creator !== playerId) {
                createRemoteObject(data);
            }
        });
        
        gunDB.get('events').on((data) => {
            if (data) handleGlobalEvent(data);
        });
        
        console.log("Quantum network initialized");
        
    } catch (error) {
        console.error("Network failure:", error);
        prophecyDisplay.textContent = "NETWORK ERROR - REALITY FRAGMENTED";
    }
}

// DEBT SYSTEM
function initDebtSystem() {
    let debt = parseInt(localStorage.getItem('quantumDebt') || '100');
    updateDebtDisplay(debt);
    
    setInterval(() => {
        if (playerRole === 1) {
            updateQuantumDebt(-0.1);
        }
    }, 60000);
}

function updateQuantumDebt(change) {
    let debt = parseInt(localStorage.getItem('quantumDebt') || '100');
    debt = Math.max(0, Math.min(100, debt + change));
    localStorage.setItem('quantumDebt', debt);
    updateDebtDisplay(debt);
    scene.setAttribute('material', 'opacity', debt/100);
}

function updateDebtDisplay(debt) {
    debtDisplay.textContent = `${debt}%`;
}

// PROPHECY SYSTEM
function initProphecySystem() {
    const prophecies = [
        "Build bridges where shadows weep",
        "Drown sorrows in dry riverbeds",
        "Plant fire in frozen gardens",
        "Bury light beneath stone giants"
    ];
    
    // Set initial prophecy
    prophecyDisplay.textContent = prophecies[Math.floor(Math.random() * prophecies.length)];
    
    // Rotate prophecies
    setInterval(() => {
        prophecyDisplay.textContent = prophecies[Math.floor(Math.random() * prophecies.length)];
    }, 180000);
}

// ROLE CONTROLS
function initRoleControls() {
    // Double-tap to switch roles
    scene.addEventListener('touchstart', (event) => {
        const now = Date.now();
        if (now - lastTap < 300) switchRole();
        lastTap = now;
    });
    
    // Double-click for desktop
    scene.addEventListener('dblclick', switchRole);
}

function switchRole() {
    playerRole = playerRole === 0 ? 1 : 0;
    roleDisplay.textContent = playerRole === 0 ? 'DREAMER' : 'COLLAPSER';
    
    // Show notification
    const notification = document.createElement('a-text');
    notification.setAttribute('value', `ROLE CHANGED TO ${roleDisplay.textContent}`);
    notification.setAttribute('position', '0 0.5 -1');
    notification.setAttribute('color', '#FF00FF');
    scene.appendChild(notification);
    setTimeout(() => scene.removeChild(notification), 3000);
}

// OBJECT MANAGEMENT
function createObject(x, y, z) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('position', `${x} ${y} ${z}`);
    entity.setAttribute('glitch-material', '');
    entity.classList.add('quantum-object');
    entity.id = `obj_${playerId}_${Date.now()}`;
    scene.appendChild(entity);
    
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
    
    const entity = document.createElement('a-entity');
    entity.setAttribute('position', `${data.position.x} ${data.position.y} ${data.position.z}`);
    entity.setAttribute('glitch-material', '');
    entity.classList.add('quantum-object');
    entity.id = data.id;
    scene.appendChild(entity);
}

// GLOBAL EVENTS
function handleGlobalEvent(data) {
    switch(data.type) {
        case 'freeze':
            const frozenObj = document.getElementById(data.id);
            if (frozenObj) frozenObj.setAttribute('material', 'color: #666; metalness: 0.8');
            break;
            
        case 'shatter':
            const shatteredObj = document.getElementById(data.id);
            if (shatteredObj) shatteredObj.parentNode.removeChild(shatteredObj);
            break;
            
        case 'reality-shatter':
            document.querySelectorAll('.quantum-object').forEach(obj => {
                obj.setAttribute('animation', 'property: scale; to: 0 0 0; dur: 2000');
                setTimeout(() => obj.parentNode.removeChild(obj), 2000);
            });
            break;
    }
}

// --------------------- DREAMER CONTROLS --------------------- //
function initDreamerControls() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleDeviceTilt);
    } else {
        showWarning("Motion controls not supported");
    }
}

function handleDeviceTilt(event) {
    if (playerRole !== 0 || !arSessionActive) return;
    if (Date.now() - lastCreationTime < creationCooldown) return;
    
    const x = (event.gamma / 90) * 2;
    const y = (event.beta / 180) * 4;
    
    createObject(x, y, -2);
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
            target.setAttribute('material', 'color: #666; metalness: 0.8');
            gunDB.get('events').put({ 
                type: 'freeze', 
                id: target.id,
                creator: playerId
            });
        } else {
            target.parentNode.removeChild(target);
            gunDB.get('events').put({ 
                type: 'shatter', 
                id: target.id,
                creator: playerId
            });
        }
        
        updateQuantumDebt(-5);
    }
}

// --------------------- UTILITIES --------------------- //
function applyIOSFixes() {
    // Prevent scroll bounce
    document.body.style.overscrollBehavior = 'none';
    
    // Force landscape orientation
    screen.orientation.lock('landscape').catch(() => {});
    
    // Disable touch actions
    document.body.style.touchAction = 'none';
    
    // iOS-specific camera permissions
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => console.log("Camera pre-access granted"))
            .catch(err => console.warn("Camera pre-access failed:", err));
    }
}

function showWarning(message) {
    warningDisplay.textContent = message;
}

// --------------------- ERROR HANDLING --------------------- //
window.addEventListener('error', (event) => {
    console.error("Quantum instability:", event.error);
    prophecyDisplay.textContent = "REALITY COLLAPSE IMMINENT";
});

// ==================== END OF CORE ENGINE ==================== //