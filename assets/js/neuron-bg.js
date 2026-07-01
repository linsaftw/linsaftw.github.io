// Lightweight decorative neural background. No required content depends on this canvas.
(function () {
  const canvas = document.getElementById('neuron-canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame = 0;
  const mouse = { x: -9999, y: -9999 };
  const nodeCount = Math.min(56, Math.max(28, Math.floor((window.innerWidth || 1024) / 28)));
  const maxDist = 150;
  const maxDistSq = maxDist * maxDist;
  const mouseRadius = 190;
  const mouseRadiusSq = mouseRadius * mouseRadius;
  const speed = 0.26;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth || document.documentElement.clientWidth || 1024;
    height = window.innerHeight || document.documentElement.clientHeight || 768;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function createNodes() {
    nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 1.2 + 0.5,
    }));
  }

  function distSq(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function drawLine(a, b, alpha, lineWidth) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dSq = distSq(a, b);
        if (dSq < maxDistSq) {
          drawLine(a, b, (1 - dSq / maxDistSq) * 0.22, 0.5);
        }
      }
    }

    for (const node of nodes) {
      const dSq = distSq(node, mouse);
      if (dSq < mouseRadiusSq) {
        drawLine(node, mouse, (1 - dSq / mouseRadiusSq) * 0.6, 0.75);
      }
      const glow = dSq < mouseRadiusSq ? (1 - dSq / mouseRadiusSq) * 0.65 + 0.2 : 0.24;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${glow})`;
      ctx.fill();
    }

    animationFrame = requestAnimationFrame(draw);
  }

  function start() {
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(draw);
  }

  function stop() {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  window.addEventListener('resize', () => {
    resize();
    createNodes();
  }, { passive: true });
  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  resize();
  createNodes();
  start();
})();
