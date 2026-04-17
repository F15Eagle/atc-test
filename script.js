const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stripsEl = document.getElementById('strips');
const logEl = document.getElementById('log-content');

canvas.width = window.innerWidth - 350;
canvas.height = window.innerHeight;

// --- NODES & PATHS ---
// Logic: Defining the "World" coordinates
const PATHS = {
    RUNWAY_START: { x: 100, y: canvas.height/2 },
    RUNWAY_END: { x: canvas.width - 200, y: canvas.height/2 },
    TAXI_ENTRY: { x: canvas.width - 300, y: canvas.height/2 + 50 },
    GATE_1: { x: 200, y: canvas.height/2 + 150 }
};

let aircraft = [];
let selectedId = null;

class Flight {
    constructor(callsign) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.callsign = callsign;
        this.x = -50;
        this.y = 150;
        this.targetX = 150;
        this.targetY = 150;
        this.speed = 1.2;
        this.status = 'INBOUND'; // INBOUND, APPROACH, LANDING, TAXIING, AT_GATE, DEPARTING
        this.altitude = 3000;
        this.heading = 90;
    }

    update() {
        // Behavioral Logic
        switch(this.status) {
            case 'INBOUND':
                this.x += this.speed;
                if(this.x > 100) this.status = 'APPROACH';
                break;
            case 'LANDING':
                this.moveTo(PATHS.RUNWAY_END.x, PATHS.RUNWAY_END.y, 3);
                this.altitude = Math.max(0, this.altitude - 15);
                if(this.x >= PATHS.RUNWAY_END.x - 5) this.status = 'ON_RUNWAY';
                break;
            case 'TAXIING':
                this.moveTo(PATHS.GATE_1.x, PATHS.GATE_1.y, 0.8);
                if(this.x <= PATHS.GATE_1.x + 5) this.status = 'AT_GATE';
                break;
            case 'TAKEOFF':
                this.x -= 5;
                this.altitude += 10;
                if(this.x < -100) this.status = 'GONE';
                break;
        }
    }

    moveTo(tx, ty, s) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if(dist > 2) {
            this.x += (dx/dist) * s;
            this.y += (dy/dist) * s;
            this.heading = Math.atan2(dy, dx) * 180 / Math.PI;
        }
    }

    draw() {
        const isSel = selectedId === this.id;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shadow for "2.5D" height effect
        ctx.shadowBlur = this.altitude / 100;
        ctx.shadowColor = 'black';
        ctx.shadowOffsetY = this.altitude / 50;

        // Plane Icon
        ctx.fillStyle = isSel ? '#58a6ff' : '#c9d1d9';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Data Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = isSel ? '#fff' : '#8b949e';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(this.callsign, 12, -5);
        ctx.font = '9px monospace';
        ctx.fillText(`${Math.round(this.altitude)}ft`, 12, 6);
        ctx.restore();
    }
}

// --- CONTROLS ---
function cmd(action) {
    const p = aircraft.find(a => a.id === selectedId);
    if(!p) return;

    playTone(400, 0.05);
    const log = (msg) => {
        const div = document.createElement('div');
        div.style.color = '#58a6ff';
        div.innerText = `> ${p.callsign}: ${msg}`;
        logEl.prepend(div);
    };

    if(action === 'CLEARED_LAND') {
        p.status = 'LANDING';
        log('Cleared to land Runway 27.');
    } else if(action === 'TAXI_GATE') {
        p.status = 'TAXIING';
        log('Taxi to Gate 1 via Bravo.');
    } else if(action === 'TAKEOFF') {
        p.status = 'TAKEOFF';
        log('Cleared for takeoff, wind calm.');
    }
    updateStrips();
}

// --- RENDER LOOP ---
function drawWorld() {
    // Background Grid
    ctx.strokeStyle = '#161b22';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=50) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
    }

    // Runway 27
    ctx.fillStyle = '#090c10';
    ctx.fillRect(100, canvas.height/2 - 20, canvas.width - 200, 40);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, canvas.height/2 - 20, canvas.width - 200, 40);
    
    // Numbers
    ctx.fillStyle = '#fff';
    ctx.font = '20px serif';
    ctx.fillText("27", 110, canvas.height/2 + 7);
    ctx.fillText("09", canvas.width - 140, canvas.height/2 + 7);
}

function updateStrips() {
    stripsEl.innerHTML = '';
    aircraft.forEach(a => {
        const s = document.createElement('div');
        s.className = `strip ${selectedId === a.id ? 'selected' : ''}`;
        s.innerHTML = `<strong>${a.callsign}</strong> <span style="float:right">${a.status}</span><br>Alt: ${Math.round(a.altitude)}`;
        s.onclick = () => { selectedId = a.id; document.getElementById('command-bar').classList.remove('hidden'); document.getElementById('plane-header').innerText = a.callsign; updateStrips(); };
        stripsEl.appendChild(s);
    });
}

function loop() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    
    drawWorld();
    
    aircraft.forEach(a => {
        a.update();
        a.draw();
    });

    requestAnimationFrame(loop);
}

function playTone(f, d) {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = f; o.connect(g); g.connect(a.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
    o.stop(a.currentTime + d);
}

// Init
aircraft.push(new Flight('AAL122'));
aircraft.push(new Flight('BAW001'));
updateStrips();
loop();

// Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);
