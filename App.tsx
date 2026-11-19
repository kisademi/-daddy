import React, { useState, useEffect, useCallback } from 'react';
import {
  GameMode,
  GameOverReason,
  LocationType,
  PlayerStats,
  NPC,
  DialogueOption,
  DialogueScene,
} from './types';
import {
  INITIAL_STATS,
  LOCATIONS,
  createInitialNpcs,
  CLOTHING_ITEMS,
  CONSUMABLE_ITEMS,
  GIFT_ITEMS,
  MISSION_DEFS,
  CONFESSION_SCENES,
  SHOP_RENT,
  SHOP_COST,
  DAYS_PER_SEMESTER,
  TITLE_BANNER_IMAGE,
  SON_CHAT_LINES,
} from './constants';
import { playSound, toggleMute, isMuted } from './utils/audio';
import GameOverlay from './components/GameOverlay';
import SideScrollStreet from './components/SideScrollStreet';
import PlotMode from './components/PlotMode';
import ParkourMode from './components/ParkourMode';
import MiniGame from './components/MiniGame';
import GameOver from './components/GameOver';
import PortraitAvatar from './components/PortraitAvatar';
import { CodexModal, HelpModal, MissionsModal } from './components/CodexAndHelpModals';
import {
  Play,
  GraduationCap,
  Heart,
  MessageCircle,
  BedDouble,
  Shirt,
  ArrowLeft,
  Check,
  Store,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Gift,
} from 'lucide-react';

const SAVE_KEY = 'rabbit_daddy_save_v1';
const ENDINGS_KEY = 'rabbit_daddy_endings_v1';

interface SavedProgress {
  stats: PlayerStats;
  npcs: Record<LocationType, NPC>;
  currentLocation: LocationType;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [currentLocation, setCurrentLocation] = useState<LocationType>(LocationType.HOME);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [npcs, setNpcs] = useState<Record<LocationType, NPC>>(() => createInitialNpcs());
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>('CAPTURED');

  const [showHomeMenu, setShowHomeMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSonChat, setShowSonChat] = useState<string | null>(null);
  const [showConfession, setShowConfession] = useState<DialogueScene | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [bannerError, setBannerError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [unlockedEndings, setUnlockedEndings] = useState<GameOverReason[]>(() => {
    try {
      const raw = localStorage.getItem(ENDINGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [hasSavedRun, setHasSavedRun] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // Persist progress
  useEffect(() => {
    if (mode === GameMode.MENU || mode === GameMode.GAME_OVER) return;
    try {
      const payload: SavedProgress = { stats, npcs, currentLocation };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      setHasSavedRun(true);
    } catch {
      // ignore storage errors
    }
  }, [stats, npcs, currentLocation, mode]);

  const triggerGameOver = useCallback((reason: GameOverReason) => {
    setGameOverReason(reason);
    setMode(GameMode.GAME_OVER);
    setUnlockedEndings((prev) => {
      if (prev.includes(reason)) return prev;
      const next = [...prev, reason];
      try {
        localStorage.setItem(ENDINGS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const advanceTime = useCallback((costEnergy = 0) => {
    setStats((prev) => {
      let newMilk = Math.max(0, prev.milk - costEnergy);
      let newTime = prev.timeSlot + 1;
      let newDay = prev.day;

      if (newTime > 4) {
        newTime = 1;
        newDay += 1;
        newMilk = 100;
      }

      return {
        ...prev,
        milk: newMilk,
        timeSlot: newTime,
        day: newDay,
      };
    });
  }, []);

  // Day 10 Semester Settlement, Fainting & Harem Ending checks
  useEffect(() => {
    if (mode === GameMode.GAME_OVER || mode === GameMode.MENU) return;

    if (
      stats.day > 1 &&
      (stats.day - 1) % DAYS_PER_SEMESTER === 0 &&
      stats.timeSlot === 1 &&
      stats.lastSettledDay !== stats.day
    ) {
      if (stats.hasShop) {
        if (stats.money >= SHOP_RENT) {
          setStats((prev) => ({
            ...prev,
            money: prev.money - SHOP_RENT,
            lastSettledDay: stats.day,
          }));
          showToast(`已自动扣除本期店铺租金 ¥${SHOP_RENT}`);
        } else {
          setStats((prev) => ({ ...prev, lastSettledDay: stats.day }));
          triggerGameOver('BANKRUPTCY');
          return;
        }
      } else {
        setStats((prev) => ({ ...prev, lastSettledDay: stats.day }));
      }

      if (stats.tuitionPaid >= stats.tuitionTotal) {
        triggerGameOver('SON_HAPPY');
      } else {
        triggerGameOver('SON_SAD');
      }
      return;
    }

    if (stats.milk <= 0) {
      if (activeNPC && activeNPC.favorability > 80 && activeNPC.location !== LocationType.HOME) {
        triggerGameOver('OUT_OF_MILK_IMPRISONED');
      } else {
        triggerGameOver('OUT_OF_MILK_BAD');
      }
      return;
    }

    const dangerousNPCs = (Object.values(npcs) as NPC[]).filter(
      (n) => ['Tiger', 'Fox', 'Wolf'].includes(n.species) && n.favorability > 90
    );
    if (dangerousNPCs.length >= 3 && !stats.relationship) {
      triggerGameOver('HAREM_ENDING');
    }
  }, [
    stats.day,
    stats.timeSlot,
    stats.milk,
    stats.tuitionPaid,
    stats.tuitionTotal,
    stats.lastSettledDay,
    stats.hasShop,
    stats.money,
    stats.relationship,
    mode,
    activeNPC,
    npcs,
    triggerGameOver,
    showToast,
  ]);

  const modifyStats = (milkDelta: number, moneyDelta: number, tuitionDelta: number) => {
    setStats((prev) => ({
      ...prev,
      milk: Math.min(100, Math.max(0, prev.milk + milkDelta)),
      money: Math.max(0, prev.money + moneyDelta),
      tuitionPaid: prev.tuitionPaid + tuitionDelta,
      totalEarned: moneyDelta > 0 ? prev.totalEarned + moneyDelta : prev.totalEarned,
    }));
  };

  const updateFavorabilityById = (npcId: string, amount: number) => {
    setNpcs((prev) => {
      const updated = { ...prev };
      for (const loc of Object.keys(updated) as LocationType[]) {
        if (updated[loc].id === npcId) {
          updated[loc] = {
            ...updated[loc],
            favorability: Math.min(100, updated[loc].favorability + amount),
          };
        }
      }
      return updated;
    });
    setActiveNPC((prev) =>
      prev && prev.id === npcId
        ? { ...prev, favorability: Math.min(100, prev.favorability + amount) }
        : prev
    );
  };

  const handleStreetPickup = useCallback(
    (type: 'coin' | 'milk') => {
      if (type === 'coin') {
        modifyStats(0, 25, 0);
        showToast('在商店街角落捡到掉落的 ¥25！');
      } else {
        modifyStats(10, 0, 0);
        showToast('捡到新鲜牛奶补给，能量 +10%！');
      }
    },
    [showToast]
  );

  const handleLocationSelect = useCallback(
    (loc: LocationType) => {
      setCurrentLocation(loc);
      playSound('click');

      if (loc === LocationType.MY_SHOP) {
        setActiveNPC(npcs[LocationType.MY_SHOP]);
        setMode(GameMode.MINI_GAME);
        return;
      }

      if (stats.timeSlot === 4 && loc !== LocationType.HOME) {
        const localNpc = npcs[loc];
        const isPartnerHere = stats.relationship === localNpc.id;
        if (!isPartnerHere && Math.random() > 0.5) {
          setActiveNPC(localNpc);
          setMode(GameMode.PARKOUR);
          return;
        }
      }

      if (loc === LocationType.HOME) {
        setShowHomeMenu(true);
        return;
      }

      const targetNPC = npcs[loc];
      setActiveNPC(targetNPC);

      if (
        targetNPC.favorability > 80 &&
        !stats.relationship &&
        ['Tiger', 'Wolf', 'Fox'].includes(targetNPC.species)
      ) {
        const scene = CONFESSION_SCENES[targetNPC.id];
        if (scene) {
          setShowConfession(scene);
          setMode(GameMode.CONFESSION);
          return;
        }
      }

      setMode(GameMode.PLOT_INTERACTION);
    },
    [npcs, stats.relationship, stats.timeSlot]
  );

  const handleHomeAction = (action: 'PAY' | 'CHAT' | 'SLEEP' | 'SHOP' | 'GIFT_SON') => {
    playSound('click');
    if (action === 'SHOP') {
      setShowShop(true);
      return;
    }

    if (action === 'GIFT_SON') {
      if ((stats.gifts['gift_book'] || 0) <= 0) return;
      setShowHomeMenu(false);
      setStats((prev) => ({
        ...prev,
        milk: Math.min(100, prev.milk + 25),
        giftsGiven: prev.giftsGiven + 1,
        gifts: { ...prev.gifts, gift_book: Math.max(0, (prev.gifts['gift_book'] || 1) - 1) },
      }));
      playSound('heart');
      setShowSonChat('“哇！！是爸爸送我的《限量胡萝卜冒险绘本》！今晚我念故事给爸爸听，爸爸要快点恢复元气哦！”（能量 +25%）');
      return;
    }

    setShowHomeMenu(false);

    if (action === 'PAY') {
      const remaining = Math.max(0, stats.tuitionTotal - stats.tuitionPaid);
      if (remaining === 0) {
        playSound('success');
        showToast('本期学费已经全部交清啦！');
        return;
      }
      if (stats.money <= 0) {
        playSound('fail');
        showToast('口袋里暂时没有钱，先去打工赚钱吧！');
        return;
      }
      const amount = Math.min(stats.money, remaining);
      modifyStats(0, -amount, amount);
      playSound('success');
      showToast(`已缴纳 ¥${amount} 学费！距离目标还差 ¥${remaining - amount}`);
      advanceTime(0);
      return;
    }

    if (action === 'CHAT') {
      const line = SON_CHAT_LINES[Math.floor(Math.random() * SON_CHAT_LINES.length)];
      setShowSonChat(line);
      modifyStats(12, 0, 0);
      playSound('heart');
      advanceTime(0);
      return;
    }

    if (action === 'SLEEP') {
      setStats((prev) => ({
        ...prev,
        timeSlot: 1,
        day: prev.day + 1,
        milk: 100,
      }));
      playSound('success');
      showToast('睡了个安稳的好觉，香甜牛奶能量恢复至 100%！');
    }
  };

  const buyClothing = (itemId: string, price: number) => {
    if (stats.inventory.includes(itemId)) return;
    if (stats.money >= price) {
      playSound('success');
      setStats((prev) => ({
        ...prev,
        money: prev.money - price,
        inventory: [...prev.inventory, itemId],
        equippedItem: itemId,
      }));
      showToast('购买并自动穿戴了新装备！');
    } else {
      playSound('fail');
      showToast('私房钱不够啦！');
    }
  };

  const buyConsumable = (price: number, milkRestore: number, name: string) => {
    if (stats.milk >= 100) {
      playSound('alert');
      showToast('当前香甜牛奶能量已满，无需补充！');
      return;
    }
    if (stats.money >= price) {
      playSound('heart');
      setStats((prev) => ({
        ...prev,
        money: prev.money - price,
        milk: Math.min(100, prev.milk + milkRestore),
      }));
      showToast(`饮用了${name}，恢复 ${milkRestore}% 能量！`);
    } else {
      playSound('fail');
      showToast('私房钱不够啦！');
    }
  };

  const buyGift = (giftId: string, price: number, name: string) => {
    if (stats.money >= price) {
      playSound('coin');
      setStats((prev) => ({
        ...prev,
        money: prev.money - price,
        gifts: { ...prev.gifts, [giftId]: (prev.gifts[giftId] || 0) + 1 },
      }));
      showToast(`已购买「${name}」，可在对话时送给对应角色！`);
    } else {
      playSound('fail');
      showToast('私房钱不够啦！');
    }
  };

  const equipItem = (itemId: string) => {
    playSound('click');
    setStats((prev) => ({ ...prev, equippedItem: itemId }));
  };

  const buyStore = () => {
    if (stats.money >= SHOP_COST) {
      playSound('success');
      setStats((prev) => ({
        ...prev,
        money: prev.money - SHOP_COST,
        hasShop: true,
      }));
      setShowHomeMenu(false);
      showToast('恭喜盘下「兔爸爸的店」！现在可以去街道最右侧营业赚钱啦！');
    } else {
      playSound('fail');
    }
  };

  const handleGiveGift = (giftId: string, npcId: string): string => {
    const gift = GIFT_ITEMS.find((g) => g.id === giftId);
    if (!gift) return '谢谢你的心意。';

    const isFav = gift.favoriteOf === npcId;
    const gain = isFav ? 18 : 8;

    setStats((prev) => ({
      ...prev,
      giftsGiven: prev.giftsGiven + 1,
      gifts: { ...prev.gifts, [giftId]: Math.max(0, (prev.gifts[giftId] || 1) - 1) },
    }));
    updateFavorabilityById(npcId, gain);
    playSound('heart');
    showToast(`赠送「${gift.name}」成功！好感度 +${gain}`);

    if (isFav) {
      if (npcId === 'tiger_principal') {
        return `（虎校长接过${gift.name}，严峻的眉眼瞬间融化）“你竟然记得我平时爱喝这个……谢谢你，兔爸爸。这份心意我会好好珍藏。”（好感度 +18）`;
      }
      if (npcId === 'fox_owner') {
        return `（狐老板把${gift.name}系在扇柄上，眼波流转）“哎呀呀，小兔子这么懂我的喜好，是想把狐狸哥哥的心也一起收走吗？”（好感度 +18）`;
      }
      if (npcId === 'wolf_boss') {
        return `（狼大哥握紧${gift.name}，嘴角微微上扬）“专门挑的？哼……不错，我很喜欢。以后有事尽管找我。”（好感度 +18）`;
      }
    }
    return `（对方欣然收下了${gift.name}）“谢谢你的礼物，兔爸爸真贴心。”（好感度 +${gain}）`;
  };

  const handleClaimMission = (missionId: string) => {
    const mission = MISSION_DEFS.find((m) => m.id === missionId);
    if (!mission || stats.claimedMissions.includes(missionId) || !mission.isComplete(stats)) return;
    playSound('success');
    setStats((prev) => ({
      ...prev,
      money: prev.money + mission.rewardMoney,
      milk: Math.min(100, prev.milk + mission.rewardMilk),
      totalEarned: prev.totalEarned + mission.rewardMoney,
      claimedMissions: [...prev.claimedMissions, missionId],
    }));
    showToast(`目标达成！领取了 ${mission.rewardText}`);
  };

  const handleConfessionChoice = (action: 'ACCEPT_CONFESSION' | 'REJECT_CONFESSION') => {
    if (!activeNPC) return;

    if (action === 'ACCEPT_CONFESSION') {
      playSound('success');
      setStats((prev) => ({ ...prev, relationship: activeNPC.id }));
      modifyStats(0, 5000, 0);
      showToast(`已与 ${activeNPC.name} 确立伴侣关系，获得 ¥5,000 支持资金！`);
    } else {
      playSound('fail');
      setNpcs((prev) => ({
        ...prev,
        [activeNPC.location]: { ...activeNPC, favorability: 70 },
      }));
      showToast(`你婉拒了 ${activeNPC.name} 的心意，继续独立奋斗。`);
    }
    setShowConfession(null);
    setMode(GameMode.PLOT_SELECTION);
  };

  const handlePlotChoice = (option: DialogueOption, sceneId: string, coStarId?: string) => {
    playSound('click');

    // Mark crossover or special scene seen
    if (coStarId && !stats.seenEvents.includes(sceneId)) {
      setStats((prev) => ({
        ...prev,
        seenEvents: [...prev.seenEvents, sceneId],
      }));
    }

    if (option.action === 'LEAVE') {
      setMode(GameMode.PLOT_SELECTION);
      return;
    }

    // Handle Crossover Dual-Character Choices
    if (
      activeNPC &&
      coStarId &&
      (option.action === 'SIDE_PRIMARY' ||
        option.action === 'SIDE_COSTAR' ||
        option.action === 'PACIFY_BOTH')
    ) {
      const parkourRoll = Math.random();
      if (parkourRoll < option.risk) {
        setMode(GameMode.PARKOUR);
        return;
      }

      if (option.action === 'SIDE_PRIMARY') {
        updateFavorabilityById(activeNPC.id, 18);
        updateFavorabilityById(coStarId, 5);
        modifyStats(-5, 150, 0);
        playSound('heart');
        showToast(`力挺${activeNPC.name}！双人联动好感提升，获得 ¥150`);
      } else if (option.action === 'SIDE_COSTAR') {
        updateFavorabilityById(coStarId, 18);
        updateFavorabilityById(activeNPC.id, 5);
        modifyStats(-5, 160, 0);
        playSound('heart');
        showToast(`站在了来访者这边！好感大幅提升，获得 ¥160`);
      } else {
        updateFavorabilityById(activeNPC.id, 12);
        updateFavorabilityById(coStarId, 12);
        modifyStats(-20, 250, 0);
        playSound('success');
        showToast('两杯香甜牛奶完美化解修罗场！双人好感 +12，入账 ¥250');
      }
      advanceTime(0);
      setMode(GameMode.PLOT_SELECTION);
      return;
    }

    const parkourRoll = Math.random();
    const risk = stats.relationship === activeNPC?.id ? 0 : option.risk;

    if (parkourRoll < risk) {
      setMode(GameMode.PARKOUR);
      return;
    }

    let favGain = 0;
    if (option.action === 'WORK') favGain = 10;
    if (option.action === 'FLIRT') favGain = 15;
    if (option.action === 'TRADE_MILK') favGain = 20;

    if (stats.relationship && stats.relationship !== activeNPC?.id) {
      favGain = Math.floor(favGain / 2);
    }

    const currentFav = activeNPC?.favorability || 0;
    const rewardMultiplier = 1 + currentFav / 100;

    switch (option.action) {
      case 'WORK':
        if (activeNPC) updateFavorabilityById(activeNPC.id, favGain);
        setMode(GameMode.MINI_GAME);
        return;
      case 'TRADE_MILK': {
        const milkMoney = Math.floor(145 * rewardMultiplier);
        modifyStats(-25, milkMoney, 0);
        playSound('coin');
        if (activeNPC) updateFavorabilityById(activeNPC.id, favGain);
        showToast(`出售特调牛奶赚取 ¥${milkMoney}！`);
        advanceTime(0);
        break;
      }
      case 'FLIRT': {
        const flirtMoney = Math.floor(40 * rewardMultiplier);
        modifyStats(-5, flirtMoney, 0);
        playSound('heart');
        if (activeNPC) updateFavorabilityById(activeNPC.id, favGain);
        showToast(`互动升温！好感度 +${favGain}，获赠 ¥${flirtMoney}`);
        advanceTime(5);
        break;
      }
    }

    setMode(GameMode.PLOT_SELECTION);
  };

  const handleMiniGameComplete = (score: number) => {
    let earnings = 0;
    if (currentLocation === LocationType.MY_SHOP) {
      const highFavNPCs = (Object.values(npcs) as NPC[]).filter((n) => n.favorability > 80).length;
      earnings = Math.floor(score * (1 + highFavNPCs * 0.5));
      modifyStats(-10, earnings, 0);
    } else {
      const favBonus = activeNPC ? activeNPC.favorability : 0;
      earnings = Math.floor(score * (1 + favBonus / 50));
      modifyStats(-20, earnings, 0);
      if (score >= 60 && activeNPC) updateFavorabilityById(activeNPC.id, 5);
    }

    setStats((prev) => ({ ...prev, worksCompleted: prev.worksCompleted + 1 }));
    showToast(`打工结算完成，入账 ¥${earnings}！`);
    advanceTime(0);
    setMode(GameMode.PLOT_SELECTION);
  };

  const handleParkourComplete = (success: boolean, lostMilk: number, earnedMoney: number) => {
    if (success) {
      setStats((prev) => ({
        ...prev,
        milk: Math.min(100, Math.max(0, prev.milk - lostMilk)),
        money: prev.money + earnedMoney,
        totalEarned: prev.totalEarned + earnedMoney,
        parkourWins: prev.parkourWins + 1,
      }));
      showToast(`甩开追逐！捡到私房钱 ¥${earnedMoney}`);
      advanceTime(0);
      setMode(GameMode.PLOT_SELECTION);
    } else {
      triggerGameOver('CAPTURED');
    }
  };

  const startNewGame = () => {
    playSound('click');
    setStats(INITIAL_STATS);
    setNpcs(createInitialNpcs());
    setCurrentLocation(LocationType.HOME);
    setActiveNPC(null);
    setMode(GameMode.PLOT_SELECTION);
  };

  const continueSavedGame = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        startNewGame();
        return;
      }
      const parsed = JSON.parse(raw) as SavedProgress;
      playSound('click');
      setStats({ ...INITIAL_STATS, ...parsed.stats });
      setNpcs(parsed.npcs || createInitialNpcs());
      setCurrentLocation(parsed.currentLocation || LocationType.HOME);
      setMode(GameMode.PLOT_SELECTION);
    } catch {
      startNewGame();
    }
  };

  const restartFromGameOver = () => {
    playSound('click');
    if (gameOverReason === 'SON_HAPPY') {
      setStats((prev) => ({
        ...prev,
        tuitionPaid: 0,
        semester: prev.semester + 1,
        lastSettledDay: prev.day,
      }));
      setMode(GameMode.PLOT_SELECTION);
    } else {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        // ignore
      }
      setHasSavedRun(false);
      setStats(INITIAL_STATS);
      setNpcs(createInitialNpcs());
      setCurrentLocation(LocationType.HOME);
      setMode(GameMode.MENU);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = toggleMute();
    setMutedState(nextMuted);
  };

  // --- TITLE MENU ---
  if (mode === GameMode.MENU) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-rose-50 flex items-center justify-center p-6">
        {!bannerError ? (
          <img
            src={TITLE_BANNER_IMAGE}
            alt="奶爸 兔Daddy 日系动漫街景主视觉"
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-amber-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/35" />

        <div className="relative z-10 max-w-xl w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 text-center">
          <div className="text-xs font-bold tracking-wider text-pink-600 mb-2">
            日系二次元养成 · 横版探索 · 双人联动剧情 · 追逐跑酷
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 mb-4 font-display tracking-tight">
            🐰 奶爸 兔Daddy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            为了每 10 天 ¥2,000 的儿子学费，温柔可爱的兔耳爸爸必须在充满羁绊与心动的樱川商店街里打工、送礼、应付修罗场并守护小家！
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {hasSavedRun && (
              <button
                type="button"
                onClick={continueSavedGame}
                className="w-full py-3.5 px-6 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>继续上次进度</span>
              </button>
            )}
            <button
              type="button"
              onClick={startNewGame}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer ${
                hasSavedRun
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg'
              }`}
            >
              {hasSavedRun ? <RotateCcw className="w-4 h-4" /> : <Play className="w-5 h-5 fill-white" />}
              <span>{hasSavedRun ? '开始新故事' : '开始游戏'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-pink-600" />
                <span>玩法说明</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCodex(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-pink-600" />
                <span>结局图鉴 ({unlockedEndings.length}/7)</span>
              </button>
            </div>
          </div>
        </div>

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showCodex && (
          <CodexModal
            npcs={npcs}
            stats={stats}
            unlockedEndings={unlockedEndings}
            onClose={() => setShowCodex(false)}
          />
        )}
      </div>
    );
  }

  if (mode === GameMode.GAME_OVER) {
    return (
      <GameOver
        reason={gameOverReason}
        stats={stats}
        unlockedEndings={unlockedEndings}
        onRestart={restartFromGameOver}
      />
    );
  }

  const anyModalOpen =
    showHomeMenu || showShop || Boolean(showSonChat) || showCodex || showHelp || showMissions;

  return (
    <div className={`h-screen w-full relative overflow-hidden ${LOCATIONS[currentLocation].bg}`}>
      <GameOverlay
        stats={stats}
        muted={muted}
        onToggleMute={handleToggleMute}
        onOpenMissions={() => setShowMissions(true)}
        onOpenCodex={() => setShowCodex(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-bold border border-white/15 pointer-events-none">
          {toast}
        </div>
      )}

      {/* VIEW: 2D SIDE-SCROLLING TOWN STREET */}
      {mode === GameMode.PLOT_SELECTION && (
        <SideScrollStreet
          stats={stats}
          npcs={npcs}
          currentLocation={currentLocation}
          onSelectLocation={handleLocationSelect}
          onStreetPickup={handleStreetPickup}
          disabled={anyModalOpen}
        />
      )}

      {/* HOME MENU MODAL */}
      {mode === GameMode.PLOT_SELECTION && showHomeMenu && !showShop && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-200">
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
              <PortraitAvatar
                characterId="son"
                name="兔宝宝"
                species="Little Rabbit"
                className="w-16 h-16 rounded-2xl"
              />
              <div>
                <h2 className="text-xl font-black text-slate-900 font-display">欢迎回家，爸爸！</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  兔宝宝正戴着小书包乖乖写作业，看到你回来开心地晃起了耳朵。
                </p>
              </div>
            </div>

            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={() => handleHomeAction('PAY')}
                className="flex items-center gap-3 p-3.5 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200 text-left cursor-pointer"
              >
                <div className="bg-sky-200/80 p-2 rounded-xl text-sky-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-sky-900">缴纳学费</div>
                  <div className="text-xs text-sky-700">
                    还差 ¥{Math.max(0, stats.tuitionTotal - stats.tuitionPaid)} · 将从私房钱中支付
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleHomeAction('CHAT')}
                className="flex items-center gap-3 p-3.5 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors border border-pink-200 text-left cursor-pointer"
              >
                <div className="bg-pink-200/80 p-2 rounded-xl text-pink-700">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-pink-900">和兔宝宝聊天</div>
                  <div className="text-xs text-pink-700">恢复 +12% 香甜牛奶能量 (消耗 1 时段)</div>
                </div>
              </button>

              {(stats.gifts['gift_book'] || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleHomeAction('GIFT_SON')}
                  className="flex items-center gap-3 p-3.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 text-left cursor-pointer"
                >
                  <div className="bg-rose-200/80 p-2 rounded-xl text-rose-700">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-rose-900">
                      陪兔宝宝共读《胡萝卜绘本》 (剩 {stats.gifts['gift_book']} 本)
                    </div>
                    <div className="text-xs text-rose-700">不消耗时间 · 立即恢复 +25% 能量</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleHomeAction('SLEEP')}
                className="flex items-center gap-3 p-3.5 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors border border-violet-200 text-left cursor-pointer"
              >
                <div className="bg-violet-200/80 p-2 rounded-xl text-violet-700">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-violet-900">休息睡觉</div>
                  <div className="text-xs text-violet-700">能量恢复至 100%，进入明天早晨</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleHomeAction('SHOP')}
                className="flex items-center gap-3 p-3.5 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200 text-left cursor-pointer"
              >
                <div className="bg-amber-200/80 p-2 rounded-xl text-amber-700">
                  <Shirt className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-amber-900">网购服装、补给与礼物</div>
                  <div className="text-xs text-amber-700">购买跑酷装扮、能量饮品与 NPC 专属礼物</div>
                </div>
              </button>

              {!stats.hasShop && (
                <button
                  type="button"
                  onClick={buyStore}
                  disabled={stats.money < SHOP_COST}
                  className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors border text-left ${
                    stats.money >= SHOP_COST
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 cursor-pointer'
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="bg-emerald-200/80 p-2 rounded-xl text-emerald-700">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-emerald-900">盘下店面当老板 (¥{SHOP_COST})</div>
                    <div className="text-xs text-emerald-700">开启「兔爸爸的店」(每10天租金 ¥{SHOP_RENT})</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowHomeMenu(false)}
                className="mt-1 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                离开家门
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SON CHAT MODAL */}
      {showSonChat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-pink-200 text-center">
            <PortraitAvatar
              characterId="son"
              name="兔宝宝"
              species="Little Rabbit"
              className="w-32 h-32 rounded-2xl mx-auto mb-4"
            />
            <h3 className="text-xl font-black text-slate-900 mb-2 font-display">温馨的亲子时光</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-pink-50 p-4 rounded-2xl border border-pink-100 mb-5">
              {showSonChat}
            </p>
            <button
              type="button"
              onClick={() => setShowSonChat(null)}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm cursor-pointer"
            >
              摸摸兔宝宝的头
            </button>
          </div>
        </div>
      )}

      {/* SHOP MODAL (CLOTHING + CONSUMABLES + GIFTS) */}
      {showShop && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-amber-200 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 font-display">兔爸爸网购小铺</h2>
              <div className="text-sm font-black text-emerald-700 tabular-nums">
                私房钱: ¥{stats.money}
              </div>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1">
              {/* Clothing */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">跑酷功能服装</h3>
                <div className="space-y-2.5">
                  {CLOTHING_ITEMS.map((item) => {
                    const owned = stats.inventory.includes(item.id);
                    const equipped = stats.equippedItem === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border flex justify-between items-center gap-3 ${
                          equipped ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {equipped && <Check className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div className="text-xs text-slate-500">{item.desc}</div>
                          </div>
                        </div>

                        {!owned ? (
                          <button
                            type="button"
                            onClick={() => buyClothing(item.id, item.price)}
                            disabled={stats.money < item.price}
                            className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 tabular-nums ${
                              stats.money >= item.price
                                ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            ¥{item.price}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => equipItem(item.id)}
                            disabled={equipped}
                            className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 ${
                              equipped
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            {equipped ? '已穿戴' : '穿戴'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gifts */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">角色专属礼物（可在剧情中赠送大幅提升好感）</h3>
                <div className="space-y-2.5">
                  {GIFT_ITEMS.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/40 flex justify-between items-center gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{g.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {g.name}{' '}
                            {(stats.gifts[g.id] || 0) > 0 && (
                              <span className="text-xs text-pink-600 font-bold tabular-nums">
                                (持有 {stats.gifts[g.id]})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{g.desc}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => buyGift(g.id, g.price, g.name)}
                        disabled={stats.money < g.price}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 tabular-nums ${
                          stats.money >= g.price
                            ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        ¥{g.price}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Energy Consumables */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">即时能量补给</h3>
                <div className="space-y-2.5">
                  {CONSUMABLE_ITEMS.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl border border-pink-200 bg-pink-50/50 flex justify-between items-center gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.desc}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => buyConsumable(c.price, c.milkRestore, c.name)}
                        disabled={stats.money < c.price}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 tabular-nums ${
                          stats.money >= c.price
                            ? 'bg-pink-600 hover:bg-pink-700 text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        ¥{c.price}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShop(false)}
              className="mt-4 w-full py-3 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回家中</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFESSION MODAL */}
      {mode === GameMode.CONFESSION && showConfession && activeNPC && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl border-2 border-pink-300 relative overflow-hidden">
            <div className="flex flex-col items-center text-center mb-5">
              <PortraitAvatar
                characterId={activeNPC.id}
                name={activeNPC.name}
                species={activeNPC.species}
                className="w-32 h-32 rounded-2xl mb-3"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 mb-1">
                <Heart className="w-3.5 h-3.5 fill-pink-500" />
                <span>好感度突破 80 · 特别告白事件</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-display">{showConfession.title}</h2>
            </div>

            <div className="space-y-2.5 bg-pink-50/80 p-4 rounded-2xl border border-pink-100 mb-5 max-h-60 overflow-y-auto">
              {showConfession.lines.map((line, i) => (
                <p key={i} className="text-sm text-slate-800 leading-relaxed">
                  <span className="font-bold text-pink-700">{line.speakerName}：</span>
                  {line.text}
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              {showConfession.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleConfessionChoice(opt.action as 'ACCEPT_CONFESSION' | 'REJECT_CONFESSION')
                  }
                  className={`p-3.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.01] cursor-pointer ${
                    opt.action === 'ACCEPT_CONFESSION'
                      ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLOT INTERACTION */}
      {mode === GameMode.PLOT_INTERACTION && activeNPC && (
        <PlotMode
          npc={activeNPC}
          allNpcs={npcs}
          stats={stats}
          onChoice={handlePlotChoice}
          onGiveGift={handleGiveGift}
          onBack={() => setMode(GameMode.PLOT_SELECTION)}
        />
      )}

      {/* MINI GAME */}
      {mode === GameMode.MINI_GAME && activeNPC && (
        <MiniGame
          location={activeNPC.location}
          difficulty={Math.floor(activeNPC.favorability / 10) + 1}
          onComplete={handleMiniGameComplete}
          onCancel={() => setMode(GameMode.PLOT_SELECTION)}
        />
      )}

      {/* PARKOUR CHASE */}
      {mode === GameMode.PARKOUR && activeNPC && (
        <ParkourMode chaser={activeNPC} stats={stats} onComplete={handleParkourComplete} />
      )}

      {/* MODALS */}
      {showMissions && (
        <MissionsModal
          stats={stats}
          onClaim={handleClaimMission}
          onClose={() => setShowMissions(false)}
        />
      )}
      {showCodex && (
        <CodexModal
          npcs={npcs}
          stats={stats}
          unlockedEndings={unlockedEndings}
          onClose={() => setShowCodex(false)}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default App;
