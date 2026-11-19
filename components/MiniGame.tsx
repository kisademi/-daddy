import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocationType } from '../types';
import { Timer, Beer, Zap, Trophy, Sparkles, X } from 'lucide-react';
import { playSound } from '../utils/audio';

interface MiniGameProps {
  location: LocationType;
  difficulty: number;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

interface ChalkTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  golden: boolean;
}

interface ShopOrder {
  id: number;
  slot: number;
  emoji: string;
  item: string;
  reward: number;
  patience: number;
  maxPatience: number;
}

const BAR_COLORS = [
  { name: '樱桃红', base: 'bg-rose-500', active: 'bg-rose-300 ring-4 ring-white' },
  { name: '蓝柑橘', base: 'bg-sky-500', active: 'bg-sky-300 ring-4 ring-white' },
  { name: '薄荷绿', base: 'bg-emerald-500', active: 'bg-emerald-300 ring-4 ring-white' },
  { name: '柠檬黄', base: 'bg-amber-400', active: 'bg-amber-200 ring-4 ring-white' },
];

const CUSTOMER_POOL = [
  { emoji: '🐻', item: '香甜热牛奶', reward: 55 },
  { emoji: '🐱', item: '草莓布丁', reward: 65 },
  { emoji: '🐼', item: '胡萝卜蛋糕', reward: 60 },
  { emoji: '🐯', item: '校长特调冰美式', reward: 95 },
  { emoji: '🦊', item: '狐狸招牌奶茶', reward: 90 },
  { emoji: '🐺', item: '双份奶盖特饮', reward: 100 },
];

const MiniGame: React.FC<MiniGameProps> = ({ location, difficulty, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const showFeedback = useCallback((text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 650);
  }, []);

  // Main Countdown Timer (no timeLeft in deps so interval isn't recreated every 100ms)
  useEffect(() => {
    if (!started || gameEnded) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          setGameEnded(true);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
    return () => clearInterval(timer);
  }, [started, gameEnded]);

  const startGame = () => {
    playSound('click');
    setStarted(true);
    setScore(0);
    setTimeLeft(15);
    setGameEnded(false);
    setBarSequence([]);
    barSeqRef.current = [];
    setBarInput([]);
    setBarRound(1);
    setOrders([]);
    setTargets([]);
  };

  // --- 1. SCHOOL: Blackboard Cleaning ---
  const [targets, setTargets] = useState<ChalkTarget[]>([]);
  const targetsCountRef = useRef(0);
  useEffect(() => {
    targetsCountRef.current = targets.length;
  }, [targets.length]);

  useEffect(() => {
    if (location !== LocationType.SCHOOL || !started || gameEnded) return;

    const spawnMs = Math.max(380, 620 - difficulty * 20);
    const spawnInterval = setInterval(() => {
      if (targetsCountRef.current < 6) {
        const isGolden = Math.random() < 0.22;
        setTargets((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: Math.random() * 76 + 12,
            y: Math.random() * 72 + 14,
            size: isGolden ? 76 : 92,
            golden: isGolden,
          },
        ]);
      }
    }, spawnMs);

    const shrinkInterval = setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => ({ ...t, size: t.size - 1.7 })).filter((t) => t.size > 16)
      );
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(shrinkInterval);
    };
  }, [location, started, gameEnded, difficulty]);

  const handleSchoolClick = (t: ChalkTarget) => {
    playSound(t.golden ? 'coin' : 'pop');
    const pts = t.golden ? 35 : 18;
    setScore((s) => s + pts);
    setTargets((prev) => prev.filter((item) => item.id !== t.id));
    showFeedback(t.golden ? `+${pts} 星星!` : `+${pts}`, t.golden ? 'text-amber-300' : 'text-emerald-300');
  };

  // --- 2. SHOP: Precision Stocking Bar ---
  const [barPos, setBarPos] = useState(15);
  const barDirRef = useRef(1);
  const barSpeedRef = useRef(2.0 + difficulty * 0.12);
  const [combo, setCombo] = useState(0);
  const [targetZone, setTargetZone] = useState({ left: 38, width: 22 });

  useEffect(() => {
    if (location !== LocationType.SHOP || !started || gameEnded) return;
    const interval = setInterval(() => {
      setBarPos((prev) => {
        let next = prev + barDirRef.current * barSpeedRef.current;
        if (next >= 100) {
          next = 100;
          barDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          barDirRef.current = 1;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [location, started, gameEnded]);

  const handleShopClick = () => {
    if (gameEnded) return;
    const hit = barPos >= targetZone.left && barPos <= targetZone.left + targetZone.width;
    if (hit) {
      playSound('success');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      const pts = 28 + Math.min(20, nextCombo * 5);
      setScore((s) => s + pts);
      barSpeedRef.current = Math.min(4.6, barSpeedRef.current + 0.35);
      const newWidth = Math.max(12, 22 - nextCombo);
      setTargetZone({
        left: Math.random() * (90 - newWidth) + 5,
        width: newWidth,
      });
      showFeedback(`完美上架 +${pts}!`, 'text-emerald-600');
    } else {
      playSound('fail');
      setCombo(0);
      setScore((s) => Math.max(0, s - 10));
      barSpeedRef.current = 2.1;
      showFeedback('放偏了 -10', 'text-rose-600');
    }
  };

  // --- 3. BAR: Cocktail Simon Says (Fixed Refs!) ---
  const [barSequence, setBarSequence] = useState<number[]>([]);
  const barSeqRef = useRef<number[]>([]);
  const [barInput, setBarInput] = useState<number[]>([]);
  const [barRound, setBarRound] = useState(1);
  const [showingSeq, setShowingSeq] = useState(false);
  const [activeLight, setActiveLight] = useState<number | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const playSequence = useCallback(async (seq: number[]) => {
    setShowingSeq(true);
    await new Promise((r) => setTimeout(r, 350));
    for (let i = 0; i < seq.length; i++) {
      if (isUnmountedRef.current) return;
      setActiveLight(seq[i]);
      playSound('pop');
      await new Promise((r) => setTimeout(r, 320));
      if (isUnmountedRef.current) return;
      setActiveLight(null);
      await new Promise((r) => setTimeout(r, 150));
    }
    setShowingSeq(false);
  }, []);

  const startBarRound = useCallback(async () => {
    if (isUnmountedRef.current) return;
    const nextSeq = [...barSeqRef.current, Math.floor(Math.random() * 4)];
    barSeqRef.current = nextSeq;
    setBarSequence(nextSeq);
    setBarInput([]);
    await playSequence(nextSeq);
  }, [playSequence]);

  useEffect(() => {
    if (location === LocationType.BAR && started && !gameEnded && barSeqRef.current.length === 0) {
      startBarRound();
    }
  }, [location, started, gameEnded, startBarRound]);

  const handleBarInput = (idx: number) => {
    if (showingSeq || gameEnded) return;
    setActiveLight(idx);
    setTimeout(() => setActiveLight(null), 160);
    playSound('click');

    const step = barInput.length;
    const currentSeq = barSeqRef.current;

    if (currentSeq[step] === idx) {
      const nextInput = [...barInput, idx];
      setBarInput(nextInput);

      if (nextInput.length === currentSeq.length) {
        playSound('success');
        const bonus = barRound * 35;
        setScore((s) => s + bonus);
        setBarRound((r) => r + 1);
        showFeedback(`调酒成功 +${bonus}!`, 'text-amber-300');
        setTimeout(() => {
          if (!isUnmountedRef.current) startBarRound();
        }, 550);
      }
    } else {
      playSound('fail');
      setScore((s) => Math.max(0, s - 10));
      setBarInput([]);
      showFeedback('配方错了! 重试本轮', 'text-rose-400');
      setTimeout(() => {
        if (!isUnmountedRef.current) playSequence(barSeqRef.current);
      }, 650);
    }
  };

  // --- 4. MY_SHOP: Customer Rush Counter ---
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  useEffect(() => {
    if (location !== LocationType.MY_SHOP || !started || gameEnded) return;

    const spawnOrder = () => {
      setOrders((prev) => {
        if (prev.length >= 4) return prev;
        const usedSlots = new Set(prev.map((o) => o.slot));
        const freeSlots = [0, 1, 2, 3].filter((s) => !usedSlots.has(s));
        if (freeSlots.length === 0) return prev;
        const slot = freeSlots[Math.floor(Math.random() * freeSlots.length)];
        const cust = CUSTOMER_POOL[Math.floor(Math.random() * CUSTOMER_POOL.length)];
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            slot,
            emoji: cust.emoji,
            item: cust.item,
            reward: cust.reward,
            patience: 4.5,
            maxPatience: 4.5,
          },
        ];
      });
    };

    spawnOrder();
    const spawnTimer = setInterval(spawnOrder, 750);
    const tickTimer = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => ({ ...o, patience: o.patience - 0.1 })).filter((o) => o.patience > 0)
      );
    }, 100);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(tickTimer);
    };
  }, [location, started, gameEnded]);

  const handleServeOrder = (order: ShopOrder) => {
    if (gameEnded) return;
    playSound('coin');
    setScore((s) => s + order.reward);
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    showFeedback(`+${order.reward} 小费!`, 'text-emerald-700');
  };

  const getIntroCopy = () => {
    switch (location) {
      case LocationType.SCHOOL:
        return '黑板上的粉笔灰正在缩小消失！在它们消散前快速点击清理，金色星星得分翻倍。';
      case LocationType.SHOP:
        return '观察来回移动的指针，当它滑入绿色区域时点击屏幕完成理货，连续命中奖励更高！';
      case LocationType.BAR:
        return '记住调酒台亮起的颜色顺序并按顺序复现，完成轮次越高工资越丰厚！';
      case LocationType.MY_SHOP:
        return '欢迎来到兔爸爸的店！点击排队的动物客人为他们送上牛奶与甜点，赚取高额小费！';
      default:
        return '认真完成打工任务赚取工资吧！';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border-2 border-pink-300 relative overflow-hidden flex flex-col h-[580px]">
        {/* Top Bar inside MiniGame */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-pink-50/60">
          <span className="font-bold text-slate-800 text-sm">
            {location === LocationType.SCHOOL && '贵族学校 · 教室清洁'}
            {location === LocationType.SHOP && '街角小店 · 精准理货'}
            {location === LocationType.BAR && '夜色酒吧 · 记忆调酒'}
            {location === LocationType.MY_SHOP && '兔爸爸的店 · 招待营业'}
          </span>
          {!gameEnded && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>放弃返回</span>
            </button>
          )}
        </div>

        {gameEnded ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mb-4">
              <Trophy className="w-11 h-11 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 font-display">打工完成！</h2>
            <p className="text-slate-500 text-sm mb-4">辛苦了，兔宝宝会为你骄傲的</p>
            <div className="text-3xl font-black text-pink-600 mb-8 tabular-nums">
              本次得分：{score} 分
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('success');
                onComplete(score);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-10 rounded-xl text-base shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              领取今日工资
            </button>
          </div>
        ) : !started ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-3xl font-black text-pink-600 mb-4 font-display">准备开始打工</h2>
            <div className="bg-pink-50/80 p-5 rounded-2xl mb-8 border border-pink-100 max-w-md">
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                {getIntroCopy()}
              </p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3.5 px-10 rounded-xl text-lg shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              开始计时 (15秒)
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 min-h-0 select-none">
            {/* In-game HUD */}
            <div className="flex justify-between items-center mb-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-black text-slate-800 text-lg tabular-nums">得分: {score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft < 5 ? 'text-rose-500' : 'text-sky-600'}`} />
                <span className={`font-black text-lg tabular-nums ${timeLeft < 5 ? 'text-rose-600' : 'text-sky-700'}`}>
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Play Area */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              {feedback && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-float-up">
                  <span className={`text-2xl font-black drop-shadow ${feedback.color}`}>
                    {feedback.text}
                  </span>
                </div>
              )}

              {/* SCHOOL */}
              {location === LocationType.SCHOOL && (
                <div className="w-full h-full relative bg-emerald-900 cursor-crosshair overflow-hidden">
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-emerald-200/70 text-xs font-bold pointer-events-none">
                    快速点击粉笔灰与金色星星！
                  </div>
                  {targets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onMouseDown={() => handleSchoolClick(t)}
                      className={`absolute rounded-full border-2 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer ${
                        t.golden
                          ? 'bg-amber-300/35 border-amber-200 text-amber-200'
                          : 'bg-white/20 border-white/60 text-white'
                      }`}
                      style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        width: `${t.size}px`,
                        height: `${t.size}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {t.golden ? <Sparkles className="w-6 h-6" /> : <span className="text-xl">💨</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* SHOP */}
              {location === LocationType.SHOP && (
                <div
                  onClick={handleShopClick}
                  className="w-full h-full flex flex-col items-center justify-center bg-amber-50 cursor-pointer px-6"
                >
                  <div className="text-sm font-bold text-amber-700 mb-3 tabular-nums">
                    当前连击：x{combo} · 指针速度 {barSpeedRef.current.toFixed(1)}x
                  </div>
                  <div className="w-full h-14 bg-slate-200 rounded-full relative overflow-hidden border-2 border-slate-300 shadow-inner">
                    <div
                      className="absolute h-full bg-emerald-500/70 transition-all duration-200"
                      style={{ left: `${targetZone.left}%`, width: `${targetZone.width}%` }}
                    />
                    <div
                      className="absolute w-3.5 h-full bg-rose-600 shadow"
                      style={{ left: `${barPos}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                  <p className="mt-6 text-amber-800 font-bold text-base">
                    指针进入绿色区间时点击屏幕任何位置！
                  </p>
                </div>
              )}

              {/* BAR */}
              {location === LocationType.BAR && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {BAR_COLORS.map((c, idx) => {
                      const isActive = activeLight === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleBarInput(idx)}
                          className={`w-28 h-24 rounded-2xl border-2 border-white/20 transition-all duration-100 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isActive ? `${c.active} scale-105` : `${c.base} opacity-85 hover:opacity-100`
                          }`}
                        >
                          <Beer className="w-7 h-7 text-white" />
                          <span className="text-xs font-bold text-white">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 text-slate-200 font-bold text-sm bg-slate-800 px-5 py-2 rounded-xl border border-slate-700 tabular-nums">
                    {showingSeq
                      ? `第 ${barRound} 轮 · 请记住亮灯顺序 (${barSequence.length} 步)`
                      : `轮到你了！(${barInput.length}/${barSequence.length})`}
                  </div>
                </div>
              )}

              {/* MY_SHOP */}
              {location === LocationType.MY_SHOP && (
                <div className="w-full h-full bg-yellow-50 p-4 flex flex-col justify-between">
                  <div className="text-center text-xs font-bold text-yellow-800">
                    点击客人卡片迅速上菜赚取小费！
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1 py-3">
                    {[0, 1, 2, 3].map((slot) => {
                      const order = orders.find((o) => o.slot === slot);
                      if (!order) {
                        return (
                          <div
                            key={slot}
                            className="rounded-2xl border-2 border-dashed border-yellow-300/70 bg-yellow-100/40 flex items-center justify-center text-xs text-yellow-600/70 font-bold"
                          >
                            等待顾客光临...
                          </div>
                        );
                      }
                      const pct = Math.max(0, (order.patience / order.maxPatience) * 100);
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => handleServeOrder(order)}
                          className="rounded-2xl bg-white border-2 border-amber-300 hover:border-pink-400 shadow-md p-3 flex flex-col justify-between text-left transition-transform active:scale-95 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-3xl leading-none">{order.emoji}</span>
                            <span className="text-sm font-black text-emerald-700 tabular-nums">
                              +¥{order.reward}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 truncate">{order.item}</div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${pct < 35 ? 'bg-rose-500' : 'bg-amber-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniGame;
