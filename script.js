const canvas = document.getElementById('airportMap');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('logs');
const controlPanel = document.getElementById('controls');

canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

// --- Game Constants ---
const RUNWAY_Y = canvas.height / 2;
const GATE_X = 100;
const MAP_SCALE = 1;

let aircrafts = [];
let selectedPlane = null;

class Aircraft {
    constructor(callsign, type) {
        this.callsign = callsign;
        this.type = type;
        this.x = canvas.width + 50;
        this.y = 100 + Math.random() * 100;
        this.status = 'APPROACH'; // APPROACH, LANDING, TAXIING, AT_GATE, TAKEOFF
        this.speed = 1.5;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    update() {
        // Simple movement logic towards targets
        if (this.status === 'APPROACH') {
            this.x -= this.speed;
        } else if (this.status === 'LANDING') {
            this.moveTo(canvas.width / 2, RUNWAY_Y, 2);
            if (Math.abs(this.x - canvas.width/2) < 5) this.status = 'ON_RUNWAY';
        } else if (this.status === 'TAXIING') {
            this.moveTo(GATE_X, 100, 1);
            if (Math.abs(this.x - GATE_X) < 5) this.status = 'AT_GATE';
        } else if (this.status === 'TAKEOFF') {
            this.x += 4;
            if (this.x > canvas.width) this.reset();
        }
    }

    moveTo(tx, ty, s) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.x += (dx / dist) * s;
            this.y += (dy / dist) * s;
        }
    }

    draw() {
        ctx.fillStyle = (selectedPlane === this) ? '#ffff00' : '#00ff00';
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
        ctx.font = "12px Monospace";
        ctx.fillText(this.callsign, this.x + 15, this.y);
        ctx.fillText(this.status, this.x + 15, this.y + 12);
    }

    reset() {
        this.x = canvas.width + 50;
        this.y = 100;
        this.status = 'APPROACH';
    }
}

// Spawn some planes
aircrafts.push(new Aircraft('UAL241', 'B738'));
aircrafts.push(new Aircraft('AFR010', 'A350'));

function drawMap() {
    // Runway
    ctx.fillStyle = '#555';
    ctx.fillRect(100, RUNWAY_Y - 20, canvas.width - 200, 40);
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(100, RUNWAY_Y); ctx.lineTo(canvas.width - 100, RUNWAY_Y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    
    aircrafts.forEach(a => {
        a.update();
        a.draw();
    });
    
    requestAnimationFrame(gameLoop);
}

// Interaction
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    selectedPlane = aircrafts.find(a => Math.hypot(a.x - mx, a.y - my) < 30);
    
    if (selectedPlane) {
        controlPanel.classList.remove('hidden');
        document.getElementById('active-plane-info').innerHTML = `
            <strong>${selectedPlane.callsign}</strong><br>Status: ${selectedPlane.status}
        `;
    } else {
        controlPanel.classList.add('hidden');
    }
});

function issueCommand(cmd) {
    if (!selectedPlane) return;
    
    playBeep(600, 0.1);
    const log = document.createElement('div');
    log.className = 'log-entry';
    
    if (cmd === 'LAND' && selectedPlane.status === 'APPROACH') {
        selectedPlane.status = 'LANDING';
        log.innerText = `${selectedPlane.callsign}: Cleared to land Runway 09.`;
    } else if (cmd === 'TAXI_GATE' && selectedPlane.status === 'ON_RUNWAY') {
        selectedPlane.status = 'TAXIING';
        log.innerText = `${selectedPlane.callsign}: Taxi to Gate 4 via Alpha.`;
    } else if (cmd === 'TAKEOFF' && selectedPlane.status === 'AT_GATE') {
        selectedPlane.status = 'TAKEOFF';
        log.innerText = `${selectedPlane.callsign}: Cleared for takeoff!`;
    }
    
    logEl.prepend(log);
}

function playBeep(f, d) {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = f;
    o.connect(g); g.connect(a.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.00001, a.currentTime + d);
    o.stop(a.currentTime + d);
}

gameLoop();
