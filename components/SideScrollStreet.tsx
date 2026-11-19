import React, { useEffect, useRef, useState } from 'react';
import { LocationType, NPC, PlayerStats } from '../types';
import { LOCATIONS } from '../constants';
import PortraitAvatar from './PortraitAvatar';
import { playSound } from '../utils/audio';
import {
  Home,
  GraduationCap,
  ShoppingBag,
  Beer,
  Store,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Moon,
  HeartHandshake,
  AlertTriangle,
} from 'lucide-react';

interface StreetPickup {
  id: number;
  x: number;
  type: 'coin' | 'milk';
}

interface SideScrollStreetProps {
  stats: PlayerStats;
  npcs: Record<LocationType, NPC>;
  currentLocation: LocationType;
  onSelectLocation: (loc: LocationType) => void;
  onStreetPickup: (type: 'coin' | 'milk') => void;
  disabled?: boolean;
}

const WORLD_WIDTH = 2450;
const PLAYER_SPEED = 430;
const INTERACT_DISTANCE = 105;

const SideScrollStreet: React.FC<SideScrollStreetProps> = ({
  stats,
  npcs,
  currentLocation,
  onSelectLocation,
  onStreetPickup,
  disabled = false,
}) => {
  const [playerX, setPlayerX] = useState<number>(() => LOCATIONS[currentLocation]?.xPos ?? 220);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  // Street Pickups that refresh on timeSlot changes
  const [pickups, setPickups] = useState<StreetPickup[]>([]);

  useEffect(() => {
    const spots = [450, 940, 1450, 1940];
    const generated: StreetPickup[] = spots
      .filter(() => Math.random() > 0.35)
      .map((x, i) => ({
        id: Date.now() + i,
        x: x + Math.round((Math.random() - 0.5) * 80),
        type: Math.random() > 0.3 ? 'coin' : 'milk',
      }));
    setPickups(generated);
  }, [stats.day, stats.timeSlot]);

  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const playerXRef = useRef(playerX);
  const autoTargetRef = useRef<{ x: number; loc: LocationType } | null>(null);

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleLocations = Object.values(LocationType).filter(
    (loc) => loc !== LocationType.MY_SHOP || stats.hasShop
  );

  const nearbyLoc = visibleLocations.find(
    (loc) => Math.abs(LOCATIONS[loc].xPos - playerX) <= INTERACT_DISTANCE
  );

  // Check street pickup collection when Rabbit Dad walks past them
  useEffect(() => {
    if (pickups.length === 0) return;
    const hit = pickups.find((p) => Math.abs(p.x - playerX) < 38);
    if (hit) {
      playSound(hit.type === 'coin' ? 'coin' : 'heart');
      setPickups((prev) => prev.filter((p) => p.id !== hit.id));
      onStreetPickup(hit.type);
    }
  }, [playerX, pickups, onStreetPickup]);

  // Keyboard movement & Enter/E to enter nearby building
  useEffect(() => {
    if (disabled) {
      keysRef.current.left = false;
      keysRef.current.right = false;
      setIsMoving(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
        autoTargetRef.current = null;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
        autoTargetRef.current = null;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
        const currentNear = visibleLocations.find(
          (loc) => Math.abs(LOCATIONS[loc].xPos - playerXRef.current) <= INTERACT_DISTANCE
        );
        if (currentNear) {
          e.preventDefault();
          onSelectLocation(currentNear);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [disabled, visibleLocations, onSelectLocation]);

  useEffect(() => {
    if (disabled) return;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      let dir = 0;
      if (keysRef.current.left) dir -= 1;
      if (keysRef.current.right) dir += 1;

      if (dir === 0 && autoTargetRef.current) {
        const diff = autoTargetRef.current.x - playerXRef.current;
        if (Math.abs(diff) <= 12) {
          const targetLoc = autoTargetRef.current.loc;
          autoTargetRef.current = null;
          setIsMoving(false);
          onSelectLocation(targetLoc);
          return;
        }
        dir = diff > 0 ? 1 : -1;
      }

      if (dir !== 0) {
        const nextX = Math.max(
          100,
          Math.min(WORLD_WIDTH - 100, playerXRef.current + dir * PLAYER_SPEED * dt)
        );
        playerXRef.current = nextX;
        setPlayerX(nextX);
        setFacing(dir > 0 ? 'right' : 'left');
        setIsMoving(true);
      } else {
        setIsMoving(false);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [disabled, onSelectLocation]);

  const handleQuickTravel = (loc: LocationType) => {
    if (disabled) return;
    const targetX = LOCATIONS[loc].xPos;
    if (Math.abs(targetX - playerXRef.current) <= 45) {
      onSelectLocation(loc);
    } else {
      autoTargetRef.current = { x: targetX, loc };
    }
  };

  const maxScroll = Math.max(0, WORLD_WIDTH - viewportWidth);
  const cameraX = Math.max(0, Math.min(maxScroll, playerX - viewportWidth / 2));

  const getSkyStyle = () => {
    switch (stats.timeSlot) {
      case 1:
        return 'from-sky-300 via-sky-100 to-rose-50';
      case 2:
        return 'from-amber-200 via-orange-100 to-rose-50';
      case 3:
        return 'from-indigo-400 via-rose-300 to-amber-200';
      case 4:
      default:
        return 'from-slate-950 via-indigo-950 to-slate-900';
    }
  };

  const isNight = stats.timeSlot === 4;

  const renderBuildingIcon = (loc: LocationType) => {
    switch (loc) {
      case LocationType.HOME:
        return <Home className="w-6 h-6 text-pink-600" />;
      case LocationType.SCHOOL:
        return <GraduationCap className="w-6 h-6 text-sky-600" />;
      case LocationType.SHOP:
        return <ShoppingBag className="w-6 h-6 text-amber-600" />;
      case LocationType.BAR:
        return <Beer className="w-6 h-6 text-violet-600" />;
      case LocationType.MY_SHOP:
        return <Store className="w-6 h-6 text-yellow-600" />;
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-b ${getSkyStyle()} transition-colors duration-700`}
    >
      {/* Celestial Body */}
      {isNight ? (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-24 w-16 h-16 rounded-full bg-amber-100 shadow-[0_0_40px_rgba(254,243,199,0.5)]" />
          {[12, 24, 38, 52, 68, 82].map((left, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
              style={{ top: `${14 + (i % 3) * 8}%`, left: `${left}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="absolute top-20 right-24 w-20 h-20 rounded-full bg-amber-300/90 shadow-[0_0_50px_rgba(252,211,77,0.7)] pointer-events-none" />
      )}

      {/* Parallax Sakura Hills */}
      <div
        className="absolute bottom-44 left-0 h-44 pointer-events-none transition-transform duration-75"
        style={{
          width: WORLD_WIDTH,
          transform: `translate3d(${-cameraX * 0.35}px, 0, 0)`,
        }}
      >
        <svg viewBox="0 0 2450 180" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,180 L0,110 Q180,30 380,105 T780,95 T1180,110 T1600,80 T2020,105 T2450,90 L2450,180 Z"
            fill={isNight ? '#1e293b' : '#fbcfe8'}
            opacity="0.45"
          />
          <path
            d="M0,180 L0,130 Q220,75 450,130 T920,120 T1380,135 T1850,115 T2450,130 L2450,180 Z"
            fill={isNight ? '#0f172a' : '#e2e8f0'}
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Main Scrolling World Layer */}
      <div
        className="absolute inset-y-0 left-0 will-change-transform"
        style={{
          width: WORLD_WIDTH,
          transform: `translate3d(${-cameraX}px, 0, 0)`,
        }}
      >
        {/* Streetlamps */}
        {[460, 950, 1450, 1930].map((lampX) => (
          <div
            key={lampX}
            className="absolute bottom-40 flex flex-col items-center pointer-events-none"
            style={{ left: lampX }}
          >
            <div
              className={`w-8 h-5 rounded-t-full ${
                isNight ? 'bg-amber-300 shadow-[0_12px_45px_rgba(252,211,77,0.85)]' : 'bg-slate-600'
              }`}
            />
            <div className="w-2 h-36 bg-slate-700" />
            <div className="w-6 h-3 bg-slate-800 rounded-t" />
          </div>
        ))}

        {/* Street Collectible Pickups */}
        {pickups.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-44 -translate-x-1/2 z-20 animate-bounce-slow pointer-events-none flex flex-col items-center"
            style={{ left: p.x }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 text-lg ${
                p.type === 'coin'
                  ? 'bg-amber-100 border-amber-400'
                  : 'bg-pink-100 border-pink-400'
              }`}
            >
              {p.type === 'coin' ? '🪙' : '🥛'}
            </div>
            <span className="text-[10px] font-black text-slate-700 bg-white/90 px-1.5 rounded mt-1">
              {p.type === 'coin' ? '+¥25' : '+10%'}
            </span>
          </div>
        ))}

        {/* Buildings with Anime Character Portrait Badges */}
        {visibleLocations.map((loc) => {
          const info = LOCATIONS[loc];
          const npcHere = npcs[loc];
          const isNear = nearbyLoc === loc;
          const isPartner = stats.relationship === npcHere?.id;
          const hasDanger = isNight && loc !== LocationType.HOME && loc !== LocationType.MY_SHOP;

          const buildingColors: Record<LocationType, { wall: string; roof: string }> = {
            [LocationType.HOME]: { wall: 'bg-rose-50 border-pink-300', roof: 'bg-pink-500' },
            [LocationType.SCHOOL]: { wall: 'bg-sky-50 border-sky-300', roof: 'bg-sky-700' },
            [LocationType.SHOP]: { wall: 'bg-amber-50 border-amber-300', roof: 'bg-orange-500' },
            [LocationType.BAR]: { wall: 'bg-slate-800 border-violet-500 text-white', roof: 'bg-violet-700' },
            [LocationType.MY_SHOP]: { wall: 'bg-yellow-50 border-yellow-400', roof: 'bg-amber-500' },
          };

          const theme = buildingColors[loc];

          return (
            <div
              key={loc}
              className="absolute bottom-40 -translate-x-1/2 flex flex-col items-center group"
              style={{ left: info.xPos }}
            >
              {isNear && (
                <button
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className="mb-3 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer animate-bounce-slow z-30 whitespace-nowrap"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>进入 {info.name} [E]</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleQuickTravel(loc)}
                className={`relative w-72 rounded-t-3xl border-2 shadow-xl transition-transform duration-200 cursor-pointer text-left overflow-hidden ${
                  theme.wall
                } ${isNear ? 'ring-4 ring-pink-400/70 -translate-y-1' : 'hover:-translate-y-1'}`}
              >
                <div className={`h-7 w-full ${theme.roof} flex items-center justify-between px-4`}>
                  <span className="text-[11px] font-bold text-white/95 tracking-wide truncate">
                    {info.name}
                  </span>
                  {hasDanger && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-200">
                      <Moon className="w-3 h-3" /> 夜间出没
                    </span>
                  )}
                  {isPartner && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-pink-200">
                      <HeartHandshake className="w-3.5 h-3.5" /> 伴侣
                    </span>
                  )}
                </div>

                <div className="p-4 flex items-center gap-3.5">
                  {loc === LocationType.MY_SHOP ? (
                    <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center shrink-0">
                      {renderBuildingIcon(loc)}
                    </div>
                  ) : (
                    <PortraitAvatar
                      characterId={npcHere.id}
                      name={npcHere.name}
                      species={npcHere.species}
                      className="w-16 h-16 rounded-2xl"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base truncate flex items-center gap-1.5">
                      {renderBuildingIcon(loc)}
                      <span>{npcHere.name}</span>
                    </div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        loc === LocationType.BAR ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {info.subtitle}
                    </div>
                    {loc !== LocationType.HOME && loc !== LocationType.MY_SHOP && (
                      <div
                        className={`text-xs font-bold mt-1 tabular-nums ${
                          loc === LocationType.BAR ? 'text-pink-300' : 'text-pink-600'
                        }`}
                      >
                        好感度: {npcHere.favorability} / 100
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pb-0">
                  <div
                    className={`w-14 h-10 rounded-t-xl border-t-2 border-x-2 flex items-center justify-center ${
                      loc === LocationType.BAR
                        ? 'bg-slate-900 border-violet-400'
                        : 'bg-amber-900/15 border-amber-900/25'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 ml-6" />
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {/* Anime Rabbit Dad Side-Scroll Sprite */}
        <div
          className="absolute bottom-36 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
          style={{ left: playerX }}
        >
          <div
            className={`transition-transform duration-150 ${isMoving ? 'animate-walk-bob' : 'animate-bounce-slow'}`}
            style={{ transform: `scaleX(${facing === 'left' ? -1 : 1})` }}
          >
            <svg width="78" height="96" viewBox="0 0 78 96" className="drop-shadow-lg">
              {stats.equippedItem === 'cloak' && (
                <path d="M22,42 L10,82 L36,78 Z" fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
              )}
              <ellipse cx="30" cy="20" rx="7" ry="18" fill="#ffe4e6" stroke="#be185d" strokeWidth="2.5" />
              <ellipse cx="30" cy="21" rx="3.5" ry="12" fill="#fda4af" />
              <ellipse cx="48" cy="20" rx="7" ry="18" fill="#ffe4e6" stroke="#be185d" strokeWidth="2.5" />
              <ellipse cx="48" cy="21" rx="3.5" ry="12" fill="#fda4af" />
              <circle cx="39" cy="40" r="17" fill="#fff1f2" stroke="#be185d" strokeWidth="2.5" />
              <circle cx="30" cy="43" r="3" fill="#fda4af" opacity="0.85" />
              <circle cx="48" cy="43" r="3" fill="#fda4af" opacity="0.85" />
              <circle cx="34" cy="38" r="2.4" fill="#be185d" />
              <circle cx="45" cy="38" r="2.4" fill="#be185d" />
              <path d="M36,44 Q39,47 42,44" fill="none" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" />
              <rect
                x="24"
                y="55"
                width="30"
                height="26"
                rx="10"
                fill={stats.equippedItem === 'uniform' ? '#1e3a8a' : '#fef3c7'}
                stroke="#be185d"
                strokeWidth="2.5"
              />
              {stats.equippedItem === 'apron' && (
                <rect x="27" y="58" width="24" height="22" rx="6" fill="#7dd3fc" stroke="#0369a1" strokeWidth="2" />
              )}
              {stats.equippedItem === 'uniform' && (
                <polygon points="39,57 36,68 39,72 42,68" fill="#ef4444" />
              )}
              <rect x="52" y="56" width="10" height="17" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <rect x="54" y="53" width="6" height="4" rx="1" fill="#38bdf8" />
              <ellipse cx="32" cy="84" rx="7" ry="4.5" fill="#fff1f2" stroke="#be185d" strokeWidth="2" />
              <ellipse cx="47" cy="84" rx="7" ry="4.5" fill="#fff1f2" stroke="#be185d" strokeWidth="2" />
            </svg>
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-white/95 border border-pink-300 text-[11px] font-bold text-pink-700 shadow-sm -mt-1">
            兔爸爸
          </div>
        </div>

        {/* Sidewalk & Road */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-40 border-t-4 ${
            isNight ? 'bg-slate-800 border-indigo-500/50' : 'bg-stone-200 border-stone-300'
          }`}
        >
          <div
            className={`h-10 w-full border-b-2 ${
              isNight ? 'bg-slate-700/70 border-slate-600' : 'bg-stone-100 border-stone-300'
            }`}
          />
          <div className="flex items-center gap-16 px-8 pt-6 opacity-40">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-16 h-2 rounded-full bg-amber-300 shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Controls & Quick Travel */}
      <div className="absolute bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onMouseDown={() => {
                autoTargetRef.current = null;
                keysRef.current.left = true;
              }}
              onMouseUp={() => (keysRef.current.left = false)}
              onMouseLeave={() => (keysRef.current.left = false)}
              onTouchStart={() => {
                autoTargetRef.current = null;
                keysRef.current.left = true;
              }}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="h-11 px-4 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-md text-slate-700 font-bold text-sm flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>左走 [A]</span>
            </button>
            <button
              type="button"
              onMouseDown={() => {
                autoTargetRef.current = null;
                keysRef.current.right = true;
              }}
              onMouseUp={() => (keysRef.current.right = false)}
              onMouseLeave={() => (keysRef.current.right = false)}
              onTouchStart={() => {
                autoTargetRef.current = null;
                keysRef.current.right = true;
              }}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="h-11 px-4 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-md text-slate-700 font-bold text-sm flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>右走 [D]</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/92 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg pointer-events-auto">
            {visibleLocations.map((loc) => {
              const info = LOCATIONS[loc];
              const isNear = nearbyLoc === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleQuickTravel(loc)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isNear
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-pink-50 hover:text-pink-700'
                  }`}
                >
                  <span>{info.name}</span>
                  {isNight && loc !== LocationType.HOME && loc !== LocationType.MY_SHOP && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideScrollStreet;
