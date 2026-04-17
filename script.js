const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let planes = [];
let score = 0;
let gameOver = false;

// --- Sound Effects ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

class Plane {
    constructor() {
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        if(side === 0) { this.x = 0; this.y = Math.random() * canvas.height; this.angle = 0; }
        else if(side === 1) { this.x = canvas.width; this.y = Math.random() * canvas.height; this.angle = Math.PI; }
        else if(side === 2) { this.x = Math.random() * canvas.width; this.y = 0; this.angle = Math.PI/2; }
        else { this.x = Math.random() * canvas.width; this.y = canvas.height; this.angle = -Math.PI/2; }
        
        this.speed = 1 + Math.random() * 1.5;
        this.id = Math.floor(100 + Math.random() * 899);
        this.radius = 15;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Scoring for passing through
        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
            score += 10;
            scoreEl.innerText = score;
            playBeep(880, 0.1);
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Plane Shape
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath();
        ctx.stroke();

        // Data block
        ctx.rotate(-this.angle);
        ctx.fillStyle = '#00ff41';
        ctx.fillText(`FL280 / AA${this.id}`, 15, -15);
        ctx.restore();
    }
}

// Initialize Planes
for(let i=0; i<5; i++) planes.push(new Plane());

// Input handling
canvas.addEventListener('mousedown', (e) => {
    planes.forEach(p => {
        const dist = Math.hypot(p.x - e.clientX, p.y - e.clientY);
        if (dist < 30) {
            p.angle += Math.PI / 4; // Rotate 45 degrees
            playBeep(440, 0.05);
        }
    });
});

function checkCollisions() {
    for(let i=0; i<planes.length; i++) {
        for(let j=i+1; j<planes.length; j++) {
            const dist = Math.hypot(planes[i].x - planes[j].x, planes[i].y - planes[j].y);
            if (dist < 25) {
                playBeep(110, 0.5);
                alert("Mid-air Collision! Game Over.");
                location.reload();
            }
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.2)'; // Fading trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Radar Circles
    ctx.strokeStyle = '#004400';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 200, 0, Math.PI*2);
    ctx.stroke();

    planes.forEach(p => {
        p.update();
        p.draw();
    });

    checkCollisions();
    requestAnimationFrame(animate);
}

animate();
