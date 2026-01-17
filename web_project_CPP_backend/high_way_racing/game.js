// 3-Lane Highway Racing Game - Full Updated Version

const SERVER_URL = "ws://localhost:9002"; // Replace with your server port
let socket = new WebSocket(SERVER_URL);

socket.onopen = () => {
    console.log("✅ Connected to server");
    const cs = document.getElementById("connection-status"); if (cs) cs.innerText = "Connected!";
};

socket.onclose = () => {
    console.log("❌ Disconnected from server");
    const cs = document.getElementById("connection-status"); if (cs) cs.innerText = "Disconnected!";
};

socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
};

socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if(data.fps !== undefined){
        document.getElementById("fps-counter").innerText = "FPS: " + data.fps;
    }
    document.getElementById("debug-throttle").innerText = data.throttle || 0;
    document.getElementById("debug-steer").innerText = data.steer || 0;
    document.getElementById("debug-handbrake").innerText = data.handbrake || false;
};

// Particle class
class Particle {
    constructor(x, y, vx, vy, size, color, life){
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.size = size; this.color = color; this.life = life;
    }
    update(){ this.x += this.vx; this.y += this.vy; this.life--; }
    draw(ctx){
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(this.life/50,0);
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class HighwayRacingGame {
    constructor(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game configuration
        this.config = window.gameConfig || this.getDefaultConfig();
    this.setupCanvas();
    this.bindFullscreenButton();
    // Recalculate canvas size on window resize so visuals (lanes/car) remain visible
    window.addEventListener('resize', () => this.setupCanvas());

        // Game state
        this.gameState = 'playing';
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.maxSpeed = 0;

    // Road - prefer explicit config from loaded JSON (road.lanes), then config.lanes, else default to 3
    this.lanes = (this.config && this.config.road && this.config.road.lanes) ? this.config.road.lanes : (this.config && this.config.lanes ? this.config.lanes : 3);
    // laneWidth will be computed after setupCanvas; fallback to config width
    this.laneWidth = (this.canvas.width && !isNaN(this.canvas.width)) ? this.canvas.width / this.lanes : (this.config.canvas.width / this.lanes);
        this.roadSpeed = 8;
        this.roadOffset = 0;
        this.roadLines = [];
        this.initRoadLines();

        // Player
        this.player = {
            x: this.laneWidth*1.5-25,
            y: (this.canvas.height ? (this.canvas.height / (window.devicePixelRatio || 1)) - 120 : this.config.canvas.height - 120),
            width: 50,
            height: 80,
            currentLane:1,
            targetLane:1,
            speed:0,
            maxSpeed:16,        // increased top speed
            acceleration:0.45,   // quicker acceleration
            deceleration:0.3,    // slightly stronger braking
            laneChangeSpeed:28,  // much faster lane changes (snappier)
            isChangingLane:false,
            throttle:0,
            steer:0,
            // lateralVel removed: no drifting behavior
            color:'#ff4444'
        };

        // Traffic
        this.traffic=[];
        this.trafficSpawnTimer=0;
        this.trafficSpawnRate=0.02;
        this.trafficTypes=[
            { color:'#4444ff', speed:3.2, height:80, width:50, points:10 },
            { color:'#44ff44', speed:4.2, height:90, width:55, points:15 },
            { color:'#ff44ff', speed:2.4, height:100, width:60, points:20 },
            { color:'#ffff44', speed:5.4, height:70, width:45, points:8 },
            { color:'#44ffff', speed:2.8, height:120, width:65, points:25 }
        ];

        // Particles
        this.particles = [];

        // Input
        this.keys = {};
        this.setupControls();
        this.setupMobileControls();

        // Audio
        this.audioContext = null;
        this.initAudio();

        // Performance
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;

        // Environment & items
        this.env = null;
        this.items = []; // obstacles and powerups
        this.spawnManager = { timer:0, interval: 2.5, // seconds
            update: (dt, game) => {
                this.spawnManager.timer += dt;
                if (this.spawnManager.timer < this.spawnManager.interval) return;
                this.spawnManager.timer = 0;
                // spawn based on env densities
                if (!game.env) return;
                const total = Math.random();
                if (total < game.env.obstacleDensity) {
                    game.spawnItem('pothole');
                } else if (total < game.env.obstacleDensity + game.env.powerupDensity) {
                    game.spawnItem('nitro');
                }
            }
        };

        // Boost system
        // Boost system (load persisted state if available)
        const stored = (() => { try { return JSON.parse(localStorage.getItem('hw_boost') || 'null'); } catch(e){return null;} })();
        // Enforce the required timings: 30s max active boost, 20s to fully recharge
        this.boost = Object.assign({
            max: 30.0,
            remaining: 30.0,
            active: false,
            cooldown: 20.0,
            cooldownTimer: 0,
            recharging: false,
            factor: 1.0
        }, stored);
        // deterministic target: how many seconds of hold at full throttle & top speed empties the boost
        this.boostDuration = 30.0;
        this.saveBoost = () => {
            try{ localStorage.setItem('hw_boost', JSON.stringify({ remaining: this.boost.remaining, recharging: this.boost.recharging, cooldownTimer: this.boost.cooldownTimer })); }
            catch(e){ /* ignore storage errors */ }
        };

        // Ensure boost state is saved when the page is closed or reloaded
        window.addEventListener('beforeunload', () => { try{ localStorage.setItem('hw_boost', JSON.stringify({ remaining: this.boost.remaining, recharging: this.boost.recharging, cooldownTimer: this.boost.cooldownTimer })); }catch(e){} });

    // Start loop
    this.gameLoop();
    // Traffic will start after a short delay so player has time to react
    this.trafficStartTimer = 0;
    this.trafficStartDelay = 10.0; // seconds (longer warm-up before traffic)
    this.trafficStarted = false;

        // Load environments and apply
        this.loadEnvironments();
    }

    loadEnvironments(){
        fetch('environments.json').then(r=>r.json()).then(envs=>{
            // choose env from config or random
            let chosen = (this.config && this.config.env) ? envs.find(e=>e.id===this.config.env) : null;
            if(!chosen) chosen = envs[Math.floor(Math.random()*envs.length)];
            this.env = chosen;
            // apply basic effects
            this.terrainFriction = chosen.friction || 1.0;
            this.speedMultiplier = chosen.speedMultiplier || 1.0;
            this.obstacleDensity = chosen.obstacleDensity || 0.04;
            this.powerupDensity = chosen.powerupDensity || 0.02;
            // visual tweak
            document.body.style.background = chosen.visual && chosen.visual.skyColor ? chosen.visual.skyColor : '';
        }).catch(()=>{
            // fallback default
            this.env = {friction:1, speedMultiplier:1, obstacleDensity:0.04, powerupDensity:0.02};
        });
    }

    // ensureInitialTraffic removed: start with empty roads and let spawnTraffic populate after delay

    toggleFullScreen() {
        const elem = this.canvas.parentElement || document.documentElement;
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    }

    bindFullscreenButton() {
        const btn = document.getElementById('fullscreenBtn');
        const container = this.canvas.parentElement;
        if (!btn || !container) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFullScreen();
        });

        // When fullscreen changes, add/remove CSS class and recalc canvas size
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) container.classList.add('fullscreen');
            else container.classList.remove('fullscreen');
            // Recalculate canvas to match new container size
            setTimeout(() => this.setupCanvas(), 80);
        });
    }

    getDefaultConfig(){
        return { canvas:{width:800,height:600}, lanes:3, physics:{gravity:0.3,friction:0.85} };
    }

    setupCanvas(){
        // Size canvas to its container so the drawn world matches the visible area
        const parent = this.canvas.parentElement || document.body;
        const rect = parent.getBoundingClientRect();
        const displayWidth = Math.max(1, Math.floor(rect.width));
        const displayHeight = Math.max(1, Math.floor(rect.height));

        // Set CSS display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // Handle device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.floor(displayWidth * dpr);
        this.canvas.height = Math.floor(displayHeight * dpr);

        // Reset transform and scale drawing operations to account for DPR
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Store display size (CSS pixels) for drawing logic and bounds tests
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;

        // Update lane width (in CSS pixels) so drawing logic lines up with visible layout
        this.laneWidth = this.displayWidth / this.lanes;
        // Debug overlay removed in production
    }

    initAudio(){
        try{ this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e){ console.log('Web Audio API not supported'); }
    }
    playSound(frequency,duration,type='sine'){
        if(!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode); gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = frequency; oscillator.type = type;
        gainNode.gain.setValueAtTime(0.1,this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01,this.audioContext.currentTime+duration);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime+duration);
    }

    initRoadLines(){
        for(let i=0;i<20;i++){ this.roadLines.push({y:(i*40)-400,height:20}); }
    }

    setupControls(){
        document.addEventListener('keydown', e=>{ this.keys[e.code]=true; if(e.code==='Space'){ e.preventDefault(); this.togglePause(); } });
        document.addEventListener('keyup', e=>{ this.keys[e.code]=false; });
        const restartBtn = document.getElementById('restartBtn');
        if(restartBtn) restartBtn.addEventListener('click', ()=>this.restart());
        // Fullscreen toggle with 'F'
        document.addEventListener('keydown', e => { if (e.code === 'KeyF') { this.toggleFullScreen(); } });
    }

    setupMobileControls(){
        let startX=0, startY=0;
        document.addEventListener('touchstart', e=>{ startX=e.touches[0].clientX; startY=e.touches[0].clientY; });
        document.addEventListener('touchend', e=>{
            const endX=e.changedTouches[0].clientX, endY=e.changedTouches[0].clientY;
            const dx=endX-startX, dy=endY-startY;
            if(Math.abs(dx)>Math.abs(dy)){
                if(dx>30) this.changeLane(1); else if(dx<-30) this.changeLane(-1);
            } else {
                if(dy<-30) this.player.speed = Math.min(this.player.speed+this.player.acceleration*5,this.player.maxSpeed);
                else if(dy>30) this.player.speed = Math.max(this.player.speed-this.player.deceleration*5,0);
            }
        });

        // Wire on-screen accelerate/brake buttons
        const accBtn = document.getElementById('accelerateBtn');
        const brkBtn = document.getElementById('brakeBtn');
        if (accBtn){
            accBtn.addEventListener('touchstart', e=>{ e.preventDefault(); this.keys['MobileAccel']=true; this.player.throttle = 1; });
            accBtn.addEventListener('touchend', e=>{ e.preventDefault(); this.keys['MobileAccel']=false; this.player.throttle = 0; });
            accBtn.addEventListener('mousedown', e=>{ e.preventDefault(); this.keys['MobileAccel']=true; this.player.throttle = 1; });
            accBtn.addEventListener('mouseup', e=>{ e.preventDefault(); this.keys['MobileAccel']=false; this.player.throttle = 0; });
        }
        if (brkBtn){
            brkBtn.addEventListener('touchstart', e=>{ e.preventDefault(); this.keys['MobileBrake']=true; this.player.throttle = -1; });
            brkBtn.addEventListener('touchend', e=>{ e.preventDefault(); this.keys['MobileBrake']=false; this.player.throttle = 0; });
            brkBtn.addEventListener('mousedown', e=>{ e.preventDefault(); this.keys['MobileBrake']=true; this.player.throttle = -1; });
            brkBtn.addEventListener('mouseup', e=>{ e.preventDefault(); this.keys['MobileBrake']=false; this.player.throttle = 0; });
        }
    }

    handleInput(){
        if(this.gameState!=='playing') return;
        // Update throttle (-1..1) and steer (-1..1) for physics
        this.player.throttle = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.throttle = 1;
        else if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.throttle = -1;

        this.player.steer = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.steer = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.steer = 1;

    // Discrete lane changes on key press: immediate and reliable
    if((this.keys['KeyA'] || this.keys['ArrowLeft']) && !this.player.isChangingLane) this.changeLane(-1);
    if((this.keys['KeyD'] || this.keys['ArrowRight']) && !this.player.isChangingLane) this.changeLane(1);

        this.maxSpeed = Math.max(this.maxSpeed,this.player.speed);

        // Boost is now tied to forward/throttle input. Holding forward burns fuel,
        // releasing starts refilling.
    }

    changeLane(direction){
        const newLane = this.player.currentLane+direction;
        if(newLane>=0 && newLane<this.lanes && !this.player.isChangingLane){
            this.player.targetLane = newLane;
            this.player.isChangingLane = true;
            this.playSound(400,0.1);
        }
    }

    updatePlayer(){
        // dt approximation based on measured fps
        const dt = Math.min(0.05, 1 / Math.max(1, this.fps));

        // Lateral movement: no drifting. Keep player centered in lane unless changing lanes.
        const centerXForLane = (laneIndex) => this.laneWidth*laneIndex + this.laneWidth/2 - this.player.width/2;
        if(this.player.isChangingLane){
            const targetX = centerXForLane(this.player.targetLane);
            const diff = targetX - this.player.x;
            const move = Math.min(Math.abs(diff), this.player.laneChangeSpeed * dt * 60);
            if (Math.abs(diff) <= move) {
                this.player.x = targetX;
                this.player.currentLane = this.player.targetLane;
                this.player.isChangingLane = false;
            } else {
                this.player.x += Math.sign(diff) * move;
            }
        } else {
            // Ensure player stays centered in their current lane
            this.player.x = centerXForLane(this.player.currentLane);
        }

        // Longitudinal physics (scale existing per-frame numbers by dt*60 to preserve feel)
        const speedMultiplier = this.speedMultiplier || (this.env ? this.env.speedMultiplier : 1);
        if (!this.player.throttle) this.player.throttle = 0;
        // acceleration units were tuned for per-frame earlier; keep same feel by scaling with dt*60
        if (this.player.throttle > 0) {
            const effectiveMax = this.player.maxSpeed * (this.boost && this.boost.factor ? this.boost.factor : 1.0);
            this.player.speed = Math.min(this.player.speed + this.player.acceleration * (dt * 60) * speedMultiplier, effectiveMax);
        } else if (this.player.throttle < 0) {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 2 * (dt * 60), 0);
        } else {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration * 0.5 * (dt * 60), 0);
        }

        // Road speed from player speed
    this.roadSpeed = 8 + this.player.speed * 0.5;
    // keep a level-based base spawn rate; actual spawn rate will be adjusted by player speed
    this.trafficBaseSpawnRate = Math.min(0.08, 0.02 + this.level * 0.005);

        // Update distance and score using dt to be framerate independent
        this.distance += (this.roadSpeed + this.player.speed) * 0.1 * (dt * 60);
        this.score += Math.floor(this.player.speed * 0.5 * (dt * 60));
        const newLevel = Math.floor(this.distance / 1000) + 1;
        if(newLevel > this.level){
            this.level = newLevel;
            this.playSound(800, 0.3);
            this.createLevelUpEffect();
        }
    }

    // Simple in-browser AI FSM for NPC traffic
    updateAI() {
        const difficulty = Math.min(1, Math.max(0, (this.level - 1) * 0.05));
    const overtakeThreshold = 240; // larger distance to start considering an overtake
    const randomLaneChangeProb = 0.004 + 0.004 * difficulty; // slightly more unpredictability

        const canChangeTo = (lane, self) => {
            if (lane < 0 || lane >= this.lanes) return false;
            // check no car too close in target lane
            return !this.traffic.some(o => o !== self && o.lane === lane && Math.abs(o.y - self.y) < 140);
        };

        for (const v of this.traffic) {
            // initialize AI fields if missing
            if (v.targetLane === undefined) v.targetLane = v.lane;
            if (v.desiredSpeed === undefined) v.desiredSpeed = v.speed;
            if (v.baseSpeed === undefined) v.baseSpeed = (v.speed || 3);
            if (v.aiState === undefined) v.aiState = 'CRUISE';
            if (v.aggression === undefined) v.aggression = 0.2 + Math.random() * 0.8;

            // sense
            const ahead = this.traffic.filter(o => o.lane === v.lane && o.y > v.y).sort((a,b)=>a.y-b.y)[0];
            const playerApproaching = (this.player.currentLane === v.lane && this.player.y < v.y && (v.y - this.player.y) < 320 && this.player.speed > v.speed + 0.5);

            // EVADE if player is approaching quickly
            if (playerApproaching) {
                const urgency = Math.max(0, (260 - (v.y - this.player.y)) / 260);
                const reaction = Math.min(1, urgency / Math.max(0.05, v.reactionTime || 0.3));
                v.desiredSpeed = Math.max(0.6, v.baseSpeed * (1 - 0.45 * reaction));
                v.aiState = 'EVADE';
                // prefer to move slightly to side if possible
                // choose the safer side: prefer lane with more forward gap
                const tryLeft = v.lane - 1;
                const tryRight = v.lane + 1;
                const gapFor = (lane) => {
                    if(lane<0||lane>=this.lanes) return -Infinity;
                    let nearestY = Infinity;
                    for(const o of this.traffic) if(o.lane===lane) nearestY = Math.min(nearestY, o.y);
                    return (nearestY===Infinity) ? Infinity : (nearestY - this.player.y);
                };
                const leftGap = gapFor(tryLeft);
                const rightGap = gapFor(tryRight);
                if (canChangeTo(tryLeft, v) && leftGap >= rightGap) v.targetLane = tryLeft;
                else if (canChangeTo(tryRight, v)) v.targetLane = tryRight;
            }
            // OVERTAKE if a slower car ahead and aggression permits
            else if (ahead && (ahead.y - v.y) < overtakeThreshold && ahead.speed < v.speed - 0.2 && Math.random() < v.aggression) {
                // attempt a safer overtake: ensure target lane has space ahead and behind
                const left = v.lane - 1; const right = v.lane + 1;
                const safeToChange = (target) => {
                    if (!canChangeTo(target, v)) return false;
                    // require some forward gap in target lane for a comfortable overtake
                    const forwardNear = this.traffic.filter(o => o.lane===target && o.y > v.y).sort((a,b)=>a.y-b.y)[0];
                    if (!forwardNear) return true;
                    return (forwardNear.y - v.y) > 140;
                };
                if (safeToChange(left)) v.targetLane = left;
                else if (safeToChange(right)) v.targetLane = right;
                // increase desired speed to perform a satisfying overtake, but cap it
                v.desiredSpeed = Math.min(v.speed * 1.28, v.speed + 3.0);
                v.aiState = 'OVERTAKE';
            }
            else {
                // small random lane change for unpredictability
                if (Math.random() < randomLaneChangeProb) {
                    const dir = (Math.random() < 0.5) ? -1 : 1;
                    const newLane = v.lane + dir;
                    if (canChangeTo(newLane, v)) v.targetLane = newLane;
                }
                v.desiredSpeed = v.baseSpeed;
                v.aiState = 'CRUISE';
            }

            // stronger smoothing when overtaking so acceleration feels immediate, gentler otherwise
            const blend = (v.aiState === 'OVERTAKE') ? 0.12 : 0.06;
            v.speed += (v.desiredSpeed - v.speed) * blend;
        }
    }

    spawnItem(type) {
        // type: 'nitro' | 'pothole' | 'shield' | 'coin'
        const lane = Math.floor(Math.random() * this.lanes);
        const id = Date.now() + Math.floor(Math.random()*1000);
        const w = 40, h = 20;
        const item = { id, lane, x: this.laneWidth*lane + this.laneWidth/2 - w/2, y: -h - Math.random()*200, width: w, height: h, type };
        this.items.push(item);
    }

    checkItemCollisions() {
        for (let i=this.items.length-1;i>=0;--i) {
            const it = this.items[i];
            if (this.checkCollision(this.player, it)) {
                this.applyItem(it);
                this.items.splice(i,1);
            }
        }
    }

    applyItem(item) {
        if (item.type === 'nitro') {
            const prevMax = this.player.maxSpeed;
            this.player.maxSpeed *= 1.6;
            this.playSound(1000, 0.15, 'sine');
            setTimeout(()=>{ this.player.maxSpeed = prevMax; }, 2000);
        } else if (item.type === 'pothole') {
            this.player.speed = Math.max(0, this.player.speed * 0.6);
            this.playSound(200,0.12,'sawtooth');
        } else if (item.type === 'coin') {
            this.score += 50;
        }
    }

    createLevelUpEffect(){
        for(let i=0;i<20;i++){
            this.particles.push(new Particle(
                Math.random() * this.displayWidth,
                    Math.random() * this.displayHeight,
                (Math.random()-0.5)*10,
                (Math.random()-0.5)*10,
                3,
                `hsl(${Math.random()*360},100%,50%)`,
                60
            ));
        }
    }

    spawnTraffic(){
        // Do not spawn traffic until the start delay has elapsed
        if(!this.trafficStarted){
            return;
        }

        this.trafficSpawnTimer += this.trafficSpawnRate;
        if(this.trafficSpawnTimer >= 1){
            this.trafficSpawnTimer = 0;
            // Build candidate lanes (allow player's lane sometimes to create pressure)
            const candidateLanes = [];
            for(let i=0;i<this.lanes;i++) candidateLanes.push(i);
            if(candidateLanes.length===0) return;

            // Determine which lanes are currently blocked near the player
            const safeAhead = 320; // px ahead of player considered unsafe (larger buffer for safer overtakes)
            const safeBehind = 60;
            const laneBlocked = {};
            let blockedCount = 0;
            for(const lane of candidateLanes){
                laneBlocked[lane] = this.traffic.some(v => v.lane===lane && v.y > (this.player.y - safeAhead) && v.y < (this.player.y + safeBehind));
                if(laneBlocked[lane]) blockedCount++;
            }

            // Decide lane for spawn.
            // Prefer lanes that are unblocked, but allow occasional spawn in player's lane
            const unblocked = candidateLanes.filter(l => !laneBlocked[l]);
            let lane = null;
            // when player is slow, avoid spawning in player's lane at nearly all costs
            const slowSpeedThreshold = Math.max(1, this.player.maxSpeed * 0.25);
            const preferAvoidPlayerLane = this.player.speed < slowSpeedThreshold;
            const spawnInPlayerLaneProb = preferAvoidPlayerLane ? 0.01 : 0.06; // nearly never when slow
            if (Math.random() < spawnInPlayerLaneProb && !laneBlocked[this.player.currentLane]) {
                lane = this.player.currentLane;
            } else if (unblocked.length > 0) {
                // prefer unblocked bypass lanes and avoid player's lane when possible
                const candidates = unblocked.filter(l => !(preferAvoidPlayerLane && l === this.player.currentLane));
                if (candidates.length > 0) lane = candidates[Math.floor(Math.random()*candidates.length)];
                else lane = unblocked[Math.floor(Math.random()*unblocked.length)];
            } else {
                // All lanes are blocked nearby. Pick the lane with the farthest vehicle (largest gap)
                let bestLane = candidateLanes[0];
                let bestGap = -Infinity;
                for(const l of candidateLanes){
                    let nearestY = Infinity;
                    for(const v of this.traffic){ if(v.lane===l) nearestY = Math.min(nearestY, v.y); }
                    const gap = (nearestY===Infinity) ? Infinity : (nearestY - this.player.y);
                    if(gap > bestGap){ bestGap = gap; bestLane = l; }
                }
                lane = bestLane;
            }

            // Safety: ensure at least one non-player lane remains unblocked shortly after spawn
            const wouldBlockAllBypass = () => {
                // simulate adding a vehicle to 'lane' at spawn position and check whether all lanes except player's are blocked
                const tempBlocked = Object.assign({}, laneBlocked);
                const spawnY = -50; // approximate spawn position
                tempBlocked[lane] = tempBlocked[lane] || (spawnY > (this.player.y - safeAhead) && spawnY < (this.player.y + safeBehind));
                // count unblocked bypass lanes (lanes != player.currentLane)
                const bypassUnblocked = candidateLanes.filter(l => l !== this.player.currentLane && !tempBlocked[l]);
                return bypassUnblocked.length === 0;
            };

            if (wouldBlockAllBypass()){
                // If spawning in this lane would block paths, pick the best unblocked bypass lane if any
                const bypassCandidates = candidateLanes.filter(l => l !== this.player.currentLane && !laneBlocked[l]);
                if (bypassCandidates.length > 0) lane = bypassCandidates[Math.floor(Math.random()*bypassCandidates.length)];
                else {
                    // fallback: pick lane with the furthest gap
                    let best = candidateLanes[0], bestGap = -Infinity;
                    for(const l of candidateLanes){
                        let nearestY = Infinity;
                        for(const v of this.traffic){ if(v.lane===l) nearestY = Math.min(nearestY, v.y); }
                        const gap = (nearestY===Infinity) ? Infinity : (nearestY - this.player.y);
                        if(gap > bestGap){ bestGap = gap; best = l; }
                    }
                    lane = best;
                }
            }
                const type = this.trafficTypes[Math.floor(Math.random()*this.trafficTypes.length)];
            // spawn vehicles a bit farther out so player has a chance to prepare/overtake
            // if player is slow, spawn even farther to avoid immediate collisions
            const spawnBase = 200 + Math.random()*400;
            const spawnYOffset = spawnBase + (this.player.speed < slowSpeedThreshold ? 200 : 0);
            const vehicle = {
                x:this.laneWidth*lane+this.laneWidth/2-type.width/2,
                y:-type.height - spawnYOffset,
                width:type.width,
                height:type.height,
                // widen speed variance for more thrilling overtakes (some faster cars)
                speed: Math.max(1.0, type.speed + (Math.random()*2.4-1.2)),
                color:type.color,
                points:type.points,
                lane:lane,
                oscillation: Math.random()*Math.PI*2,
                oscillationSpeed: 0.01+Math.random()*0.02,
                reactionTime: 0.2 + Math.random()*0.5
            };
            let canSpawn=true;
            for(const other of this.traffic){
                if(Math.abs(other.x-vehicle.x)<80 && Math.abs(other.y-vehicle.y)<150){
                    canSpawn=false; break;
                }
            }
            if(canSpawn) this.traffic.push(vehicle);
        }
    }

    updateTraffic(){
        for(let i=this.traffic.length-1;i>=0;i--){
            const v = this.traffic[i];
            // Basic reaction/avoidance: if player is approaching and close, traffic will slow a bit to create a gap
            const reactionDistance = 340; // px ahead of player where traffic should be wary (earlier yielding)
            const distToPlayerY = v.y - this.player.y;
            const sameLane = v.lane === this.player.currentLane;
            // Compute slowdown factor based on proximity and a small randomness
            let slowdown = 0;
            if (distToPlayerY > -80 && distToPlayerY < reactionDistance && Math.abs(v.x - this.player.x) < this.laneWidth*0.9) {
                // Closer -> more slowdown; respect reactionTime to avoid instant twitch
                const urgency = Math.max(0, (reactionDistance - distToPlayerY) / reactionDistance);
                const reactionFactor = Math.min(1, urgency / (v.reactionTime || 0.35));
                // gentler slowdown curve to reduce accidents but still create gap
                slowdown =  Math.pow((0.18 + 0.7 * reactionFactor), 1.0);
            }

            // Gradually adjust speed to avoid abrupt jumps
            const desiredSpeed = Math.max(0.6, v.speed * (1 - slowdown));
            // blend current speed toward desiredSpeed (smoother)
            v.y += desiredSpeed + this.roadSpeed;
            v.speed += (desiredSpeed - v.speed) * 0.08;

            // reduce oscillation influence when slowing so vehicles don't weave into player
            v.oscillation += v.oscillationSpeed;
            v.x += Math.sin(v.oscillation)*0.18 * (1 - slowdown);
            if(v.y>this.displayHeight+50){ this.traffic.splice(i,1); this.score+=v.points; }
            else if(this.checkCollision(this.player,v)){ this.gameOver(); break; }
        }
    }

    checkCollision(a,b){
        return a.x < b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y;
    }

    updateRoad(){
        this.roadOffset += this.roadSpeed;
        for(const line of this.roadLines){
            line.y += this.roadSpeed;
            if(line.y>this.displayHeight) line.y=-line.height-Math.random()*40;
        }
    }

    updateParticles(){
        for(let i=this.particles.length-1;i>=0;i--){
            const p = this.particles[i];
            p.update();
            if(p.life<=0) this.particles.splice(i,1);
        }
    }

    render(){
        const ctx=this.ctx;
    // Clear the visible area using display dimensions scaled by DPR via transform
    ctx.clearRect(0,0,this.displayWidth,this.displayHeight);
    this.drawRoad();
        for(const v of this.traffic) this.drawVehicle(v);
        // draw items
        for (const it of this.items) {
            ctx.save();
            if (it.type === 'nitro') ctx.fillStyle = '#ff8800';
            else if (it.type === 'pothole') ctx.fillStyle = '#222';
            else if (it.type === 'coin') ctx.fillStyle = '#ffd700';
            ctx.fillRect(it.x, it.y, it.width, it.height);
            ctx.restore();
        }
        this.drawVehicle(this.player);
        for(const p of this.particles) p.draw(ctx);
        this.drawSpeedEffects();
    }

    drawRoad(){
        const ctx=this.ctx;
        // Draw road base
        ctx.fillStyle='#333';
        ctx.fillRect(0,0,this.displayWidth,this.displayHeight);

        // Draw alternating lane backgrounds for visibility
        for(let i=0;i<this.lanes;i++){
            const x = i*this.laneWidth;
            ctx.fillStyle = (i % 2 === 0) ? '#3a3a3a' : '#2e2e2e';
            ctx.fillRect(x, 0, this.laneWidth, this.displayHeight);
        }

        // Lanes: dashed center dividers
        ctx.strokeStyle='#fff';
        ctx.lineWidth=4;
        ctx.setLineDash([24,20]);
        for(let i=1;i<this.lanes;i++){
            const x=i*this.laneWidth;
            ctx.beginPath();
            ctx.moveTo(x,-this.roadOffset%40);
            ctx.lineTo(x,this.displayHeight+40);
            ctx.stroke();
        }

        // Solid strong edges for lanes
        ctx.setLineDash([]);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#ffd700';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,this.displayHeight);
        ctx.moveTo(this.displayWidth,0); ctx.lineTo(this.displayWidth,this.displayHeight);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineWidth=8; ctx.strokeStyle='#ffff00';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,this.displayHeight);
    ctx.moveTo(this.displayWidth,0); ctx.lineTo(this.displayWidth,this.displayHeight);
        ctx.stroke();

        ctx.fillStyle='#228B22';
    ctx.fillRect(-50,0,50,this.displayHeight);
    ctx.fillRect(this.displayWidth,0,50,this.displayHeight);

        for(const line of this.roadLines){
            ctx.fillStyle='#fff';
            for(let i=1;i<this.lanes;i++){
                const x=i*this.laneWidth-10;
                ctx.fillRect(x,line.y,20,line.height);
            }
        }
    }

    drawVehicle(v){
        const ctx=this.ctx;
        ctx.save();
        ctx.fillStyle='rgba(0,0,0,0.3)';
        ctx.fillRect(v.x+3,v.y+3,v.width,v.height);
        ctx.fillStyle=v.color;
        ctx.fillRect(v.x,v.y,v.width,v.height);

        if(v===this.player){
            ctx.fillStyle='#222';
            ctx.fillRect(v.x+5,v.y+10,v.width-10,15);
            ctx.fillRect(v.x+5,v.y+v.height-25,v.width-10,15);
            ctx.fillStyle='#fff';
            ctx.fillRect(v.x+5,v.y+5,10,8); ctx.fillRect(v.x+v.width-15,v.y+5,10,8);
            ctx.fillStyle='#111';
            ctx.fillRect(v.x-3,v.y+15,8,12); ctx.fillRect(v.x+v.width-5,v.y+15,8,12);
            ctx.fillRect(v.x-3,v.y+v.height-27,8,12); ctx.fillRect(v.x+v.width-5,v.y+v.height-27,8,12);
        } else {
            ctx.fillStyle='rgba(255,255,255,0.3)';
            ctx.fillRect(v.x+3,v.y+3,v.width-6,8);
            ctx.fillStyle='#111';
            ctx.fillRect(v.x-2,v.y+10,6,8); ctx.fillRect(v.x+v.width-4,v.y+10,6,8);
            ctx.fillRect(v.x-2,v.y+v.height-18,6,8); ctx.fillRect(v.x+v.width-4,v.y+v.height-18,6,8);
        }
        ctx.restore();
    }

    drawSpeedEffects(){
        if(this.player.speed>8){
            const ctx=this.ctx;
            ctx.fillStyle=`rgba(255,255,255,${(this.player.speed-8)*0.02})`;
            for(let i=0;i<10;i++) ctx.fillRect(Math.random()*this.displayWidth,Math.random()*this.displayHeight,2,20);
        }
    }

    updateUI(){
        document.getElementById('score').textContent=`Score: ${Math.floor(this.score)}`;
        document.getElementById('speed').textContent=`Speed: ${Math.floor(this.player.speed*10)} km/h`;
        document.getElementById('distance').textContent=`Distance: ${Math.floor(this.distance)}m`;
        document.getElementById('level').textContent=`Level: ${this.level}`;
    }

    togglePause(){
        if(this.gameState==='playing'){ this.gameState='paused'; document.body.classList.add('game-paused'); }
        else if(this.gameState==='paused'){ this.gameState='playing'; document.body.classList.remove('game-paused'); }
    }

    gameOver(){
        this.gameState='gameOver';
        this.playSound(200,0.8,'sawtooth');
        document.getElementById('finalScore').textContent=Math.floor(this.score);
        document.getElementById('finalDistance').textContent=Math.floor(this.distance);
        document.getElementById('finalSpeed').textContent=Math.floor(this.maxSpeed*10);
        document.getElementById('finalLevel').textContent=this.level;
        document.getElementById('gameOverScreen').classList.add('show');
        for(let i=0;i<50;i++) this.particles.push(new Particle(
            this.player.x+this.player.width/2,
            this.player.y+this.player.height/2,
            (Math.random()-0.5)*20,
            (Math.random()-0.5)*20,
            3,
            ['#ff0000','#ff8800','#ffff00'][Math.floor(Math.random()*3)],
            120
        ));
        // Persist boost state on crash and avoid auto-refuel: keep current remaining and clear recharging flag
        try{
            this.boost.recharging = false;
            // retain boost.active state so it's visible after reload if it was active
            const boostContainer = document.getElementById('boost-container');
            if (boostContainer) {
                boostContainer.classList.remove('recharging');
                if (this.boost.active) boostContainer.classList.add('active');
                else if (this.boost.remaining >= this.boost.max) boostContainer.classList.add('full');
            }
            this.saveBoost();
        }catch(e){}
    }

    restart(){
        this.gameState='playing'; this.score=0; this.distance=0; this.level=1; this.maxSpeed=0;
        this.player.x=this.laneWidth*1.5-25; this.player.currentLane=1; this.player.targetLane=1;
        this.player.speed=0; this.player.isChangingLane=false;
        this.traffic=[]; this.particles=[]; this.roadSpeed=8; this.roadOffset=0; this.trafficSpawnTimer=0;
        document.getElementById('gameOverScreen').classList.remove('show'); document.body.classList.remove('game-paused'); 
        // Do not reset boost on restart; restore UI to reflect persisted state
        try{
            const boostContainer = document.getElementById('boost-container');
            if (this.boost.recharging) { if (boostContainer) { boostContainer.classList.add('recharging'); boostContainer.classList.remove('active','full'); } }
            else if (this.boost.remaining >= this.boost.max) { if (boostContainer) { boostContainer.classList.add('full'); boostContainer.classList.remove('active','recharging'); } }
            else { if (boostContainer) { boostContainer.classList.remove('active','recharging','full'); } }
        }catch(e){}
    }

    gameLoop(timestamp=0){
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.fps = 1000/delta;

        if(this.gameState==='playing'){
            this.handleInput();
            this.updatePlayer();
            this.updateAI();
            // spawn manager: update items
            // Use precise delta time from the RAF timestamp for deterministic timing
            const dt = Math.min(0.05, delta / 1000);
            this.spawnManager.update(dt, this);

            // advance traffic start timer until traffic starts and update UI countdown
            if(!this.trafficStarted){
                this.trafficStartTimer += dt;
                const remaining = Math.max(0, Math.ceil(this.trafficStartDelay - this.trafficStartTimer));
                const countdownEl = document.getElementById('traffic-countdown');
                const countNum = document.getElementById('traffic-count');
                if (countdownEl && countNum) {
                    countNum.textContent = remaining;
                    countdownEl.style.display = remaining > 0 ? 'block' : 'none';
                }
                if(this.trafficStartTimer >= this.trafficStartDelay) {
                    this.trafficStarted = true;
                    // play short beep to indicate traffic start
                    try{
                        const ac = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
                        const o = ac.createOscillator();
                        const g = ac.createGain();
                        o.type = 'sine'; o.frequency.value = 880;
                        g.gain.setValueAtTime(0.08, ac.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
                        o.connect(g); g.connect(ac.destination); o.start(ac.currentTime); o.stop(ac.currentTime + 0.25);
                        this.audioContext = ac;
                    }catch(e){ /* ignore audio errors */ }
                }
            }

            // Boost handling: activation starts boost which runs to depletion; recharge only after depletion
            const boostBarEl = document.getElementById('boost-bar');
            const boostTimerEl = document.getElementById('boost-timer');
            const boostContainer = document.getElementById('boost-container');

            // Activation: start boost when forward is pressed and boost is available
            if (this.player.throttle > 0 && !this.boost.recharging && this.boost.remaining > 0 && !this.boost.active) {
                this.boost.active = true;
                this.boost.factor = 1.5;
                if (boostContainer) { boostContainer.classList.add('active'); boostContainer.classList.remove('recharging','full'); }
                this.saveBoost();
            }

            // If boost is active, consume it until it depletes (regardless of throttle after activation)
            if (this.boost.active) {
                const speedNormLocal = Math.min(1, this.player.speed / Math.max(1, this.player.maxSpeed));
                const drainPerSecAtMax = this.boost.max / Math.max(1.0, this.boostDuration);
                const speedScale = 0.25 + 0.75 * speedNormLocal;
                const activeDrain = drainPerSecAtMax * speedScale;
                this.boost.remaining = Math.max(0, this.boost.remaining - activeDrain * dt);
                if (Math.random() < 0.5) this.saveBoost();
                if (this.boost.remaining <= 0) {
                    this.boost.active = false;
                    this.boost.recharging = true;
                    this.boost.cooldownTimer = 0;
                    if (boostContainer) { boostContainer.classList.remove('active'); boostContainer.classList.add('recharging'); }
                    this.saveBoost();
                }
            }

            // Handle recharging if in recharge state (linear fill over this.boost.cooldown seconds)
            if (this.boost.recharging) {
                this.boost.cooldownTimer = Math.min(this.boost.cooldown, this.boost.cooldownTimer + dt);
                const pct = this.boost.cooldownTimer / this.boost.cooldown;
                this.boost.remaining = pct * this.boost.max;
                const penaltyFactor = 0.7 + 0.3 * pct; // 0.7 -> 1.0
                this.boost.factor = penaltyFactor;
                if (Math.random() < 0.4) this.saveBoost();
                if (this.boost.cooldownTimer >= this.boost.cooldown) {
                    this.boost.recharging = false;
                    this.boost.factor = 1.0;
                    this.boost.remaining = this.boost.max;
                    if (boostContainer) { boostContainer.classList.remove('recharging'); boostContainer.classList.add('full'); }
                    this.saveBoost();
                }
            }

            // compute boost factor for physics: active overrides, otherwise keep recharge penalty or normal
            if (this.boost.active) this.boost.factor = 1.5;
            else if (!this.boost.recharging) this.boost.factor = 1.0;

            // Update boost UI (bar and timer)
            if (boostBarEl) {
                const pct = (this.boost.remaining / this.boost.max) * 100;
                boostBarEl.style.width = pct + '%';
            }
            if (boostTimerEl) {
                if (this.boost.recharging) {
                    const rem = Math.ceil(this.boost.cooldown - this.boost.cooldownTimer);
                    boostTimerEl.textContent = 'Recharging: ' + rem + 's';
                } else if (this.boost.active) {
                    boostTimerEl.textContent = 'Boost: ' + Math.ceil(this.boost.remaining) + 's';
                } else {
                    boostTimerEl.textContent = this.boost.remaining >= this.boost.max ? 'Ready' : 'Hold Forward';
                }
            }

            // Traffic density: make low-speed traffic LESS dense (to avoid instant pile-ups),
            // and continue to thin strongly at extreme high speeds. Mapping goes from ~0.9 at low speed -> 0.2 at top speed.
            const speedNorm = Math.min(1, this.player.speed / Math.max(1, this.player.maxSpeed));
            const spawnMultiplier = 0.9 - 0.7 * (speedNorm * speedNorm); // maps 0->0.9 (moderate) to 1->0.2 (sparse)
            const base = (this.trafficBaseSpawnRate !== undefined) ? this.trafficBaseSpawnRate : 0.02;
            this.trafficSpawnRate = Math.min(0.12, Math.max(0.006, base * spawnMultiplier));

            this.spawnTraffic();
            // update items y positions
            for (let i = this.items.length-1; i>=0; --i) {
                const it = this.items[i];
                it.y += (2 + (it.type==='nitro'? 0 : 0)) + this.roadSpeed; // simple motion
                if (it.y > this.displayHeight + 200) this.items.splice(i,1);
            }
            this.checkItemCollisions();
            this.updateTraffic();
            this.updateRoad();
            this.updateParticles();
        }

        this.render();
        this.updateUI();

        // Send some data to server for debugging
        if(socket && socket.readyState===WebSocket.OPEN){
            socket.send(JSON.stringify({
                fps: Math.floor(this.fps),
                throttle: Math.floor(this.player.speed*10),
                steer: this.player.targetLane - this.player.currentLane,
                handbrake: this.keys['Space'] || false
            }));
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize the game
window.addEventListener('load', ()=>{
    const canvas = document.getElementById('gameCanvas');
    window.game = new HighwayRacingGame(canvas);
});
