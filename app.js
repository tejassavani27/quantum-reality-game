// ================ QUANTUM REALITY - CORE ENGINE ================ //
// Version 1.0 | Designed for cross-platform WebXR AR experiences
// Dependencies: A-Frame, PeerJS, GunDB, Three.js

// --------------------- GLOBAL STATE --------------------- //
let playerRole = 0; // 0 = Dreamer, 1 = Collapser
const playerId = `player_${Math.floor(Math.random() * 10000)}_${Date.now()}`;
let gunDB;
let arSessionActive = false;
let lastCreationTime = 0;
const creationCooldown = 2000; // 2 seconds between creations

// DOM References
const roleDisplay = document.querySelector('#role span');
const debtDisplay = document.querySelector('#debt span');
const prophecyDisplay = document.querySelector('#prophecy span');
const scene = document.querySelector('a-scene');

// --------------------- INITIALIZATION --------------------- //
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game systems
    initNetwork();
    initARSystem();
    initDebtSystem();
    initProphecySystem();
    initRoleControls();

    // Display first prophecy
    prophecyDisplay.textContent = getRandomProphecy();
});

// --------------------- NETWORK SYSTEM --------------------- //
function initNetwork() {
    try {
        // Initialize decentralized database
        gunDB = Gun(['https://gun-manhattan.herokuapp.com/gun']);

        // Initialize P2P connections
        const peer = new Peer(playerId, {
            host: '0.peerjs.com',
            port: 443,
            debug: 0
        });

        // Listen for remote objects
        gunDB.get('objects').map().on((data, id) => {
            if (data && data.creator !== playerId) {
                createRemoteObject(data);
            }
        });

        // Listen for global events
        gunDB.get('events').on((data) => {
            if (data) handleGlobalEvent(data);
        });

        console.log("Network initialized");
    } catch (error) {
        console.error("Network init failed:", error);
        prophecyDisplay.textContent = "NETWORK ERROR - TRY REFRESHING";
    }
}

// ===================== AR SYSTEM (FIXED) ===================== //
let arPermissionGranted = false;

function initARSystem() {
    // Hide permission UI if WebXR not supported
    if (!navigator.xr) {
        document.getElementById('ar-permission').style.display = 'none';
        return;
    }

    // Show permission UI
    document.getElementById('start-ar').addEventListener('click', async () => {
        try {
            await startARSession();
            document.getElementById('ar-permission').style.display = 'none';
        } catch (error) {
            console.error("AR failed to start:", error);
            document.querySelector('#prophecy span').textContent = "AR ERROR: " + error.message;
        }
    });
}

async function startARSession() {

    // Request AR session
    const session = await navigator.xr.requestSession('immersive-ar');
    arSessionActive = true;
    console.log("AR session started");

    // Mobile-specific optimizations
    if (isMobile()) {
        // Force landscape orientation
        screen.orientation.lock('landscape').catch(() => { });

        // Prevent accidental scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Initialize scene
    scene.setAttribute('loaded', true);

    // Set up rendering
    const gl = scene.renderer.getContext();
    session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, gl)
    });

    // Set reference space
    const refSpace = await session.requestReferenceSpace('local');
    scene.renderer.xr.setReferenceSpace(refSpace);

    // Start AR loop
    session.requestAnimationFrame(onARFrame);

    // Initialize controls
    if (playerRole === 0) initDreamerControls();
    else initCollapserControls();

    // Handle session end
    session.addEventListener('end', () => {
        arSessionActive = false;
        document.getElementById('ar-permission').style.display = 'block';
        document.querySelector('#prophecy span').textContent = "AR session ended";
    });
}

function onARFrame(time, frame) {
    if (!arSessionActive) return;

    const session = frame.session;
    const refSpace = scene.renderer.xr.getReferenceSpace();
    const pose = frame.getViewerPose(refSpace);

    if (pose) {
        // Update camera position
        const position = pose.transform.position;
        scene.camera.object3D.position.set(position.x, position.y, position.z);

        // Optional: Update camera rotation
        const orientation = pose.transform.orientation;
        scene.camera.object3D.quaternion.set(
            orientation.x,
            orientation.y,
            orientation.z,
            orientation.w
        );
    }

    // Continue AR loop
    session.requestAnimationFrame(onARFrame);
}


// --------------------- GAMEPLAY SYSTEMS --------------------- //

// DREAMER CONTROLS
function initDreamerControls() {
    window.addEventListener('deviceorientation', handleDeviceTilt);
    console.log("Dreamer controls activated");
}

function handleDeviceTilt(event) {
    if (playerRole !== 0 || !arSessionActive) return;
    if (Date.now() - lastCreationTime < creationCooldown) return;

    // Calculate position based on tilt (-2 to 2 range)
    const x = (event.gamma / 90) * 2;
    const y = (event.beta / 180) * 4;

    createObject(x, y, -2);
    lastCreationTime = Date.now();
}

// COLLAPSER CONTROLS
function initCollapserControls() {
    scene.addEventListener('click', handleObjectInteraction);
    console.log("Collapser controls activated");
}

function handleObjectInteraction(event) {
    if (playerRole !== 1 || !arSessionActive) return;

    const target = event.detail.intersection.object;
    if (target.classList.contains('quantum-object')) {
        // 50% chance to freeze or shatter
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

        // Apply quantum debt penalty
        updateQuantumDebt(-5);
    }
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
    if (document.getElementById(data.id)) return; // Prevent duplicates

    const entity = document.createElement('a-entity');
    entity.setAttribute('position', `${data.position.x} ${data.position.y} ${data.position.z}`);
    entity.setAttribute('glitch-material', '');
    entity.classList.add('quantum-object');
    entity.id = data.id;
    scene.appendChild(entity);
}

// QUANTUM DEBT SYSTEM
function initDebtSystem() {
    let debt = parseInt(localStorage.getItem('quantumDebt') || 100);
    debtDisplay.textContent = `${debt}%`;

    // Continuous debt drain for Collapsers
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
    debtDisplay.textContent = `${debt}%`;

    // Visual effect - reduce opacity as debt increases
    scene.setAttribute('material', 'opacity', debt / 100);
}

// PROPHECY SYSTEM
function initProphecySystem() {
    const prophecies = [
        "Build bridges where shadows weep",
        "Drown sorrows in dry riverbeds",
        "Plant fire in frozen gardens",
        "Bury light beneath stone giants"
    ];

    // Update prophecy every 3 minutes
    setInterval(() => {
        prophecyDisplay.textContent = prophecies[Math.floor(Math.random() * prophecies.length)];
    }, 180000);
}

function getRandomProphecy() {
    const prophecies = [
        "Create water where shadows sleep",
        "Build towers of light in dark places",
        "Shatter silence with color",
        "Freeze time where memories linger"
    ];
    return prophecies[Math.floor(Math.random() * prophecies.length)];
}

// GLOBAL EVENTS HANDLER
function handleGlobalEvent(data) {
    switch (data.type) {
        case 'freeze':
            const obj = document.getElementById(data.id);
            if (obj) obj.setAttribute('material', 'color: #666; metalness: 0.8');
            break;

        case 'shatter':
            const target = document.getElementById(data.id);
            if (target) target.parentNode.removeChild(target);
            break;

        case 'reality-shatter':
            document.querySelectorAll('.quantum-object').forEach(obj => {
                obj.setAttribute('animation', 'property: scale; to: 0 0 0; dur: 2000');
                setTimeout(() => obj.parentNode.removeChild(obj), 2000);
            });
            break;
    }
}

// ROLE MANAGEMENT
function initRoleControls() {
    // Double-tap to switch roles
    let lastTap = 0;
    scene.addEventListener('touchstart', (event) => {
        const now = Date.now();
        if (now - lastTap < 300) { // Double-tap detected
            switchRole();
        }
        lastTap = now;
    });

    // Double-click for desktop
    scene.addEventListener('dblclick', switchRole);
}

function switchRole() {
    playerRole = playerRole === 0 ? 1 : 0;
    roleDisplay.textContent = playerRole === 0 ? 'DREAMER' : 'COLLAPSER';

    // Reinitialize controls
    if (playerRole === 0) initDreamerControls();
    else initCollapserControls();

    // Show notification
    const notification = document.createElement('a-text');
    notification.setAttribute('value', `ROLE CHANGED TO ${roleDisplay.textContent}`);
    notification.setAttribute('position', '0 0.5 -1');
    notification.setAttribute('color', '#FF00FF');
    scene.appendChild(notification);
    setTimeout(() => scene.removeChild(notification), 3000);
}

// --------------------- UTILITY FUNCTIONS --------------------- //
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od|ad)/.test(ua)) return 'mobile';
    if (/Tablet|iPad/.test(ua)) return 'tablet';
    return 'desktop';
}

// --------------------- ERROR HANDLING --------------------- //
window.addEventListener('error', (event) => {
    console.error("Unhandled error:", event.error);
    prophecyDisplay.textContent = "SYSTEM ERROR - REFRESH GAME";
});

// ==================== END OF CORE ENGINE ==================== //