document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-modal');

    // Mobile Control Buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnInteract = document.getElementById('btn-interact');
    const btnAttack = document.getElementById('btn-attack');

    // Visibility Observer for Mobile Controls
    const gameSection = document.getElementById('cv-game');
    const mobileControls = document.getElementById('mobile-controls');
    if (gameSection && mobileControls) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    mobileControls.classList.add('active');
                } else {
                    mobileControls.classList.remove('active');
                }
            });
        }, { threshold: 0.1 });
        observer.observe(gameSection);
    }

    // --- Game Constants & State ---
    const TILE_SIZE = 50;
    const PLAYER_SPEED = 4;
    const SWORD_RANGE = 60;
    const SWORD_SWING_DURATION = 15; // frames

    const COLORS = {
        wall: '#111',
        door: {
            closed: '#3b82f6',
            open: 'rgba(0,0,0,0.5)'
        },
        text: '#fff',
        doc: '#fff',
        background: '#2d2d2d'
    };

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
        mobileKeys: { w: false, a: false, s: false, d: false },
        mouse: { x: 0, y: 0, leftDown: false, rightDown: false },
        entities: [],
        particles: [],
        interactableDoc: null
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
                {x: 100, y: 150, w: 40, h: 40, title: 'Amadeus (via ALTEN) (2024-Present)', content: '<h3>Backend Software Developer & Scrum Master</h3><p>Develop features for Revenue Management Solutions Train (SAFe) using C++, Bash, Git, Jenkins, MongoDB.</p><p>Scrum Master facilitating ceremonies and coordinating with management.</p>'},
                {x: 650, y: 150, w: 40, h: 40, title: 'Coding Giants (2023-2024)', content: '<h3>Coding Teacher</h3><p>Role: Teaching basics of coding and videogame programming to kids (Scratch, Minecraft Education).</p>'},
                {x: 350, y: 300, w: 40, h: 40, title: 'Agriturismo Il Lago dei Sogni (2013-2021)', content: '<h3>Waiter & Support Staff</h3><p>Managed customer interactions and supported kitchen operations.</p>'}
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
                {x: 200, y: 150, w: 40, h: 40, title: 'LUT University (Finland)', content: '<h3>MSc in Technology</h3><p><b>Computational Engineering:</b> Computer Vision & Pattern Recognition.</p><p>Tags: Machine Learning, UX Design, GPGPU Computing.</p>'},
                {x: 550, y: 150, w: 40, h: 40, title: 'Politecnico di Milano', content: '<h3>MSc Computer Science & Engineering</h3><p>Grade: 92/110. Specialization in AI.</p><p>Thesis: "Human Micro Gesture Recognition by Adversarial Training".</p>'},
                {x: 375, y: 350, w: 40, h: 40, title: 'Unimore', content: '<h3>Bachelor Computer Engineering</h3><p>Grade: 93/110.</p><p>Thesis: "Drivers Manager Project" (Django).</p>'}
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
                {x: 250, y: 250, w: 40, h: 40, title: 'Kiyo and the Unreliable Hero', content: '<h3>Videogame Beta (Unity/C#)</h3><p>Winner of InsertCoin 2021.</p><p>Team project developed in 3 months. Available on Itch.io.</p><p><a href="https://polimi-game-collective.itch.io/kiyo-and-the-unreliable-hero" target="_blank" style="color: #60a5fa">Play Here</a></p>'},
                {x: 500, y: 250, w: 40, h: 40, title: 'CGRed - Vulkan Engine', content: '<h3>Platform Maker (C++/Vulkan)</h3><p>Low-level graphics programming project.</p><p>Demonstration of custom game engine capabilities.</p><p><a href="https://youtu.be/1tNf1K6NSZ0" target="_blank" style="color: #60a5fa">Watch Video</a></p>'}
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
                {x: 150, y: 150, w: 40, h: 40, title: 'Advanced Skills', content: '<h3>Tech Stack</h3><ul><li>C++</li><li>Python</li><li>Bash & Git</li><li>C# & Unity</li><li>Agile / SAFe / Jira</li></ul>'},
                {x: 450, y: 150, w: 40, h: 40, title: 'Good Knowledge', content: '<h3>Tools & Frameworks</h3><ul><li>CI/CD (Jenkins)</li><li>Cloud</li><li>MongoDB</li><li>Web (Django, HTML/CSS)</li><li>Vulkan</li></ul>'},
                {x: 150, y: 350, w: 40, h: 40, title: 'Languages', content: '<h3>Spoken Languages</h3><ul><li>Italian (Native)</li><li>English (C1 Proficient)</li><li>French (B2 Upper-Intermediate)</li></ul>'},
                {x: 450, y: 350, w: 40, h: 40, title: 'Interests', content: '<h3>Hobbies</h3><ul><li>Videogame Design & Programming</li><li>Video Editing</li></ul>'}
            ]
        }
    };

    // --- Input Handling ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = true;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = true;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = true;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = true;
        if (e.key === 'e' || e.key === 'E') {
            if (!gameState.keys.e) { // Trigger only on first press (debounce hold)
                gameState.keys.e = true;
                interact();
            }
        }
        
        // Prevent scrolling with arrows/space if canvas is focused (simplified by checking key)
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " ", "e", "E"].indexOf(e.key) > -1) {
            // Check if user is typing in some input else prevent default
            // Here we assume game focus, so prevent
             if(document.activeElement === document.body || document.activeElement === canvas) {
                 // e.preventDefault(); // E usually doesn't scroll, but good practice
             }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = false;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = false;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = false;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = false;
        if (e.key === 'e' || e.key === 'E') gameState.keys.e = false;
    });

    // Mobile Inputs
    function setupMobileBtn(btn, key) {
        if(!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.mobileKeys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); gameState.mobileKeys[key] = false; });
        btn.addEventListener('mousedown', (e) => { gameState.mobileKeys[key] = true; });
        btn.addEventListener('mouseup', (e) => { gameState.mobileKeys[key] = false; });
    }
    setupMobileBtn(btnUp, 'w');
    setupMobileBtn(btnDown, 's');
    setupMobileBtn(btnLeft, 'a');
    setupMobileBtn(btnRight, 'd');

    if(btnAttack) {
        btnAttack.addEventListener('touchstart', (e) => { e.preventDefault(); attack(); }); 
        btnAttack.addEventListener('mousedown', (e) => { attack(); });
    }
    if(btnInteract) {
        btnInteract.addEventListener('touchstart', (e) => { e.preventDefault(); interact(); });
        btnInteract.addEventListener('mousedown', (e) => { interact(); });
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouse.x = e.clientX - rect.left;
        gameState.mouse.y = e.clientY - rect.top;
        
        // Update angle only if using mouse (not overriding mobile)
        const dx = gameState.mouse.x - gameState.player.x;
        const dy = gameState.mouse.y - gameState.player.y;
        gameState.player.angle = Math.atan2(dy, dx);
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left Click
            gameState.mouse.leftDown = true;
            attack();
        }
    });
    
    // Check for right click only to NOT prevent default context menu
    // But we don't want game actions on right click
    /*
    canvas.addEventListener('contextmenu', e => {
        // e.preventDefault(); // ALLOW CONTEXT MENU
    });
    */

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) gameState.mouse.leftDown = false;
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
        // If modal is open, close it
        if (gameState.paused) {
            closeModal();
            return;
        }

        const level = levels[gameState.currentLevel];
        // Check for documents nearby
        level.docs.forEach(doc => {
            const dx = gameState.player.x - (doc.x + doc.w/2);
            const dy = gameState.player.y - (doc.y + doc.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

             // Check if mouse is near/over (Desktop logic updated)
             // Relaxed logic: If the player is close enough AND aiming near it OR mouse is over it
            const mouseOver = (
                gameState.mouse.x > doc.x && 
                gameState.mouse.x < doc.x + doc.w &&
                gameState.mouse.y > doc.y && 
                gameState.mouse.y < doc.y + doc.h
            );
            
            // Aim check (dot product)
            const angleToDoc = Math.atan2(doc.y + doc.h/2 - gameState.player.y, doc.x + doc.w/2 - gameState.player.x);
            const angleDiff = Math.abs(angleToDoc - gameState.player.angle);
            // Normalized angle diff
            const facing = angleDiff < 1.0 || angleDiff > 5.28; // ~60 degrees cone

            if (dist < 80) {
                 // Open if: Mouse is over OR (Player is close AND facing mostly towards it)
                 // This makes "aiming" with cursor naturally work if cursor is near doc
                if (mouseOver || facing || gameState.mobileKeys.w || gameState.mobileKeys.a || gameState.mobileKeys.s || gameState.mobileKeys.d || true) {
                     openModal(doc.title, doc.content);
                }
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

    function checkInteractables() {
        const level = levels[gameState.currentLevel];
        let closestDoc = null;
        let closestDist = 9999;

        level.docs.forEach(doc => {
            const dx = gameState.player.x - (doc.x + doc.w/2);
            const dy = gameState.player.y - (doc.y + doc.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 60 && dist < closestDist) {
                closestDist = dist;
                closestDoc = doc;
            }
        });

        gameState.interactableDoc = closestDoc;
    }

    function update() {
        // Player Movement (Merge keyboard and mobile)
        let dx = 0;
        let dy = 0;
        
        const w = gameState.keys.w || gameState.mobileKeys.w;
        const s = gameState.keys.s || gameState.mobileKeys.s;
        const a = gameState.keys.a || gameState.mobileKeys.a;
        const d = gameState.keys.d || gameState.mobileKeys.d;

        if (w) dy -= PLAYER_SPEED;
        if (s) dy += PLAYER_SPEED;
        if (a) dx -= PLAYER_SPEED;
        if (d) dx += PLAYER_SPEED;

        // Auto-orient angle if using mobile keys (since there's no mouse)
        if ((gameState.mobileKeys.w || gameState.mobileKeys.a || gameState.mobileKeys.s || gameState.mobileKeys.d) && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
             gameState.player.angle = Math.atan2(dy, dx);
        }

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const nextX = gameState.player.x + dx;
        const nextY = gameState.player.y + dy;

        // Reset interactable status each frame
        checkInteractables();

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
        ctx.fillStyle = COLORS.wall; 
        level.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        });

        // Draw Doors
        level.doors.forEach(door => {
            if (door.hp > 0) {
                ctx.fillStyle = door.color;
                ctx.fillRect(door.x, door.y, door.w, door.h);
                
                // HP Bar
                ctx.fillStyle = '#ef4444'; // Red
                ctx.fillRect(door.x, door.y - 10, door.w, 5);
                ctx.fillStyle = '#22c55e'; // Green
                ctx.fillRect(door.x, door.y - 10, door.w * (door.hp / door.maxHp), 5);

                // Label
                ctx.fillStyle = COLORS.text;
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
            // Highlight if interactable
            if (gameState.interactableDoc === doc) {
                ctx.strokeStyle = '#fbbf24'; // Amber
                ctx.lineWidth = 3;
                ctx.strokeRect(doc.x - 2, doc.y - 2, doc.w + 4, doc.h + 4);
                
                // Prompt
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Press E", doc.x + doc.w/2, doc.y - 20);
            }

            ctx.fillStyle = COLORS.doc;
            ctx.fillRect(doc.x, doc.y, doc.w, doc.h);
            // Lines representation
            ctx.fillStyle = '#9ca3af';
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
        
        // Area Text
        ctx.fillStyle = COLORS.text;
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

    function closeModal() {
        modal.style.display = 'none';
        gameState.paused = false;
    }

    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Start
    gameLoop();
});
