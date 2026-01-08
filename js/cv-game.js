document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-modal');

    // --- Game Constants & State ---
    const TILE_SIZE = 50;
    const PLAYER_SPEED = 4;
    const SWORD_RANGE = 60;
    const SWORD_SWING_DURATION = 15; // frames

    let gameState = {
        currentLevel: 'hub',
        paused: false,
        player: { 
            x: 400, y: 250, 
            radius: 15, 
            angle: 0, 
            color: '#3b82f6',
            attacking: false,
            attackTimer: 0
        },
        keys: { w: false, a: false, s: false, d: false },
        mouse: { x: 0, y: 0, leftDown: false, rightDown: false },
        entities: [],
        particles: []
    };

    // --- Level Data ---
    const levels = {
        'hub': {
            background: '#2d2d2d',
            walls: [
                {x: 0, y: 0, w: 800, h: 50}, // Top
                {x: 0, y: 450, w: 800, h: 50}, // Bottom
                {x: 0, y: 0, w: 50, h: 500}, // Left
                {x: 750, y: 0, w: 50, h: 500} // Right
            ],
            doors: [
                {id: 1, x: 350, y: 0, w: 100, h: 50, hp: 100, maxHp: 100, target: 'experience', label: 'Experience', color: '#10b981'},
                {id: 2, x: 750, y: 200, w: 50, h: 100, hp: 100, maxHp: 100, target: 'education', label: 'Education', color: '#8b5cf6'},
                {id: 3, x: 350, y: 450, w: 100, h: 50, hp: 100, maxHp: 100, target: 'projects', label: 'Projects', color: '#f59e0b'},
                {id: 4, x: 0, y: 200, w: 50, h: 100, hp: 100, maxHp: 100, target: 'skills', label: 'Skills', color: '#0ea5e9'}
            ],
            docs: []
        },
        'experience': {
            background: '#064e3b',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 350, y: 450, w: 100, h: 50, hp: 0, maxHp: 100, target: 'hub', label: 'Back to Hub', color: '#666', open: true}
            ],
            docs: [
                {x: 200, y: 200, w: 40, h: 40, title: 'Amadeus (2024-Present)', content: 'Backend Software Developer. Working on Revenue Management Solutions using C++, Bash, Git, Jenkins, MongoDB. Developing features for SAFe trains.'},
                {x: 600, y: 200, w: 40, h: 40, title: 'Previous Role', content: 'Consultant via ALTEN. Worked on critical backend systems.'}
            ]
        },
        'education': {
            background: '#4c1d95',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 0, y: 200, w: 50, h: 100, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 400, y: 150, w: 40, h: 40, title: 'University Degree', content: 'Details about university education would go here. (Extracted from CV)'},
                {x: 400, y: 350, w: 40, h: 40, title: 'Certifications', content: 'Any relevant certifications.'}
            ]
        },
        'projects': {
            background: '#78350f',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 350, y: 0, w: 100, h: 50, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 200, y: 250, w: 40, h: 40, title: 'Personal Website', content: 'This website! Built with HTML, CSS, JS.'},
                {x: 600, y: 250, w: 40, h: 40, title: 'Game Engine', content: 'Custom C++ Game Engine styled after Minecraft.'}
            ]
        },
        'skills': {
            background: '#0c4a6e',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 750, y: 200, w: 50, h: 100, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 150, y: 150, w: 40, h: 40, title: 'C++', content: 'Expert proficiency in Modern C++.'},
                {x: 150, y: 350, w: 40, h: 40, title: 'Python', content: 'Strong scripting and automation skills.'},
                {x: 650, y: 150, w: 40, h: 40, title: 'Web Dev', content: 'HTML, CSS, JS, Bootstrap.'},
                {x: 650, y: 350, w: 40, h: 40, title: 'Tools', content: 'Git, Jenkins, Jira, Docker.'}
            ]
        }
    };

    // --- Input Handling ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = true;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = true;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = true;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = true;
        
        // Prevent scrolling with arrows/space if canvas is focused (simplified by checking key)
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " "].indexOf(e.key) > -1) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = false;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = false;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = false;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouse.x = e.clientX - rect.left;
        gameState.mouse.y = e.clientY - rect.top;
        
        // Update angle
        const dx = gameState.mouse.x - gameState.player.x;
        const dy = gameState.mouse.y - gameState.player.y;
        gameState.player.angle = Math.atan2(dy, dx);
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left Click
            gameState.mouse.leftDown = true;
            attack();
        } else if (e.button === 2) { // Right Click
            gameState.mouse.rightDown = true;
            e.preventDefault(); // Block context menu
            interact();
        }
    });
    
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) gameState.mouse.leftDown = false;
        if (e.button === 2) gameState.mouse.rightDown = false;
    });

    // --- Core Logic ---

    function loadLevel(levelName) {
        gameState.currentLevel = levelName;
        // Reset player position based on entry? 
        // For now, center them but offset slightly to avoid immediate exit
        if (levelName === 'hub') {
            gameState.player.x = 400; gameState.player.y = 250;
        } else if (levelName === 'experience') {
            gameState.player.x = 400; gameState.player.y = 380;
        } else if (levelName === 'projects') {
            gameState.player.x = 400; gameState.player.y = 120;
        } else if (levelName === 'education') {
            gameState.player.x = 100; gameState.player.y = 250;
        } else if (levelName === 'skills') {
            gameState.player.x = 700; gameState.player.y = 250;
        }
    }

    function attack() {
        if (gameState.player.attacking) return;
        gameState.player.attacking = true;
        gameState.player.attackTimer = SWORD_SWING_DURATION;

        // Check for door hits
        const level = levels[gameState.currentLevel];
        const attackX = gameState.player.x + Math.cos(gameState.player.angle) * 40;
        const attackY = gameState.player.y + Math.sin(gameState.player.angle) * 40;

        level.doors.forEach(door => {
            if (door.hp > 0) {
                // Simple box collision for attack
                if (attackX > door.x && attackX < door.x + door.w &&
                    attackY > door.y && attackY < door.y + door.h) {
                    
                    door.hp -= 20; // Damage
                    createParticles(attackX, attackY, '#fff', 5);
                    
                    if (door.hp <= 0) {
                        door.hp = 0;
                        door.open = true;
                        createParticles(door.x + door.w/2, door.y + door.h/2, door.color, 20);
                    }
                }
            }
        });
    }

    function interact() {
        const level = levels[gameState.currentLevel];
        // Check for documents nearby
        level.docs.forEach(doc => {
            const dx = gameState.player.x - (doc.x + doc.w/2);
            const dy = gameState.player.y - (doc.y + doc.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 60) {
                openModal(doc.title, doc.content);
            }
        });
    }

    function createParticles(x, y, color, count) {
        for(let i=0; i<count; i++) {
            gameState.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
                color: color
            });
        }
    }

    function update() {
        // Player Movement
        let dx = 0;
        let dy = 0;
        if (gameState.keys.w) dy -= PLAYER_SPEED;
        if (gameState.keys.s) dy += PLAYER_SPEED;
        if (gameState.keys.a) dx -= PLAYER_SPEED;
        if (gameState.keys.d) dx += PLAYER_SPEED;

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const nextX = gameState.player.x + dx;
        const nextY = gameState.player.y + dy;

        // Collision Detection (Walls & Closed Doors)
        let canMoveX = true;
        let canMoveY = true;
        const level = levels[gameState.currentLevel];
        const pSize = gameState.player.radius;

        // Check Walls
        level.walls.forEach(wall => {
            if (nextX + pSize > wall.x && nextX - pSize < wall.x + wall.w &&
                gameState.player.y + pSize > wall.y && gameState.player.y - pSize < wall.y + wall.h) {
                canMoveX = false;
            }
            if (gameState.player.x + pSize > wall.x && gameState.player.x - pSize < wall.x + wall.w &&
                nextY + pSize > wall.y && nextY - pSize < wall.y + wall.h) {
                canMoveY = false;
            }
        });

        // Check Doors (Solid if closed, Teleport if open)
        level.doors.forEach(door => {
            // Collision box
            if (nextX + pSize > door.x && nextX - pSize < door.x + door.w &&
                gameState.player.y + pSize > door.y && gameState.player.y - pSize < door.y + door.h) {
                
                if (door.hp > 0 && !door.open) {
                    canMoveX = false; // Solid
                } else if (door.open) {
                    // Enter door -> Switch level
                    loadLevel(door.target);
                    // Force stop this frame update to avoid glitch
                    return; 
                }
            }
            if (gameState.player.x + pSize > door.x && gameState.player.x - pSize < door.x + door.w &&
                nextY + pSize > door.y && nextY - pSize < door.y + door.h) {
                
                 if (door.hp > 0 && !door.open) {
                    canMoveY = false;
                } else if (door.open) {
                     loadLevel(door.target);
                     return;
                }
            }
        });

        if (canMoveX) gameState.player.x += dx;
        if (canMoveY) gameState.player.y += dy;

        // Boundaries
        if (gameState.player.x < pSize) gameState.player.x = pSize;
        if (gameState.player.y < pSize) gameState.player.y = pSize;
        if (gameState.player.x > canvas.width - pSize) gameState.player.x = canvas.width - pSize;
        if (gameState.player.y > canvas.height - pSize) gameState.player.y = canvas.height - pSize;


        // Update Attack
        if (gameState.player.attacking) {
            gameState.player.attackTimer--;
            if (gameState.player.attackTimer <= 0) {
                gameState.player.attacking = false;
            }
        }

        // Update Particles
        for(let i = gameState.particles.length - 1; i >= 0; i--) {
            let p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if(p.life <= 0) gameState.particles.splice(i, 1);
        }
    }

    function draw() {
        const level = levels[gameState.currentLevel];
        
        // Background
        ctx.fillStyle = level.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Walls
        ctx.fillStyle = '#111';
        level.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        });

        // Draw Doors
        level.doors.forEach(door => {
            if (door.hp > 0) {
                ctx.fillStyle = door.color;
                ctx.fillRect(door.x, door.y, door.w, door.h);
                
                // HP Bar
                ctx.fillStyle = 'red';
                ctx.fillRect(door.x, door.y - 10, door.w, 5);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(door.x, door.y - 10, door.w * (door.hp / door.maxHp), 5);

                // Label
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(door.label, door.x + door.w/2, door.y + door.h/2);
            } else {
                // Open door
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(door.x, door.y, door.w, door.h);
                // Portal effect
                ctx.strokeStyle = door.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(door.x, door.y, door.w, door.h);
            }
        });

        // Draw Documents
        level.docs.forEach(doc => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(doc.x, doc.y, doc.w, doc.h);
            // Lines representing text
            ctx.fillStyle = '#ccc';
            ctx.fillRect(doc.x + 5, doc.y + 10, doc.w - 10, 2);
            ctx.fillRect(doc.x + 5, doc.y + 18, doc.w - 10, 2);
            ctx.fillRect(doc.x + 5, doc.y + 26, doc.w - 20, 2);
        });

        // Draw Player
        ctx.save();
        ctx.translate(gameState.player.x, gameState.player.y);
        ctx.rotate(gameState.player.angle);

        // Body
        ctx.fillStyle = gameState.player.color;
        ctx.beginPath();
        ctx.arc(0, 0, gameState.player.radius, 0, Math.PI * 2);
        ctx.fill();

        // Sword (if attacking)
        if (gameState.player.attacking) {
            ctx.fillStyle = '#e2e8f0';
            // Swing animation
            const progress = 1 - (gameState.player.attackTimer / SWORD_SWING_DURATION);
            const swingAngle = -Math.PI/3 + (progress * Math.PI * 2/3); // -60deg to +60deg
            
            ctx.rotate(swingAngle);
            ctx.fillRect(10, -5, 40, 10); // Blade
            ctx.fillStyle = '#64748b';
            ctx.fillRect(10, -8, 5, 16); // Guard
            ctx.rotate(-swingAngle);
        } else {
            // Idle sword
             ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(10, 5, 20, 5);
        }

        ctx.restore();

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        
        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Area: ${gameState.currentLevel.toUpperCase()}`, 10, 20);
    }

    function gameLoop() {
        if (!gameState.paused) {
            update();
            draw();
        }
        requestAnimationFrame(gameLoop);
    }

    // --- Modal Logic ---
    function openModal(title, content) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.style.display = 'flex';
        gameState.paused = true;
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        gameState.paused = false;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            gameState.paused = false;
        }
    });

    // Start
    gameLoop();
});
