export function initGlobalEvents(gunDB) {
  // Listen for global events
  gunDB.get('events').on((data) => {
    if (!data) return;
    
    switch(data.type) {
      case 'volcano':
        createVolcano(data.location);
        break;
      case 'reality-shatter':
        shatterReality();
        break;
    }
  });
  
  // Special effects
  function createVolcano(location) {
    const scene = document.querySelector('a-scene');
    const volcano = document.createElement('a-entity');
    volcano.setAttribute('geometry', 'primitive: cone; height: 3; radiusBottom: 1');
    volcano.setAttribute('material', 'color: red; opacity: 0.8');
    volcano.setAttribute('position', `${location.x} ${location.y} ${location.z}`);
    scene.appendChild(volcano);
  }
  
  function shatterReality() {
    document.querySelectorAll('[glitch-material]').forEach(obj => {
      obj.setAttribute('animation', 'property: scale; to: 0 0 0; dur: 2000');
      setTimeout(() => obj.parentNode.removeChild(obj), 2000);
    });
  }
}