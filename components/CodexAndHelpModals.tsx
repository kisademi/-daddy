import React from 'react';
import { GameOverReason, LocationType, NPC, PlayerStats } from '../types';
import { ENDINGS_CATALOG, MISSION_DEFS } from '../constants';
import PortraitAvatar from './PortraitAvatar';
import { X, HeartHandshake, Award, Lock, CheckCircle2 } from 'lucide-react';

interface CodexModalProps {
  npcs: Record<LocationType, NPC>;
  stats: PlayerStats;
  unlockedEndings: GameOverReason[];
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  npcs,
  stats,
  unlockedEndings,
  onClose,
}) => {
  const mainNpcs = [
    npcs[LocationType.SCHOOL],
    npcs[LocationType.SHOP],
    npcs[LocationType.BAR],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">小镇羁绊与结局图鉴</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              角色好感度均 ≥25 可触发联动剧情 · ≥81 可触发告白事件 · 已收集 {unlockedEndings.length}/{ENDINGS_CATALOG.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
            aria-label="关闭图鉴"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* NPC Favorability List */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">主要角色好感度</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mainNpcs.map((npc) => {
                const isPartner = stats.relationship === npc.id;
                return (
                  <div
                    key={npc.id}
                    className={`p-3.5 rounded-2xl border ${
                      isPartner ? 'bg-pink-50 border-pink-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <PortraitAvatar
                        characterId={npc.id}
                        name={npc.name}
                        species={npc.species}
                        className="w-14 h-14 rounded-xl"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">{npc.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {isPartner ? (
                            <span className="text-pink-600 font-bold flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5" /> 伴侣
                            </span>
                          ) : (
                            <span className="tabular-nums">好感度 {npc.favorability}/100</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-pink-500"
                        style={{ width: `${Math.min(100, npc.favorability)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Endings Catalog */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>多结局收集 ({unlockedEndings.length}/{ENDINGS_CATALOG.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENDINGS_CATALOG.map((ending) => {
                const unlocked = unlockedEndings.includes(ending.id);
                return (
                  <div
                    key={ending.id}
                    className={`p-3.5 rounded-2xl border ${
                      unlocked
                        ? ending.isPositive
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/60 border-slate-200/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">
                        {unlocked ? ending.title : '未解锁结局'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        {!unlocked && <Lock className="w-3 h-3" />}
                        {ending.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {unlocked ? ending.summary : '在小镇生活中探索不同选择以解锁此结局。'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MissionsModalProps {
  stats: PlayerStats;
  onClaim: (missionId: string) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ stats, onClaim, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">目标赏金任务</h2>
            <p className="text-xs text-slate-500 mt-0.5">达成小镇生活里程碑即可领取丰厚资金与牛奶补给</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
            aria-label="关闭任务"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {MISSION_DEFS.map((m) => {
            const completed = m.isComplete(stats);
            const claimed = stats.claimedMissions.includes(m.id);

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  claimed
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : completed
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{m.title}</span>
                    {claimed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  <div className="text-xs font-bold text-amber-700 mt-1">{m.rewardText}</div>
                </div>

                {claimed ? (
                  <span className="text-xs font-bold text-emerald-700 shrink-0">已领取</span>
                ) : completed ? (
                  <button
                    type="button"
                    onClick={() => onClaim(m.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    领取奖励
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400 shrink-0">进行中</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 font-display">兔爸爸小镇生存指南</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
            aria-label="关闭指南"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">1. 横版商店街探索与偶遇</h3>
            <p className="text-xs text-slate-600">
              用 <span className="font-bold">A / D</span> 或 <span className="font-bold">← / →</span> 在街道左右散步，路上能捡到掉落金币与新鲜牛奶，靠近建筑按 <span className="font-bold">E / 空格</span> 进门。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">2. 多角色联动修罗场 & 送礼系统</h3>
            <p className="text-xs text-slate-600">
              在家中网购小铺购买 <span className="font-bold text-amber-700">专属礼物</span>，能在对话界面送给虎校长、狐老板、狼大哥或兔宝宝！提升多位角色好感度至 25+ 后，拜访他们还会触发双人同框联动修罗场剧情！
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">3. 深夜跑酷追逐战</h3>
            <p className="text-xs text-slate-600">
              深夜时段外出或高风险选项可能触发横版跑酷！按 <span className="font-bold">W / ↑ / 空格</span> 跳跃（支持二段跳），<span className="font-bold">S / ↓</span> 滑铲躲避高空猫头鹰，坚持 16 秒即可逃脱。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">4. 十天学费目标与目标赏金</h3>
            <p className="text-xs text-slate-600">
              每 10 天需要回家缴纳 <span className="font-bold text-sky-700">¥2,000</span> 学费。别忘了查看顶部「目标赏金」领取额外资金与能量！
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm cursor-pointer mt-2"
          >
            我明白了，开始赚学费！
          </button>
        </div>
      </div>
    </div>
  );
};
