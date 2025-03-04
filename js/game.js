// 游戏常量
const GAME_STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
};

// 目标类型
const TARGET_TYPES = {
    BITCOIN: {
        name: '比特币',
        points: 10,
        speed: 2,
        size: 60,
        image: 'bitcoin.png'
    },
    ETHEREUM: {
        name: '以太坊',
        points: 15,
        speed: 2.5,
        size: 55,
        image: 'ethereum.png'
    },
    BLOCK: {
        name: '区块',
        points: 20,
        speed: 3,
        size: 65,
        image: 'block.png'
    },
    KEY: {
        name: '密钥',
        points: 25,
        speed: 3.5,
        size: 50,
        image: 'key.png'
    },
    WALLET: {
        name: '钱包',
        points: 30,
        speed: 4,
        size: 70,
        image: 'wallet.png'
    },
    TRAP: {
        name: '陷阱',
        points: -20,
        speed: 3,
        size: 60,
        image: 'trap.png'
    }
};

// 游戏类
class CryptoShooterGame {
    constructor() {
        // 获取DOM元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.restartButton = document.getElementById('restartButton');
        this.gameOverModal = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // 游戏状态
        this.gameState = GAME_STATE.MENU;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.targets = [];
        this.lastTargetTime = 0;
        this.targetInterval = 2000; // 初始目标生成间隔（毫秒）
        this.mouseX = 0;
        this.mouseY = 0;
        this.images = {};
        this.sounds = {};
        this.crosshair = { x: 0, y: 0 };
        
        // 设置画布尺寸
        this.resizeCanvas();
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 加载资源
        this.loadResources();
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.crosshair = { x: this.mouseX, y: this.mouseY };
        });
        
        // 鼠标点击（射击）
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === GAME_STATE.PLAYING) {
                this.shoot();
            }
        });
        
        // 开始按钮
        this.startButton.addEventListener('click', () => {
            if (this.gameState === GAME_STATE.MENU || this.gameState === GAME_STATE.GAME_OVER) {
                this.startGame();
            } else if (this.gameState === GAME_STATE.PAUSED) {
                this.resumeGame();
            }
        });
        
        // 暂停按钮
        this.pauseButton.addEventListener('click', () => {
            if (this.gameState === GAME_STATE.PLAYING) {
                this.pauseGame();
            } else if (this.gameState === GAME_STATE.PAUSED) {
                this.resumeGame();
            }
        });
        
        // 重新开始按钮
        this.restartButton.addEventListener('click', () => {
            this.gameOverModal.style.display = 'none';
            this.startGame();
        });
    }
    
    // 调整画布大小
    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
    
    // 加载游戏资源
    loadResources() {
        // 加载图片
        const imagePromises = [];
        
        // 加载目标图片
        for (const type in TARGET_TYPES) {
            const imgPromise = new Promise((resolve) => {
                const img = new Image();
                img.src = `images/${TARGET_TYPES[type].image}`;
                img.onload = () => {
                    this.images[type] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${TARGET_TYPES[type].image}`);
                    resolve(); // 即使加载失败也继续
                };
            });
            imagePromises.push(imgPromise);
        }
        
        // 加载准星图片
        const crosshairPromise = new Promise((resolve) => {
            const img = new Image();
            img.src = 'images/crosshair.png';
            img.onload = () => {
                this.images.crosshair = img;
                resolve();
            };
            img.onerror = () => {
                console.error('Failed to load crosshair image');
                resolve();
            };
        });
        imagePromises.push(crosshairPromise);
        
        // 加载背景图片
        const bgPromise = new Promise((resolve) => {
            const img = new Image();
            img.src = 'images/game-bg.jpg';
            img.onload = () => {
                this.images.background = img;
                resolve();
            };
            img.onerror = () => {
                console.error('Failed to load background image');
                resolve();
            };
        });
        imagePromises.push(bgPromise);
        
        // 当所有图片加载完成后，显示开始菜单
        Promise.all(imagePromises).then(() => {
            this.drawMenu();
        });
        
        // 加载音效
        this.sounds.shoot = new Audio('sounds/shoot.mp3');
        this.sounds.hit = new Audio('sounds/hit.mp3');
        this.sounds.miss = new Audio('sounds/miss.mp3');
        this.sounds.gameOver = new Audio('sounds/game-over.mp3');
        this.sounds.levelUp = new Audio('sounds/level-up.mp3');
    }
    
    // 开始游戏
    startGame() {
        this.gameState = GAME_STATE.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.targets = [];
        this.lastTargetTime = Date.now();
        this.targetInterval = 2000;
        
        this.updateUI();
        this.gameLoop();
    }
    
    // 暂停游戏
    pauseGame() {
        this.gameState = GAME_STATE.PAUSED;
        this.pauseButton.textContent = '继续';
        this.startButton.textContent = '继续';
    }
    
    // 恢复游戏
    resumeGame() {
        this.gameState = GAME_STATE.PLAYING;
        this.pauseButton.textContent = '暂停';
        this.startButton.textContent = '开始游戏';
        this.lastTargetTime = Date.now();
        this.gameLoop();
    }
    
    // 游戏结束
    gameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.style.display = 'flex';
        this.sounds.gameOver.play().catch(e => console.error('Error playing sound:', e));
    }
    
    // 更新UI
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.levelElement.textContent = this.level;
    }
    
    // 生成目标
    spawnTarget() {
        const now = Date.now();
        
        // 检查是否应该生成新目标
        if (now - this.lastTargetTime > this.targetInterval) {
            this.lastTargetTime = now;
            
            // 随机选择目标类型
            const typeKeys = Object.keys(TARGET_TYPES);
            const randomTypeIndex = Math.floor(Math.random() * typeKeys.length);
            const type = typeKeys[randomTypeIndex];
            
            // 随机位置（屏幕外）
            const side = Math.floor(Math.random() * 4); // 0: 上, 1: 右, 2: 下, 3: 左
            let x, y, dx, dy;
            
            switch (side) {
                case 0: // 上
                    x = Math.random() * this.canvas.width;
                    y = -TARGET_TYPES[type].size;
                    dx = (Math.random() - 0.5) * 2;
                    dy = Math.random() * TARGET_TYPES[type].speed;
                    break;
                case 1: // 右
                    x = this.canvas.width + TARGET_TYPES[type].size;
                    y = Math.random() * this.canvas.height;
                    dx = -Math.random() * TARGET_TYPES[type].speed;
                    dy = (Math.random() - 0.5) * 2;
                    break;
                case 2: // 下
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + TARGET_TYPES[type].size;
                    dx = (Math.random() - 0.5) * 2;
                    dy = -Math.random() * TARGET_TYPES[type].speed;
                    break;
                case 3: // 左
                    x = -TARGET_TYPES[type].size;
                    y = Math.random() * this.canvas.height;
                    dx = Math.random() * TARGET_TYPES[type].speed;
                    dy = (Math.random() - 0.5) * 2;
                    break;
            }
            
            // 创建新目标
            const target = {
                x,
                y,
                dx,
                dy,
                type,
                size: TARGET_TYPES[type].size,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };
            
            this.targets.push(target);
            
            // 根据等级调整生成间隔
            this.targetInterval = Math.max(500, 2000 - (this.level - 1) * 200);
        }
    }
    
    // 更新目标
    updateTargets() {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            
            // 更新位置
            target.x += target.dx;
            target.y += target.dy;
            target.rotation += target.rotationSpeed;
            
            // 检查是否超出屏幕
            const isOutOfBounds = 
                target.x < -target.size * 2 || 
                target.x > this.canvas.width + target.size * 2 || 
                target.y < -target.size * 2 || 
                target.y > this.canvas.height + target.size * 2;
            
            if (isOutOfBounds) {
                this.targets.splice(i, 1);
            }
        }
    }
    
    // 射击
    shoot() {
        this.sounds.shoot.currentTime = 0;
        this.sounds.shoot.play().catch(e => console.error('Error playing sound:', e));
        
        let hit = false;
        
        // 检查是否击中目标
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            const dx = target.x - this.mouseX;
            const dy = target.y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < target.size / 2) {
                // 击中目标
                hit = true;
                
                // 更新分数
                this.score += TARGET_TYPES[target.type].points;
                
                // 如果击中陷阱，减少生命值
                if (target.type === 'TRAP') {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }
                
                // 移除目标
                this.targets.splice(i, 1);
                
                // 播放击中音效
                this.sounds.hit.currentTime = 0;
                this.sounds.hit.play().catch(e => console.error('Error playing sound:', e));
                
                // 检查是否升级
                if (this.score >= this.level * 100) {
                    this.level++;
                    this.sounds.levelUp.play().catch(e => console.error('Error playing sound:', e));
                }
                
                this.updateUI();
                break;
            }
        }
        
        if (!hit) {
            // 未击中任何目标
            this.sounds.miss.currentTime = 0;
            this.sounds.miss.play().catch(e => console.error('Error playing sound:', e));
        }
    }
    
    // 绘制菜单
    drawMenu() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制标题
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('加密世界射击游戏', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 绘制提示
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('点击"开始游戏"按钮开始', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    // 绘制游戏
    drawGame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制目标
        for (const target of this.targets) {
            this.ctx.save();
            this.ctx.translate(target.x, target.y);
            this.ctx.rotate(target.rotation);
            
            if (this.images[target.type]) {
                this.ctx.drawImage(
                    this.images[target.type],
                    -target.size / 2,
                    -target.size / 2,
                    target.size,
                    target.size
                );
            } else {
                // 如果图片未加载，绘制占位符
                this.ctx.fillStyle = '#00ffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, target.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        // 绘制准星
        if (this.images.crosshair) {
            this.ctx.drawImage(
                this.images.crosshair,
                this.crosshair.x - 25,
                this.crosshair.y - 25,
                50,
                50
            );
        } else {
            // 如果准星图片未加载，绘制简单准星
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
            this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
            this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
            this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(this.crosshair.x, this.crosshair.y, 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 如果游戏暂停，绘制暂停文本
        if (this.gameState === GAME_STATE.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('点击"继续"按钮恢复游戏', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    // 游戏主循环
    gameLoop() {
        if (this.gameState !== GAME_STATE.PLAYING) {
            return;
        }
        
        // 生成目标
        this.spawnTarget();
        
        // 更新目标
        this.updateTargets();
        
        // 绘制游戏
        this.drawGame();
        
        // 继续循环
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 当页面加载完成后初始化游戏
window.addEventListener('load', () => {
    // 创建目录结构
    const directories = ['images', 'sounds'];
    
    // 显示缺少资源的警告
    console.warn('游戏需要以下资源文件:');
    console.warn('- images/bitcoin.png');
    console.warn('- images/ethereum.png');
    console.warn('- images/block.png');
    console.warn('- images/key.png');
    console.warn('- images/wallet.png');
    console.warn('- images/trap.png');
    console.warn('- images/crosshair.png');
    console.warn('- images/game-bg.jpg');
    console.warn('- images/background.jpg');
    console.warn('- sounds/shoot.mp3');
    console.warn('- sounds/hit.mp3');
    console.warn('- sounds/miss.mp3');
    console.warn('- sounds/game-over.mp3');
    console.warn('- sounds/level-up.mp3');
    
    // 初始化游戏
    const game = new CryptoShooterGame();
}); 