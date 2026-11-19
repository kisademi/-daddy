import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerStats, NPC } from '../types';
import { playSound } from '../utils/audio';
import { Coins, AlertTriangle, Shield, Pause, Play, ArrowUp, ArrowDown } from 'lucide-react';

interface ParkourModeProps {
  onComplete: (success: boolean, lostMilk: number, earnedMoney: number) => void;
  chaser: NPC;
  stats: PlayerStats;
}

interface Obstacle {
  id: number;
  x: number;
  type: 'rock' | 'barrier' | 'owl' | 'coin' | 'milk';
  width: number;
  height: number;
  yOffset: number; // height above ground
}

interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const DURATION_SECONDS = 16;
const GRAVITY = 2150;
const JUMP_VELOCITY = -760;

const ParkourMode: React.FC<ParkourModeProps> = ({ onComplete, chaser, stats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<'PLAYING' | 'PAUSED' | 'FINISHED'>('PLAYING');
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
  const [milkLost, setMilkLost] = useState(0);
  const [moneyEarned, setMoneyEarned] = useState(0);
  const [uniformCharges, setUniformCharges] = useState(stats.equippedItem === 'uniform' ? 3 : 0);
  const [resultSuccess, setResultSuccess] = useState(false);

  // Mutable simulation state inside refs so 60fps loop has zero stale closures
  const simRef = useRef({
    status: 'PLAYING' as 'PLAYING' | 'PAUSED' | 'FINISHED',
    timeLeft: DURATION_SECONDS,
    playerY: 0, // 0 = ground, negative = in air
    playerVelY: 0,
    jumpsUsed: 0,
    isSliding: false,
    slideTimer: 0,
    milkLost: 0,
    milkRecovered: 0,
    moneyEarned: 0,
    uniformCharges: stats.equippedItem === 'uniform' ? 3 : 0,
    scrollX: 0,
    spawnCooldown: 0.7,
    shakeTime: 0,
    invulnTime: 0,
    obstacles: [] as Obstacle[],
    popups: [] as FloatingPopup[],
    nextId: 1,
  });

  const isApron = stats.equippedItem === 'apron';
  const isCloak = stats.equippedItem === 'cloak';
  const baseSpeed = isCloak ? 520 : 410;

  useEffect(() => {
    playSound('alert');
  }, []);

  const triggerJump = useCallback(() => {
    const s = simRef.current;
    if (s.status !== 'PLAYING') return;
    if (s.jumpsUsed < 2) {
      s.isSliding = false;
      s.slideTimer = 0;
      s.playerVelY = s.jumpsUsed === 0 ? JUMP_VELOCITY : JUMP_VELOCITY * 0.88;
      s.jumpsUsed += 1;
      playSound('jump');
    }
  }, []);

  const triggerSlide = useCallback(() => {
    const s = simRef.current;
    if (s.status !== 'PLAYING') return;
    if (s.playerY < -5) {
      // Fast drop in mid-air
      s.playerVelY = Math.max(s.playerVelY, 550);
    }
    s.isSliding = true;
    s.slideTimer = 0.65;
    playSound('click');
  }, []);

  const togglePause = useCallback(() => {
    const s = simRef.current;
    if (s.status === 'FINISHED') return;
    const next = s.status === 'PLAYING' ? 'PAUSED' : 'PLAYING';
    s.status = next;
    setGameState(next);
  }, []);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      } else if (e.key === 's' || e.key === 'S' || e.code === 'ArrowDown') {
        e.preventDefault();
        triggerSlide();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerJump, triggerSlide, togglePause]);

  // Main 60fps Canvas Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const finish = (success: boolean) => {
      const s = simRef.current;
      s.status = 'FINISHED';
      setResultSuccess(success);
      setGameState('FINISHED');
      const netLost = Math.max(0, s.milkLost - s.milkRecovered);
      setMilkLost(netLost);
      setMoneyEarned(s.moneyEarned);
      playSound(success ? 'success' : 'fail');
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = simRef.current;

      if (s.status === 'PLAYING') {
        s.timeLeft = Math.max(0, s.timeLeft - dt);
        setTimeLeft(s.timeLeft);

        if (s.timeLeft <= 0) {
          finish(true);
        }

        s.scrollX += baseSpeed * dt;
        if (s.shakeTime > 0) s.shakeTime = Math.max(0, s.shakeTime - dt);
        if (s.invulnTime > 0) s.invulnTime = Math.max(0, s.invulnTime - dt);

        // Slide timer
        if (s.isSliding) {
          s.slideTimer -= dt;
          if (s.slideTimer <= 0) {
            s.isSliding = false;
          }
        }

        // Player vertical physics
        s.playerVelY += GRAVITY * dt;
        s.playerY += s.playerVelY * dt;
        if (s.playerY >= 0) {
          s.playerY = 0;
          s.playerVelY = 0;
          s.jumpsUsed = 0;
        }

        // Spawn obstacles & pickups
        s.spawnCooldown -= dt;
        if (s.spawnCooldown <= 0) {
          const r = Math.random();
          const id = s.nextId++;
          if (r < 0.24) {
            // Coin arc
            const arcHeight = Math.random() > 0.5 ? 85 : 22;
            s.obstacles.push(
              { id: id, x: canvas.width + 40, type: 'coin', width: 28, height: 28, yOffset: arcHeight },
              { id: id + 1000, x: canvas.width + 92, type: 'coin', width: 28, height: 28, yOffset: arcHeight + 18 },
              { id: id + 2000, x: canvas.width + 144, type: 'coin', width: 28, height: 28, yOffset: arcHeight }
            );
            s.spawnCooldown = 0.85;
          } else if (r < 0.31) {
            // Rare Milk pickup
            s.obstacles.push({
              id,
              x: canvas.width + 40,
              type: 'milk',
              width: 32,
              height: 36,
              yOffset: 75,
            });
            s.spawnCooldown = 0.9;
          } else if (r < 0.55) {
            // High flying night owl (requires slide or staying low)
            s.obstacles.push({
              id,
              x: canvas.width + 40,
              type: 'owl',
              width: 52,
              height: 38,
              yOffset: 54,
            });
            s.spawnCooldown = isCloak ? 0.92 : 1.08;
          } else if (r < 0.78) {
            // Tall roadblock
            s.obstacles.push({
              id,
              x: canvas.width + 40,
              type: 'barrier',
              width: 44,
              height: 66,
              yOffset: 0,
            });
            s.spawnCooldown = isCloak ? 0.95 : 1.12;
          } else {
            // Low rock
            s.obstacles.push({
              id,
              x: canvas.width + 40,
              type: 'rock',
              width: 42,
              height: 36,
              yOffset: 0,
            });
            s.spawnCooldown = isCloak ? 0.85 : 1.0;
          }
        }

        // Move obstacles & check collisions
        const playerX = 210;
        const playerW = 42;
        const playerH = s.isSliding ? 32 : 62;
        const pLeft = playerX - playerW / 2;
        const pRight = playerX + playerW / 2;
        const pBottom = -s.playerY; // height above ground (>= 0)
        const pTop = pBottom + playerH;

        const kept: Obstacle[] = [];
        for (const obs of s.obstacles) {
          obs.x -= baseSpeed * dt;
          if (obs.x < -80) continue;

          const oLeft = obs.x - obs.width / 2;
          const oRight = obs.x + obs.width / 2;
          const oBottom = obs.yOffset;
          const oTop = obs.yOffset + obs.height;

          const overlaps =
            pLeft < oRight && pRight > oLeft && pBottom < oTop && pTop > oBottom;

          if (overlaps) {
            if (obs.type === 'coin') {
              const val = isApron ? 20 : 10;
              s.moneyEarned += val;
              setMoneyEarned(s.moneyEarned);
              playSound('coin');
              s.popups.push({
                id: s.nextId++,
                x: playerX,
                y: 320 + s.playerY - 60,
                text: `+¥${val}`,
                color: '#facc15',
                life: 0.75,
              });
              continue;
            }
            if (obs.type === 'milk') {
              s.milkRecovered += 8;
              setMilkLost(Math.max(0, s.milkLost - s.milkRecovered));
              playSound('heart');
              s.popups.push({
                id: s.nextId++,
                x: playerX,
                y: 320 + s.playerY - 60,
                text: '+8% 牛奶',
                color: '#f472b6',
                life: 0.85,
              });
              continue;
            }

            // Hazard collision
            if (s.invulnTime <= 0) {
              if (s.uniformCharges > 0) {
                s.uniformCharges -= 1;
                s.invulnTime = 0.65;
                setUniformCharges(s.uniformCharges);
                playSound('shield');
                s.popups.push({
                  id: s.nextId++,
                  x: playerX,
                  y: 320 + s.playerY - 65,
                  text: '制服格挡!',
                  color: '#60a5fa',
                  life: 0.8,
                });
              } else {
                const dmg = isApron ? 20 : 10;
                s.milkLost += dmg;
                s.invulnTime = 0.7;
                s.shakeTime = 0.25;
                const netLost = Math.max(0, s.milkLost - s.milkRecovered);
                setMilkLost(netLost);
                playSound('fail');
                s.popups.push({
                  id: s.nextId++,
                  x: playerX,
                  y: 320 + s.playerY - 65,
                  text: `-${dmg}% 能量`,
                  color: '#f87171',
                  life: 0.85,
                });

                if (stats.milk - netLost <= 0) {
                  finish(false);
                }
              }
            }
            continue;
          }

          kept.push(obs);
        }
        s.obstacles = kept;

        // Update popups
        s.popups = s.popups
          .map((p) => ({ ...p, y: p.y - 48 * dt, life: p.life - dt }))
          .filter((p) => p.life > 0);
      }

      // --- DRAW SCENE ---
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 92;

      ctx.save();
      if (s.shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      }

      // Night sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#090d1f');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Moon
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(w - 110, 95, 32, 0, Math.PI * 2);
      ctx.fill();

      // Parallax distant skyline
      ctx.fillStyle = '#17203d';
      const farOffset = (s.scrollX * 0.2) % 180;
      for (let x = -farOffset; x < w + 180; x += 180) {
        ctx.fillRect(x, groundY - 140, 68, 140);
        ctx.fillRect(x + 76, groundY - 95, 52, 95);
        ctx.fillRect(x + 134, groundY - 170, 42, 170);
      }

      // Streetlamps
      const lampSpacing = 300;
      const lampOffset = (s.scrollX * 0.65) % lampSpacing;
      for (let x = -lampOffset; x < w + lampSpacing; x += lampSpacing) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, groundY - 150, 6, 150);
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(x + 3, groundY - 152, 10, 0, Math.PI * 2);
        ctx.fill();
        const glow = ctx.createRadialGradient(x + 3, groundY - 152, 4, x + 3, groundY - 152, 85);
        glow.addColorStop(0, 'rgba(253, 230, 138, 0.24)');
        glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x + 3, groundY - 152, 85, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(0, groundY, w, 5);

      // Scrolling road dashes
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      const dashOffset = s.scrollX % 90;
      for (let x = -dashOffset; x < w + 90; x += 90) {
        ctx.fillRect(x, groundY + 38, 46, 5);
      }

      // Chaser Sprite (closer as net milk lost increases)
      const netLost = Math.max(0, s.milkLost - s.milkRecovered);
      const chaserX = Math.min(145, 58 + netLost * 1.4);
      const chaserBounce = Math.abs(Math.sin(s.scrollX * 0.03)) * 8;
      ctx.font = '68px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const chaserEmoji = chaser.species === 'Wolf' ? '🐺' : chaser.species === 'Tiger' ? '🐯' : '🦊';
      ctx.fillText(chaserEmoji, chaserX, groundY - chaserBounce);

      // Obstacles & Collectibles
      for (const obs of s.obstacles) {
        const drawY = groundY - obs.yOffset;
        if (obs.type === 'coin') {
          const bob = Math.sin(now * 0.008 + obs.id) * 4;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(obs.x, drawY - obs.height / 2 + bob, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = '#854d0e';
          ctx.font = 'bold 14px sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText('¥', obs.x, drawY - obs.height / 2 + bob + 1);
        } else if (obs.type === 'milk') {
          ctx.font = '32px sans-serif';
          ctx.textBaseline = 'bottom';
          ctx.fillText('🥛', obs.x, drawY);
        } else if (obs.type === 'owl') {
          ctx.font = '40px sans-serif';
          ctx.textBaseline = 'bottom';
          const flap = Math.sin(now * 0.015 + obs.id) * 4;
          ctx.fillText('🦅', obs.x, drawY + flap);
        } else if (obs.type === 'barrier') {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(obs.x - obs.width / 2, drawY - obs.height, obs.width, obs.height);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(obs.x - obs.width / 2 + 4, drawY - obs.height + 10, obs.width - 8, 10);
          ctx.fillRect(obs.x - obs.width / 2 + 4, drawY - obs.height + 34, obs.width - 8, 10);
        } else {
          ctx.font = '38px sans-serif';
          ctx.textBaseline = 'bottom';
          ctx.fillText('🪨', obs.x, drawY);
        }
      }

      // Draw Rabbit Dad Player
      const playerX = 210;
      const py = groundY + s.playerY;
      ctx.save();
      if (s.invulnTime > 0 && Math.floor(now / 70) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      if (s.uniformCharges > 0) {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(playerX, py - (s.isSliding ? 18 : 34), 36, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.translate(playerX, py);
      if (s.isSliding) {
        ctx.scale(1.15, 0.55);
      } else if (s.playerY < -2) {
        ctx.rotate(-0.15);
      }

      // Ears
      ctx.fillStyle = '#fff1f2';
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(-6, -62, 5, 14, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(6, -62, 5, 14, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(0, -43, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(6, -45, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = stats.equippedItem === 'uniform' ? '#1e3a8a' : stats.equippedItem === 'apron' ? '#7dd3fc' : '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(-12, -30, 24, 24, 8);
      ctx.fill();
      ctx.stroke();

      // Running legs
      const legSwing = Math.sin(s.scrollX * 0.04) * 7;
      ctx.fillStyle = '#fff1f2';
      ctx.beginPath();
      ctx.ellipse(-5 + legSwing, -4, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(5 - legSwing, -4, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Floating Popups
      for (const p of s.popups) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      if (s.status !== 'FINISHED') {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [baseSpeed, chaser.species, isApron, isCloak, stats.equippedItem, stats.milk]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* Responsive Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        onClick={triggerJump}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Parkour In-Game HUD */}
      <div className="absolute top-20 right-4 z-30 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl border border-slate-700 font-bold text-lg shadow-lg tabular-nums">
            <span className={timeLeft < 5 ? 'text-rose-400' : 'text-sky-300'}>
              逃脱倒计时 {timeLeft.toFixed(1)}s
            </span>
          </div>
          <button
            type="button"
            onClick={togglePause}
            className="h-11 w-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center cursor-pointer"
            aria-label="暂停游戏"
          >
            {gameState === 'PAUSED' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 text-amber-300 px-3.5 py-1.5 rounded-xl border border-amber-500/40 font-bold text-sm shadow flex items-center gap-1.5 tabular-nums">
            <Coins className="w-4 h-4" />
            <span>+¥{moneyEarned}</span>
          </div>
          <div className="bg-slate-900/90 text-rose-300 px-3.5 py-1.5 rounded-xl border border-rose-500/40 font-bold text-sm shadow flex items-center gap-1.5 tabular-nums">
            <AlertTriangle className="w-4 h-4" />
            <span>-{milkLost}% 能量</span>
          </div>
          {uniformCharges > 0 && (
            <div className="bg-sky-900/90 text-sky-200 px-3.5 py-1.5 rounded-xl border border-sky-400/50 font-bold text-sm shadow flex items-center gap-1.5 tabular-nums">
              <Shield className="w-4 h-4" />
              <span>护盾 x{uniformCharges}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Touch & Keyboard Controls */}
      <div className="absolute bottom-5 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/75 text-slate-200 px-4 py-2 rounded-xl border border-white/10 text-xs font-medium hidden sm:block">
          [W / ↑ / 空格] 跳跃 (支持二段跳) · [S / ↓] 滑铲躲避高空猫头鹰 · [P] 暂停
        </div>
        <div className="flex items-center gap-3 ml-auto pointer-events-auto">
          <button
            type="button"
            onClick={triggerSlide}
            className="h-12 px-5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-600 font-bold text-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowDown className="w-4 h-4" />
            <span>滑铲 [S]</span>
          </button>
          <button
            type="button"
            onClick={triggerJump}
            className="h-12 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white border border-pink-400 font-bold text-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowUp className="w-4 h-4" />
            <span>跳跃 [W]</span>
          </button>
        </div>
      </div>

      {/* Pause Overlay */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-sm w-full">
            <h2 className="text-3xl font-black text-white mb-2">游戏暂停</h2>
            <p className="text-slate-300 text-sm mb-6">
              {chaser.name}正在身后紧追不舍！
            </p>
            <button
              type="button"
              onClick={togglePause}
              className="w-full py-3 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-base cursor-pointer"
            >
              继续奔跑
            </button>
          </div>
        </div>
      )}

      {/* Finished Overlay */}
      {gameState === 'FINISHED' && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <h2 className={`text-4xl font-black mb-2 ${resultSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
              {resultSuccess ? '逃脱成功！' : '体力耗尽被抓住了！'}
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              {resultSuccess
                ? `你成功甩开了${chaser.name}的追逐，保住了珍贵的牛奶！`
                : `${chaser.name}追上了体力不支的你……`}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-rose-500/30">
                <div className="text-xs text-slate-400 mb-1">净损失能量</div>
                <div className="text-2xl font-black text-rose-400 tabular-nums">-{milkLost}%</div>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-amber-500/30">
                <div className="text-xs text-slate-400 mb-1">捡到私房钱</div>
                <div className="text-2xl font-black text-amber-300 tabular-nums">+¥{moneyEarned}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onComplete(resultSuccess, milkLost, moneyEarned)}
              className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base transition-transform hover:scale-[1.02] cursor-pointer"
            >
              继续旅程
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkourMode;
