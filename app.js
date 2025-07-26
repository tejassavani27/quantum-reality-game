// Import modules
import { initDebtSystem } from './quantum-debt.js';
import { startProphecyEngine } from './prophecy-engine.js';
import { initGlobalEvents } from './global-events.js';
import './glitch-material.js';

// Game state
let playerRole = 0; // 0=Dreamer, 1=Collapser
const peerId = `player_${Math.floor(Math.random() * 10000)}`;
let gunDB;

// Initialize game systems
function initGame() {
  // Setup networking
  gunDB = Gun(['https://gun-manhattan.herokuapp.com/gun']);
  const peer = new Peer(peerId, { host: '0.peerjs.com', port: 443 });
  
  // Initialize modules
  initDebtSystem();
  startProphecyEngine();
  initGlobalEvents(gunDB);
  
  // Device setup
  if (window.DeviceOrientationEvent) {
    setupDreamerControls();
  }
  
  // Role switching
  document.addEventListener('dblclick', () => {
    playerRole = playerRole === 0 ? 1 : 0;
    document.querySelector('#role span').textContent = 
      playerRole === 0 ? 'DREAMER' : 'COLLAPSER';
  });
}

// Dreamer creation mechanics
function setupDreamerControls() {
  window.addEventListener('deviceorientation', (e) => {
    if (playerRole !== 0) return;
    
    const x = (e.gamma / 90) * 2;
    const y = (e.beta / 180) * 4;
    
    const entity = document.createElement('a-entity');
    entity.setAttribute('position', `${x} ${y} -2`);
    entity.setAttribute('glitch-material', '');
    document.querySelector('a-scene').appendChild(entity);
    
    // Sync to network
    gunDB.get('objects').put({
      id: Date.now(),
      type: 'dream',
      position: { x, y, z: -2 },
      creator: peerId
    });
  });
}

// Collapser interaction
document.querySelector('a-scene').addEventListener('click', (e) => {
  if (playerRole !== 1) return;
  
  const target = e.detail.intersection.object;
  if (target.hasAttribute('glitch-material')) {
    if (Math.random() > 0.5) {
      target.setAttribute('material', 'color: #666');
      gunDB.get('events').put({ type: 'freeze', target: target.id });
    } else {
      target.parentNode.removeChild(target);
      gunDB.get('events').put({ type: 'shatter', target: target.id });
    }
    
    // Apply debt penalty
    window.updateQuantumDebt(-5);
  }
});

// Network sync
gunDB.get('objects').map().on((data) => {
  if (data && data.creator !== peerId) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('position', `${data.position.x} ${data.position.y} ${data.position.z}`);
    entity.setAttribute('glitch-material', '');
    document.querySelector('a-scene').appendChild(entity);
  }
});

// Start game when ready
window.addEventListener('DOMContentLoaded', initGame);