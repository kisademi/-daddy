import React from 'react';
import { GameOverReason, PlayerStats } from '../types';
import { ENDINGS_CATALOG } from '../constants';
import { Lock, Skull, HeartHandshake, Frown, TrendingDown, Users, RotateCcw } from 'lucide-react';

interface GameOverProps {
  reason: GameOverReason;
  stats: PlayerStats;
  unlockedEndings: GameOverReason[];
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ reason, stats, unlockedEndings, onRestart }) => {
  const getIcon = () => {
    switch (reason) {
      case 'CAPTURED':
        return <Skull className="w-16 h-16 mx-auto text-rose-400 mb-4" />;
      case 'OUT_OF_MILK_IMPRISONED':
        return <Lock className="w-16 h-16 mx-auto text-pink-400 mb-4" />;
      case 'OUT_OF_MILK_BAD':
        return <Frown className="w-16 h-16 mx-auto text-slate-400 mb-4" />;
      case 'SON_SAD':
        return <Frown className="w-16 h-16 mx-auto text-sky-400 mb-4" />;
      case 'SON_HAPPY':
        return <HeartHandshake className="w-16 h-16 mx-auto text-amber-400 mb-4" />;
      case 'BANKRUPTCY':
        return <TrendingDown className="w-16 h-16 mx-auto text-slate-400 mb-4" />;
      case 'HAREM_ENDING':
        return <Users className="w-16 h-16 mx-auto text-violet-400 mb-4" />;
    }
  };

  const getNarrative = () => {
    switch (reason) {
      case 'CAPTURED':
        return '你没能躲过肉食动物的深夜追逐，体力耗尽后被对方带回了私人领地，只能乖乖接受“特别照料”……';
      case 'OUT_OF_MILK_IMPRISONED':
        return '你在高好感度肉食动物面前体力透支晕倒了。心疼又偏执的对方决定把你留下来，打造了一个温暖却离不开的豪华房间……';
      case 'OUT_OF_MILK_BAD':
        return '你在街角体力透支晕倒，幸好被路过的巡逻员送回了家，但耽误了宝贵的打工时间……';
      case 'SON_SAD':
        return '第 10 天的学费结算日到了，口袋里的钱还是不够。看着兔宝宝强忍失落安慰你的模样，你暗下决心一定要重整旗鼓。';
      case 'SON_HAPPY':
        return '第 10 天结算圆满达标！今晚你和兔宝宝围坐在餐桌前享用了丰盛的胡萝卜大餐，所有的奔波与汗水都化作了幸福的笑容！';
      case 'BANKRUPTCY':
        return '结算日到来时没能凑够 ¥1,000 的店铺租金，房东收回了店面，你的创业计划遗憾告吹……';
      case 'HAREM_ENDING':
        return '虎校长、狐老板与狼大哥同时察觉到了彼此的存在！由于你迟迟没有做出选择，三人达成了一致协议——共同守护（独占）你和兔宝宝的未来！';
    }
  };

  const info = ENDINGS_CATALOG.find((e) => e.id === reason);

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-6 text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
        {getIcon()}

        <div className="text-xs font-bold tracking-wide text-pink-400 mb-2">
          {info?.badge || '结局达成'} · 已收集 {unlockedEndings.length}/{ENDINGS_CATALOG.length} 种结局
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3 font-display text-white">
          {info?.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
          {getNarrative()}
        </p>

        <div className="grid grid-cols-3 gap-3 bg-slate-800/70 rounded-2xl p-4 mb-6 border border-slate-700/80">
          <div>
            <div className="text-[11px] text-slate-400">生存天数</div>
            <div className="text-lg font-black text-white tabular-nums">第 {stats.day} 天</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">累计赚取</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums">¥{stats.totalEarned}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">成功逃脱</div>
            <div className="text-lg font-black text-amber-300 tabular-nums">{stats.parkourWins} 次</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer ${
            reason === 'SON_HAPPY'
              ? 'bg-pink-600 hover:bg-pink-500 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{reason === 'SON_HAPPY' ? `进入第 ${stats.semester + 1} 学期继续努力` : '重新开始新的故事'}</span>
        </button>
      </div>
    </div>
  );
};

export default GameOver;
