// LOVELY BOY • CUTE PRO (V11) - Live Anime Mascot & Sakura Canvas Engine

(function () {
  // 1. Floating Sakura Petals Background
  const bgCanvas = document.getElementById("animeBgCanvas");
  if (bgCanvas) {
    const ctx = bgCanvas.getContext("2d");
    let width = (bgCanvas.width = 350);
    let height = (bgCanvas.height = 560);

    const petals = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 3 + Math.random() * 4.5,
      speedY: 0.6 + Math.random() * 1.1,
      speedX: -0.4 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2,
      spin: 0.02 + Math.random() * 0.03,
      alpha: 0.35 + Math.random() * 0.45
    }));

    function drawSakura() {
      ctx.clearRect(0, 0, width, height);
      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.3;
        p.angle += p.spin;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = `rgba(255, 165, 215, ${p.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(drawSakura);
    }
    drawSakura();
  }

  // 2. Cute Blinking Chibi Avatar Mascot
  const mascotCanvas = document.getElementById("cuteMascotCanvas");
  if (mascotCanvas) {
    const mCtx = mascotCanvas.getContext("2d");
    let frame = 0;

    function drawMascot() {
      frame++;
      mCtx.clearRect(0, 0, 46, 46);

      // Cute Neko Ears
      mCtx.fillStyle = "#ff85c2";
      mCtx.beginPath();
      mCtx.moveTo(9, 16);
      mCtx.lineTo(12, 4);
      mCtx.lineTo(20, 12);
      mCtx.fill();

      mCtx.beginPath();
      mCtx.moveTo(37, 16);
      mCtx.lineTo(34, 4);
      mCtx.lineTo(26, 12);
      mCtx.fill();

      // Face Circle
      mCtx.fillStyle = "#ffe6f2";
      mCtx.beginPath();
      mCtx.arc(23, 25, 15, 0, Math.PI * 2);
      mCtx.fill();

      // Rosy Cheeks
      mCtx.fillStyle = "rgba(255, 77, 148, 0.45)";
      mCtx.beginPath();
      mCtx.arc(14, 28, 3.2, 0, Math.PI * 2);
      mCtx.arc(32, 28, 3.2, 0, Math.PI * 2);
      mCtx.fill();

      // Blinking Eyes
      const isBlinking = frame % 160 > 152;
      mCtx.strokeStyle = "#3b0a2a";
      mCtx.fillStyle = "#3b0a2a";
      mCtx.lineWidth = 2;

      if (isBlinking) {
        mCtx.beginPath();
        mCtx.arc(17, 24, 2.5, 0, Math.PI);
        mCtx.stroke();
        mCtx.beginPath();
        mCtx.arc(29, 24, 2.5, 0, Math.PI);
        mCtx.stroke();
      } else {
        mCtx.beginPath();
        mCtx.arc(17, 24, 2.4, 0, Math.PI * 2);
        mCtx.arc(29, 24, 2.4, 0, Math.PI * 2);
        mCtx.fill();

        // Eye Sparkles
        mCtx.fillStyle = "#ffffff";
        mCtx.beginPath();
        mCtx.arc(16.2, 23.2, 0.9, 0, Math.PI * 2);
        mCtx.arc(28.2, 23.2, 0.9, 0, Math.PI * 2);
        mCtx.fill();
      }

      // Cute Cat Smile
      mCtx.strokeStyle = "#ff2a85";
      mCtx.lineWidth = 1.6;
      mCtx.beginPath();
      mCtx.arc(21.2, 28.5, 1.8, 0, Math.PI);
      mCtx.arc(24.8, 28.5, 1.8, 0, Math.PI);
      mCtx.stroke();

      requestAnimationFrame(drawMascot);
    }
    drawMascot();
  }
})();
