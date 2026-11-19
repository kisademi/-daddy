import React from 'react';
import { PlayerStats } from '../types';
import { TIME_SLOTS, DAYS_PER_SEMESTER, MISSION_DEFS } from '../constants';
import {
  Milk,
  Banknote,
  GraduationCap,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Award,
} from 'lucide-react';

interface GameOverlayProps {
  stats: PlayerStats;
  muted: boolean;
  onToggleMute: () => void;
  onOpenMissions: () => void;
  onOpenCodex: () => void;
  onOpenHelp: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  stats,
  muted,
  onToggleMute,
  onOpenMissions,
  onOpenCodex,
  onOpenHelp,
}) => {
  const daysIntoSemester = ((stats.day - 1) % DAYS_PER_SEMESTER) + 1;
  const daysLeft = DAYS_PER_SEMESTER - daysIntoSemester + 1;
  const milkPct = Math.max(0, Math.min(100, Math.floor(stats.milk)));
  const tuitionPct = Math.min(100, Math.round((stats.tuitionPaid / stats.tuitionTotal) * 100));
  const isLowMilk = milkPct <= 25;
  const isNight = stats.timeSlot === 4;

  const claimableMissionsCount = MISSION_DEFS.filter(
    (m) => m.isComplete(stats) && !stats.claimedMissions.includes(m.id)
  ).length;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-start justify-between gap-3">
        {/* Left Resource Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
          {/* Milk / Energy Meter */}
          <div className="bg-white/92 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pink-200 shadow-sm flex items-center gap-3 min-w-[200px]">
            <div className={`p-2 rounded-xl ${isLowMilk ? 'bg-red-100 text-red-600' : 'bg-pink-100 text-pink-600'}`}>
              {isLowMilk ? <AlertCircle className="w-5 h-5" /> : <Milk className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-[110px]">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className={isLowMilk ? 'text-red-700' : 'text-pink-900'}>
                  {isLowMilk ? '牛奶能量告急' : '香甜牛奶'}
                </span>
                <span className={`tabular-nums ${isLowMilk ? 'text-red-600' : 'text-pink-700'}`}>
                  {milkPct}%
                </span>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLowMilk ? 'bg-red-500' : 'bg-pink-500'
                  }`}
                  style={{ width: `${milkPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Money */}
          <div className="bg-white/92 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-800 font-semibold leading-tight">私房钱</div>
              <div className="text-base font-black text-emerald-700 tabular-nums leading-tight">
                ¥{stats.money.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tuition Progress */}
          <div className="bg-white/92 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-sky-200 shadow-sm flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-[110px]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-sky-800 mb-0.5">
                <span>第{stats.semester}期学费</span>
                <span className="tabular-nums">{tuitionPct}%</span>
              </div>
              <div className="text-sm font-black text-sky-700 tabular-nums leading-tight">
                ¥{stats.tuitionPaid.toLocaleString()} / ¥{stats.tuitionTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Calendar + Interactive Panels */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div
            className={`backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-sm flex items-center gap-3 text-sm ${
              isNight
                ? 'bg-slate-900/90 border-indigo-400/50 text-white'
                : 'bg-white/92 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className={`w-4 h-4 ${isNight ? 'text-indigo-300' : 'text-pink-600'}`} />
              <span className="font-bold tabular-nums">第 {stats.day} 天</span>
              <span className={`text-xs ${isNight ? 'text-slate-300' : 'text-slate-500'}`}>
                · 距结算 {daysLeft} 天
              </span>
            </div>
            <div className={`w-px h-4 ${isNight ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock className={`w-4 h-4 ${isNight ? 'text-rose-400' : 'text-slate-600'}`} />
              <span className={`font-bold tabular-nums ${isNight ? 'text-rose-300' : 'text-slate-800'}`}>
                {TIME_SLOTS[stats.timeSlot]} ({stats.timeSlot}/4)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMissions}
            className={`h-11 px-3.5 rounded-2xl border shadow-sm font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              claimableMissionsCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                : 'bg-white/92 hover:bg-white border-slate-200 text-slate-700'
            }`}
            title="每日赏金目标"
          >
            <Award className="w-4 h-4" />
            <span>
              目标赏金{claimableMissionsCount > 0 ? ` (${claimableMissionsCount})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCodex}
            className="h-11 px-3.5 rounded-2xl bg-white/92 hover:bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="好感度与结局图鉴"
          >
            <BookOpen className="w-4 h-4 text-pink-600" />
            <span className="hidden sm:inline">羁绊图鉴</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="h-11 w-11 rounded-2xl bg-white/92 hover:bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="玩法说明"
            aria-label="玩法说明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="h-11 w-11 rounded-2xl bg-white/92 hover:bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title={muted ? '开启音效' : '静音'}
            aria-label={muted ? '开启音效' : '静音'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-pink-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default GameOverlay;
