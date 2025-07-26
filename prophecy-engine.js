const prophecies = [
  "Build bridges where shadows weep",
  "Drown sorrows in dry riverbeds",
  "Plant fire in frozen gardens",
  "Bury light beneath stone giants"
];

export function startProphecyEngine() {
  // Show initial prophecy
  const prophecyElement = document.querySelector('#prophecy span');
  prophecyElement.textContent = prophecies[Math.floor(Math.random() * prophecies.length)];
  
  // Change prophecy every 5 minutes
  setInterval(() => {
    prophecyElement.textContent = prophecies[Math.floor(Math.random() * prophecies.length)];
    document.querySelector('a-scene').emit('prophecy-change');
  }, 300000);
  
  // Special event when prophecies complete
  gunDB.get('prophecy-count').on(count => {
    if (count >= 10) {
      gunDB.get('events').put({ type: 'reality-shatter' });
    }
  });
}