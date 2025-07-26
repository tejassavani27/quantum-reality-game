export function initDebtSystem() {
  let debt = parseInt(localStorage.getItem('quantumDebt') || 100);
  const debtElement = document.querySelector('#debt span');
  
  // Update display
  window.updateQuantumDebt = (change) => {
    debt = Math.max(0, Math.min(100, debt + change));
    debtElement.textContent = `${debt}%`;
    localStorage.setItem('quantumDebt', debt);
    
    // Apply visual effects
    document.querySelector('a-scene').setAttribute('material', 'opacity', debt/100);
  };
  
  // Continuous debt drain for Collapsers
  setInterval(() => {
    if (document.querySelector('#role span').textContent === 'COLLAPSER') {
      updateQuantumDebt(-0.1);
    }
  }, 60000);
}