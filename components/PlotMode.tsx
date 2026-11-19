import React, { useEffect, useState, useMemo } from 'react';
import { NPC, PlayerStats, DialogueOption, LocationType } from '../types';
import { generateOfflineStoryline } from '../services/storyService';
import { GIFT_ITEMS } from '../constants';
import PortraitAvatar from './PortraitAvatar';
import {
  Heart,
  HeartHandshake,
  AlertTriangle,
  ArrowLeft,
  Gift,
  ChevronRight,
  Users,
  RefreshCw,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface PlotModeProps {
  npc: NPC;
  allNpcs: Record<LocationType, NPC>;
  stats: PlayerStats;
  onChoice: (option: DialogueOption, sceneId: string, coStarId?: string) => void;
  onGiveGift: (giftId: string, npcId: string) => string;
  onBack: () => void;
}

const PlotMode: React.FC<PlotModeProps> = ({
  npc,
  allNpcs,
  stats,
  onChoice,
  onGiveGift,
  onBack,
}) => {
  const [variantOffset, setVariantOffset] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [giftReaction, setGiftReaction] = useState<string | null>(null);

  const scene = useMemo(
    () => generateOfflineStoryline(npc, allNpcs, stats, variantOffset),
    [npc, allNpcs, stats, variantOffset]
  );

  // Reset line index whenever scene changes
  useEffect(() => {
    setLineIndex(0);
    setGiftReaction(null);
  }, [scene.id, variantOffset]);

  const currentLine = scene.lines[Math.min(lineIndex, scene.lines.length - 1)];
  const isAtChoices = lineIndex >= scene.lines.length - 1;
  const isPartner = stats.relationship === npc.id;

  const coStarNpc = scene.coStarId
    ? (Object.values(allNpcs) as NPC[]).find((n) => n.id === scene.coStarId) || null
    : null;

  const ownedGifts = GIFT_ITEMS.filter(
    (g) => (stats.gifts[g.id] || 0) > 0 && g.favoriteOf !== 'son'
  );

  const handleNextLine = () => {
    if (giftReaction) {
      setGiftReaction(null);
      return;
    }
    if (!isAtChoices) {
      playSound('click');
      setLineIndex((prev) => prev + 1);
    }
  };

  const handleGiftClick = (giftId: string) => {
    const reaction = onGiveGift(giftId, npc.id);
    setGiftReaction(reaction);
    setShowGiftMenu(false);
  };

  const leftSpeakerId = scene.isCrossover ? npc.id : 'rabbit_dad';
  const leftSpeakerName = scene.isCrossover ? npc.name : '兔爸爸';
  const leftSpeakerSpecies = scene.isCrossover ? npc.species : 'Little Rabbit';

  const rightSpeakerId = scene.isCrossover && coStarNpc ? coStarNpc.id : npc.id;
  const rightSpeakerName = scene.isCrossover && coStarNpc ? coStarNpc.name : npc.name;
  const rightSpeakerSpecies = scene.isCrossover && coStarNpc ? coStarNpc.species : npc.species;

  const activeSpeakerId = giftReaction ? npc.id : currentLine.speakerId;

  return (
    <div className="h-full w-full flex flex-col justify-end relative pt-20 pb-4 px-4 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-950/60">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* Top Scene Header & Dual Relationship Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/92 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-pink-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            {scene.isCrossover && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5" />
                联动剧情
              </span>
            )}
            <span className="font-black text-slate-900 text-sm sm:text-base font-display">
              {scene.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-700">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span>{npc.name}:</span>
              <span className="tabular-nums">{npc.favorability}/100</span>
              {isPartner && (
                <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md">
                  <HeartHandshake className="w-3.5 h-3.5" /> 伴侣
                </span>
              )}
            </div>
            {coStarNpc && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 border-l border-slate-200 pl-3">
                <span>{coStarNpc.name}:</span>
                <span className="tabular-nums">{coStarNpc.favorability}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Anime Character Portrait Stage */}
        <div className="flex-1 flex items-end justify-center gap-6 sm:gap-16 min-h-0 pb-1">
          {/* Left Portrait */}
          <div
            className={`transition-all duration-200 flex flex-col items-center ${
              activeSpeakerId === leftSpeakerId
                ? 'scale-105 opacity-100 z-10'
                : 'scale-95 opacity-65'
            }`}
          >
            <PortraitAvatar
              characterId={leftSpeakerId}
              name={leftSpeakerName}
              species={leftSpeakerSpecies}
              className="w-36 h-36 sm:w-52 sm:h-52 rounded-3xl border-4 border-white shadow-2xl"
            />
            <div className="mt-2 px-3 py-0.5 rounded-lg bg-white/95 text-slate-800 font-bold text-xs shadow">
              {leftSpeakerName}
            </div>
          </div>

          {/* Right Portrait */}
          <div
            className={`transition-all duration-200 flex flex-col items-center ${
              activeSpeakerId === rightSpeakerId
                ? 'scale-105 opacity-100 z-10'
                : 'scale-95 opacity-65'
            }`}
          >
            <PortraitAvatar
              characterId={rightSpeakerId}
              name={rightSpeakerName}
              species={rightSpeakerSpecies}
              className="w-36 h-36 sm:w-52 sm:h-52 rounded-3xl border-4 border-white shadow-2xl"
            />
            <div className="mt-2 px-3 py-0.5 rounded-lg bg-white/95 text-slate-800 font-bold text-xs shadow">
              {rightSpeakerName}
            </div>
          </div>
        </div>

        {/* Visual Novel Dialogue Box */}
        <div className="bg-white/96 backdrop-blur-md rounded-3xl border-2 border-pink-300 shadow-2xl p-5 sm:p-6">
          {/* Speaker Header + Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-pink-600 text-white font-bold text-xs sm:text-sm">
                {giftReaction ? npc.name : currentLine.speakerName}
              </span>
              {!giftReaction && (
                <span className="text-xs text-slate-400 font-bold tabular-nums">
                  对话 {lineIndex + 1} / {scene.lines.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!scene.isCrossover && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowGiftMenu((prev) => !prev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>送礼 ({ownedGifts.reduce((sum, g) => sum + (stats.gifts[g.id] || 0), 0)})</span>
                </button>
              )}
              {!scene.isCrossover && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setVariantOffset((v) => v + 1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>换段对话</span>
                </button>
              )}
            </div>
          </div>

          {/* Gift Drawer */}
          {showGiftMenu && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200">
              <div className="text-xs font-bold text-amber-900 mb-2">
                选择要送给 {npc.name} 的礼物（可在家里网购小铺购买更多）：
              </div>
              {ownedGifts.length === 0 ? (
                <div className="text-xs text-amber-700">
                  背包里暂时没有礼物哦！回家去「网购小铺」挑一件吧。
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ownedGifts.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGiftClick(g.id)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{g.icon}</span>
                      <span>{g.name}</span>
                      <span className="text-amber-700 tabular-nums">x{stats.gifts[g.id]}</span>
                      {g.favoriteOf === npc.id && (
                        <span className="text-[10px] text-pink-600 font-black">★最爱</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dialogue Text Area */}
          <div
            onClick={handleNextLine}
            className={`min-h-[68px] mb-4 ${!isAtChoices || giftReaction ? 'cursor-pointer' : ''}`}
          >
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
              {giftReaction || currentLine.text}
            </p>
          </div>

          {/* Step Forward Button OR Choices */}
          {giftReaction ? (
            <button
              type="button"
              onClick={() => setGiftReaction(null)}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>继续对话</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : !isAtChoices ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setLineIndex(scene.lines.length - 1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                跳过对话
              </button>
              <button
                type="button"
                onClick={handleNextLine}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer shadow"
              >
                <span>下一句</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scene.options.map((opt, idx) => {
                  const effectiveRisk = isPartner && !scene.isCrossover ? 0 : opt.risk;
                  const isHighRisk = effectiveRisk >= 0.3;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChoice(opt, scene.id, scene.coStarId)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                        isHighRisk
                          ? 'border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-900'
                          : 'border-slate-200 bg-slate-50/80 hover:bg-pink-50 hover:border-pink-300 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-snug">{opt.text}</div>
                        {opt.rewardHint && (
                          <div className="text-[11px] text-pink-700 font-semibold mt-0.5">
                            {opt.rewardHint}
                          </div>
                        )}
                      </div>
                      {effectiveRisk > 0 && (
                        <span
                          className={`text-xs font-bold shrink-0 flex items-center gap-1 tabular-nums ${
                            isHighRisk ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {Math.round(effectiveRisk * 100)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回商店街 (不消耗时间)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlotMode;
