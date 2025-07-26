AFRAME.registerComponent('glitch-material', {
  init: function() {
    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          uv.x += sin(time * 10.0 + uv.y * 5.0) * 0.1;
          uv.y += cos(time * 8.0 + uv.x * 5.0) * 0.1;
          
          vec3 color = vec3(
            abs(sin(time * 0.5)),
            abs(cos(time * 0.7)),
            abs(sin(time * 0.9))
          );
          
          gl_FragColor = vec4(color, 0.7);
        }
      `
    });
    
    // Apply to entity
    this.el.setAttribute('material', material);
    
    // Animation loop
    this.tick = function(time) {
      material.uniforms.time.value = time / 1000;
    };
  }
});