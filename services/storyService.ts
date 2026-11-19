import { NPC, PlayerStats, DialogueScene, LocationType } from '../types';
import { TIME_SLOTS } from '../constants';

interface StoryContext {
  npc: NPC;
  allNpcs: Record<LocationType, NPC>;
  stats: PlayerStats;
}

const getOutfitComment = (equippedItem: string | null, npcId: string): string | null => {
  if (!equippedItem) return null;
  if (equippedItem === 'apron') {
    if (npcId === 'tiger_principal') return '（虎校长目光落在了你系着蝴蝶结的蓝色打工围裙上，轻咳了一声）';
    if (npcId === 'fox_owner') return '（狐老板摇着扇子打量你身上的围裙：小兔子穿这身可真贤惠啊~）';
    if (npcId === 'wolf_boss') return '（狼大哥挑眉看了眼你的围裙：刚忙完家务就跑出来了？）';
  }
  if (equippedItem === 'uniform') {
    if (npcId === 'tiger_principal') return '（虎校长推了推眼镜，耳根微微一热：你穿这身学院制服……意外地很合身。）';
    if (npcId === 'fox_owner') return '（狐老板啧啧称奇：穿得像个优等生一样，虎校长看了肯定把持不住吧？）';
    if (npcId === 'wolf_boss') return '（狼大哥压低声音笑了一声：穿成这样来酒吧，你是故意吸引注意力的吗？）';
  }
  if (equippedItem === 'cloak') {
    if (npcId === 'tiger_principal') return '（虎校长皱眉看着你的夜行斗篷：晚上风凉，穿这个倒是挺挡风。）';
    if (npcId === 'fox_owner') return '（狐老板轻笑：穿这么严实防着谁呢？难道是防我？）';
    if (npcId === 'wolf_boss') return '（狼大哥满意地点头：这件斗篷不错，夜里赶路安全得多。）';
  }
  return null;
};

// --- CROSSOVER SCENES (多角色联动互动剧情) ---
const getCrossoverScene = ({ npc, allNpcs, stats }: StoryContext): DialogueScene | null => {
  const tigerFav = allNpcs[LocationType.SCHOOL].favorability;
  const foxFav = allNpcs[LocationType.SHOP].favorability;
  const wolfFav = allNpcs[LocationType.BAR].favorability;

  // 1. School Crossover: Fox delivers supplies & clashes with Tiger
  if (
    npc.id === 'tiger_principal' &&
    foxFav >= 25 &&
    !stats.seenEvents.includes('cross_school_fox')
  ) {
    return {
      id: 'cross_school_fox',
      title: '【联动事件】校长室的午茶修罗场',
      isCrossover: true,
      coStarId: 'fox_owner',
      lines: [
        {
          speakerId: 'fox_owner',
          speakerName: '狐老板',
          text: '（推开校长室木门，手里拎着点心盒笑眯眯地）呀，真巧啊虎校长，我是来送文具订单的——顺便看看我家小兔子。',
        },
        {
          speakerId: 'tiger_principal',
          speakerName: '虎校长',
          text: '（瞬间站起身挡在办公桌前，镜片反着寒光）“你家”？狐老板，这里是樱川学园，兔爸爸现在是学校特聘助手。',
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '那、那个……两位先别瞪着彼此了，我刚泡好两杯热茶……',
        },
        {
          speakerId: 'fox_owner',
          speakerName: '狐老板',
          text: '听见没，小兔子可心疼人了。兔爸爸，不如跟狐狸哥哥回铺子里帮忙？我出的工钱比某些死板老虎高三成哦？',
        },
      ],
      options: [
        {
          text: '站到虎校长这边：“在学校工作很安稳！”',
          action: 'SIDE_PRIMARY',
          risk: 0,
          rewardHint: '虎校长好感+18 / 狐老板微醋+5 / +¥140',
        },
        {
          text: '接过狐老板的点心：“其实我也想去逛逛铺子…”',
          action: 'SIDE_COSTAR',
          risk: 0.1,
          rewardHint: '狐老板好感+18 / 虎校长好感+5 / +¥160',
        },
        {
          text: '端出双份香甜牛奶：“两位大人一起喝杯奶消消气吧！”',
          action: 'PACIFY_BOTH',
          risk: 0.15,
          rewardHint: '双人好感+12 / 消耗20%能量 / +¥240',
        },
      ],
    };
  }

  // 2. Shop Crossover: Wolf drops by corner shop looking for Rabbit Dad
  if (
    npc.id === 'fox_owner' &&
    wolfFav >= 25 &&
    !stats.seenEvents.includes('cross_shop_wolf')
  ) {
    return {
      id: 'cross_shop_wolf',
      title: '【联动事件】杂货铺里的银狼访客',
      isCrossover: true,
      coStarId: 'wolf_boss',
      lines: [
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '（门口风铃叮当作响，银狼推门走进暖黄灯笼下，目光直接锁定正在理货的你）听说你下午在这里打工。',
        },
        {
          speakerId: 'fox_owner',
          speakerName: '狐老板',
          text: '（立刻用折扇挡住半边脸，语气拉长）哎呀，稀客啊狼老大，白天不睡觉跑来我的小店做什么？买针线吗？',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '顺路而已。顺便提醒某只狐狸，别仗着会算账就压榨这只小兔子的工钱。',
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '狼大哥、狐老板，其实大家对我都挺照顾的……！',
        },
      ],
      options: [
        {
          text: '帮狐老板说话：“狐老板给的工钱其实很公道！”',
          action: 'SIDE_PRIMARY',
          risk: 0.1,
          rewardHint: '狐老板好感+18 / 狼大哥+5 / +¥160',
        },
        {
          text: '走到狼大哥身边：“谢谢大哥特意来看我！”',
          action: 'SIDE_COSTAR',
          risk: 0.1,
          rewardHint: '狼大哥好感+18 / 狐老板+5 / +¥160',
        },
        {
          text: '把两人都拉到柜台边品尝新品牛奶布丁',
          action: 'PACIFY_BOTH',
          risk: 0.15,
          rewardHint: '双人好感+12 / 消耗20%能量 / +¥250',
        },
      ],
    };
  }

  // 3. Bar Crossover: Tiger Principal inspects the Jazz Bar!
  if (
    npc.id === 'wolf_boss' &&
    tigerFav >= 35 &&
    !stats.seenEvents.includes('cross_bar_tiger')
  ) {
    return {
      id: 'cross_bar_tiger',
      title: '【联动事件】深夜查岗的虎校长',
      isCrossover: true,
      coStarId: 'tiger_principal',
      lines: [
        {
          speakerId: 'tiger_principal',
          speakerName: '虎校长',
          text: '（穿着笔挺西装站在爵士酒吧门口，表情严肃得像在巡查考场）兔爸爸，我猜到你为了赚外快可能会来这种地方。',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '（靠在吧台后面冷笑一声，晃了晃手中的威士忌冰块）大校长屈尊降贵光临小店，是来抓学生还是来抢人的？',
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '呜哇……我只是在这里当正经调酒师赚学费的！',
        },
        {
          speakerId: 'tiger_principal',
          speakerName: '虎校长',
          text: '（神色软化了几分）正经工作当然支持，但晚上一个人走夜路太危险了。谈完这单，我送你回家。',
        },
      ],
      options: [
        {
          text: '向狼大哥表态：“酒吧的时薪很实在，我会留下来调完这班酒！”',
          action: 'SIDE_PRIMARY',
          risk: 0.1,
          rewardHint: '狼大哥好感+18 / 虎校长+5 / +¥180',
        },
        {
          text: '顺从地收拾围裙：“让虎校长担心了，待会麻烦您护送啦。”',
          action: 'SIDE_COSTAR',
          risk: 0.05,
          rewardHint: '虎校长好感+18 / 狼大哥+5 / +¥150',
        },
        {
          text: '调两杯无酒精牛奶特饮：“两位难得同框，我请客！”',
          action: 'PACIFY_BOTH',
          risk: 0.12,
          rewardHint: '双人好感+14 / 消耗20%能量 / +¥260',
        },
      ],
    };
  }

  return null;
};

// --- TIERED SINGLE CHARACTER STORYLINE GENERATOR ---
export const generateOfflineStoryline = (
  npc: NPC,
  allNpcs: Record<LocationType, NPC>,
  stats: PlayerStats,
  variantOffset = 0
): DialogueScene => {
  // Check Crossover Event first (only on initial entry when variantOffset === 0)
  if (variantOffset === 0) {
    const crossover = getCrossoverScene({ npc, allNpcs, stats });
    if (crossover) return crossover;
  }

  const timeName = TIME_SLOTS[stats.timeSlot] || '白天';
  const isPartner = stats.relationship === npc.id;
  const hasOtherPartner = Boolean(stats.relationship && stats.relationship !== npc.id);
  const outfitLine = getOutfitComment(stats.equippedItem, npc.id);
  const fav = npc.favorability;

  // Pick tier: 0 = 0-24, 1 = 25-54, 2 = 55-80, 3 = partner or 81+
  const tier = isPartner || fav >= 81 ? 3 : fav >= 55 ? 2 : fav >= 25 ? 1 : 0;

  if (npc.id === 'tiger_principal') {
    const scenes: DialogueScene[] = [
      {
        id: 'tiger_t0',
        title: '樱川学园 · 校长室初遇',
        lines: [
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: `${outfitLine || ''}（虎校长放下钢笔，威严地扶了扶金丝眼镜）${timeName}好，兔爸爸。听说兔宝宝这学期成绩进步很快，但学费压力也不小吧？`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '是的校长！只要有活干，擦黑板、整理档案我什么都能做的！',
          },
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: '……别那么急着俯身鞠躬，耳朵都要蹭到我桌上了。学校正好需要清理大黑板，或者……如果你带了你做的特调牛奶，我也可以按营养补助高价收购。',
          },
        ],
        options: [
          { text: '卷起袖子去擦教室黑板 (打工小游戏)', action: 'WORK', risk: 0.05 },
          { text: '双手递上一瓶温热香甜牛奶 (消耗25%能量)', action: 'TRADE_MILK', risk: 0.15 },
          { text: '抖抖兔耳朵问校长今天累不累 (好感+15)', action: 'FLIRT', risk: 0.25 },
          { text: '先礼貌告别去别处看看', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'tiger_t1',
        title: '樱川学园 · 渐入佳境的关心',
        lines: [
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: `${outfitLine || ''}（办公室里飘着红茶香气，虎校长看到你进来，嘴角不自觉柔和下来）你来得正好，我刚让食堂多留了一份胡萝卜三明治。`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '哇，谢谢校长！您其实一点也不像传闻中那么严厉呢。',
          },
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: '咳……在学生面前当然要保持威严。不过在你和兔宝宝面前，没必要绷着。今天打算怎么赚这笔补助？',
          },
        ],
        options: [
          { text: '帮校长整理教案与擦黑板 (打工小游戏)', action: 'WORK', risk: 0.05 },
          { text: '献上今日新鲜现榨香甜牛奶 (高额回报)', action: 'TRADE_MILK', risk: 0.18 },
          { text: '凑近帮虎校长整理微歪的红领带 (好感+15)', action: 'FLIRT', risk: 0.28 },
          { text: '礼貌道谢离开', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'tiger_t2',
        title: '樱川学园 · 藏不住的偏爱',
        lines: [
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: `${outfitLine || ''}（虎校长合上窗户把窗帘拉上一半，耳根通红地看着你）${hasOtherPartner ? '听说你最近跟别人走得很近……不过只要你来学园，位置永远给你留着。' : '外面那些商贩一个个油嘴滑舌的，你以后少单独去应付他们。'}`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '虎校长今天眼神好炽热……是我做错什么了吗？',
          },
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: '笨蛋兔子，你什么都没做错，错的是你太让人放心不下。来吧，今天想要校长的特别补贴吗？',
          },
        ],
        options: [
          { text: '认真完成教室清理兼职 (高好感奖金加成)', action: 'WORK', risk: 0.08 },
          { text: '把最浓郁的一瓶香甜牛奶递给他', action: 'TRADE_MILK', risk: 0.22 },
          { text: '轻声说“其实校长对我最好了” (好感+15)', action: 'FLIRT', risk: 0.35 },
          { text: '害羞地先退回走廊', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'tiger_t3',
        title: '樱川学园 · 专属伴侣的宠溺时光',
        lines: [
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: `${outfitLine || ''}（虎校长自然地接过你手里的提包，指尖轻轻顺过你软绵绵的兔耳朵）辛苦了，我的特别助理。今天兔宝宝在课堂上又拿了满分小红花。`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '真的吗！不过就算成了伴侣，我还是想自己努力赚私房钱养家呀！',
          },
          {
            speakerId: 'tiger_principal',
            speakerName: '虎校长',
            text: '（低笑一声揉揉你的头发）好好好，全听你的。校长的黑卡和工作津贴随时任你挑。',
          },
        ],
        options: [
          { text: '一边聊家常一边帮忙整理黑板 (打工小游戏)', action: 'WORK', risk: 0 },
          { text: '亲自给伴侣喂一杯甜蜜温牛奶 (高额收益)', action: 'TRADE_MILK', risk: 0 },
          { text: '踮起脚尖在虎校长脸颊轻吻一下 (甜蜜零风险)', action: 'FLIRT', risk: 0 },
          { text: '挥挥手回商店街继续忙碌', action: 'LEAVE', risk: 0 },
        ],
      },
    ];
    return scenes[(tier + variantOffset) % scenes.length];
  }

  if (npc.id === 'fox_owner') {
    const scenes: DialogueScene[] = [
      {
        id: 'fox_t0',
        title: '狐堂杂货铺 · 暖灯初见',
        lines: [
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: `${outfitLine || ''}（纸灯笼光影摇曳，狐老板摇着绘有红梅的折扇笑眯眯迎上来）哟，${timeName}好呀，可爱的兔爸爸~`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '狐老板好！您这儿今天需要理货人手吗？',
          },
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: '理货嘛随时缺人，手脚麻利我就给你双倍算！不过嘛……听说兔爸爸自制的“香甜牛奶”连隔壁街的小动物都馋哭了，不考虑卖给哥哥尝尝？',
          },
        ],
        options: [
          { text: '系好袖口帮忙精准理货 (打工小游戏)', action: 'WORK', risk: 0.08 },
          { text: '出售一瓶招牌香甜牛奶 (消耗25%能量)', action: 'TRADE_MILK', risk: 0.14 },
          { text: '眨眨眼用甜言蜜语和狐老板讲价 (好感+15)', action: 'FLIRT', risk: 0.3 },
          { text: '只是进来看看，礼貌告辞', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'fox_t1',
        title: '狐堂杂货铺 · 尾尖的试探',
        lines: [
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: `${outfitLine || ''}（狐老板靠在檀木柜台旁，毛茸茸的狐狸尾巴在身后轻轻晃动）小兔子越来越会挑时候来了，刚到的桂花糖糕还热着呢。`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '狐老板每次都这么会哄人开心，不过生意归生意，工资可不能少哦！',
          },
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: '哈哈，小财迷真可爱。放心，别人来我是一毛不拔，对你嘛——我随时愿意破例。',
          },
        ],
        options: [
          { text: '专心整理货架赚取工钱 (打工小游戏)', action: 'WORK', risk: 0.08 },
          { text: '拿出温热的限量特调牛奶交易', action: 'TRADE_MILK', risk: 0.16 },
          { text: '好奇地问他尾巴摸起来是不是很软 (好感+15)', action: 'FLIRT', risk: 0.34 },
          { text: '摆手告别，去街上转转', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'fox_t2',
        title: '狐堂杂货铺 · 算盘打乱了心弦',
        lines: [
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: `${outfitLine || ''}（狐老板罕见地没拨算盘，金眸似笑非笑地盯着你）${hasOtherPartner ? '小兔子心里住着别人，却还敢往我怀里钻，真是坏心眼啊。' : '最近一听到门铃响，我就猜是不是你来了——你说，这笔相思账怎么算？'}`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '狐、狐老板离得太近了啦，客人们要看到了……！',
          },
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: '怕什么，整条街都知道我狐堂老板就宠你这只小兔子。快说说，今天怎么酬谢我？',
          },
        ],
        options: [
          { text: '红着脸低头去货架理货 (高好感奖金加成)', action: 'WORK', risk: 0.1 },
          { text: '用特制香甜牛奶安抚这只狡猾狐狸', action: 'TRADE_MILK', risk: 0.2 },
          { text: '小声说“那我给你抱一下算利息好不好” (好感+15)', action: 'FLIRT', risk: 0.38 },
          { text: '溜出店铺透透气', action: 'LEAVE', risk: 0 },
        ],
      },
      {
        id: 'fox_t3',
        title: '狐堂杂货铺 · 独家老板娘日常',
        lines: [
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: `${outfitLine || ''}（狐老板一见你进来立刻挂出“休息中”木牌，笑吟吟为你沏上热茶）店铺账本都交给你管了，怎么兔爸爸还是这么勤快？`,
          },
          {
            speakerId: 'rabbit_dad',
            speakerName: '兔爸爸',
            text: '因为和狐老板一起照看小店特别开心呀！',
          },
          {
            speakerId: 'fox_owner',
            speakerName: '狐老板',
            text: '嘴这么甜，真想把你藏进狐尾里捂着不让别人看见。来，今天也由你做主。',
          },
        ],
        options: [
          { text: '夫妻同心快速理货赚营业额 (打工小游戏)', action: 'WORK', risk: 0 },
          { text: '和狐老板分享香甜特调牛奶 (高额回报)', action: 'TRADE_MILK', risk: 0 },
          { text: '悄悄把下巴搭在他肩膀上撒娇 (甜蜜零风险)', action: 'FLIRT', risk: 0 },
          { text: '亲他一口后出门巡街', action: 'LEAVE', risk: 0 },
        ],
      },
    ];
    return scenes[(tier + variantOffset) % scenes.length];
  }

  // Wolf Boss
  const scenes: DialogueScene[] = [
    {
      id: 'wolf_t0',
      title: '夜色爵士吧 · 危险的霓虹',
      lines: [
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: `${outfitLine || ''}（爵士萨克斯低声流淌，银发狼耳男人坐在吧台角落，锋利的金眸扫过你微颤的兔耳朵）胆子不小，食草动物也敢在${timeName}独闯爵士吧？`,
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '我、我会调酒也会擦杯子！听说这里的客人给小费很大方……',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '呵，看在你为了养家这么拼的份上，吧台后面缺个机灵的助手。或者……给我来杯传说中的“兔爸爸香甜牛奶”，价钱随便你开。',
        },
      ],
      options: [
        { text: '站上吧台挑战记忆调酒 (打工小游戏)', action: 'WORK', risk: 0.2 },
        { text: '亲自调制一杯香甜奶盖特饮 (消耗25%能量)', action: 'TRADE_MILK', risk: 0.32 },
        { text: '鼓起勇气夸狼大哥的皮衣超帅气 (好感+15)', action: 'FLIRT', risk: 0.42 },
        { text: '气氛有点紧张，先撤一步', action: 'LEAVE', risk: 0.05 },
      ],
    },
    {
      id: 'wolf_t1',
      title: '夜色爵士吧 · 外冷内热的护短',
      lines: [
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: `${outfitLine || ''}（刚走进酒吧，几个喧闹的客人被狼大哥一个眼神吓得乖乖坐回座位。他随手递给你一条干净毛巾）站我身后点，别被酒气熏着。`,
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '狼大哥其实超级温柔呢，刚才谢谢你帮我解围！',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '（别过脸摸了摸后颈）少废话，我只是嫌他们太吵。赶紧干活，今晚的订单都算你的提成。',
        },
      ],
      options: [
        { text: '专心按订单顺序调酒 (打工小游戏)', action: 'WORK', risk: 0.16 },
        { text: '悄悄在吧台给狼大哥递上一瓶暖牛奶', action: 'TRADE_MILK', risk: 0.28 },
        { text: '笑着说“狼大哥耳朵红了哦？” (好感+15)', action: 'FLIRT', risk: 0.36 },
        { text: '收拾托盘先离开酒吧', action: 'LEAVE', risk: 0 },
      ],
    },
    {
      id: 'wolf_t2',
      title: '夜色爵士吧 · 野兽的独占欲',
      lines: [
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: `${outfitLine || ''}（狼大哥一把拉过你的手腕按在吧台阴影处，呼吸沉沉落下来）${hasOtherPartner ? '身上有别的家伙的味道……算了，只要你今晚站在我眼前，我就睁一只眼闭一只眼。' : '小兔子，每次你在舞台灯光下冲客人笑，我都恨不得把你直接扛回家藏起来。'}`,
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '狼大哥的心跳好快……我、我只是想多赚点学费嘛！',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '钱我有的是。今晚乖乖听话，不管你要多少都满足你。',
        },
      ],
      options: [
        { text: '稳住心神去吧台调酒 (高好感高提成)', action: 'WORK', risk: 0.18 },
        { text: '把香甜牛奶推到他唇边换取丰厚报酬', action: 'TRADE_MILK', risk: 0.3 },
        { text: '用软软的手心贴住狼大哥的脸颊 (好感+15)', action: 'FLIRT', risk: 0.4 },
        { text: '慌张找个借口溜出门外', action: 'LEAVE', risk: 0.05 },
      ],
    },
    {
      id: 'wolf_t3',
      title: '夜色爵士吧 · 银狼的掌中宝',
      lines: [
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: `${outfitLine || ''}（狼大哥脱下皮衣外套披在你肩上，整座酒吧的灯光都柔和下来）外面风大，戴好我的银徽章再出去。需要我陪你一起去接兔宝宝放学吗？`,
        },
        {
          speakerId: 'rabbit_dad',
          speakerName: '兔爸爸',
          text: '好呀！兔宝宝昨天还说银狼叔叔酷得像动漫主角呢！',
        },
        {
          speakerId: 'wolf_boss',
          speakerName: '狼大哥',
          text: '（嘴角扬起难得的弧度）哼，那小子挺有眼光。先忙完这一阵，今晚我请你俩吃大餐。',
        },
      ],
      options: [
        { text: '默契配合狼大哥完成夜间调酒 (打工小游戏)', action: 'WORK', risk: 0 },
        { text: '给最爱喝牛奶的狼大哥特调一杯 (高额回报)', action: 'TRADE_MILK', risk: 0 },
        { text: '靠进皮衣怀里摸摸狼耳朵 (甜蜜零风险)', action: 'FLIRT', risk: 0 },
        { text: '约好晚饭时间后出门转转', action: 'LEAVE', risk: 0 },
      ],
    },
  ];
  return scenes[(tier + variantOffset) % scenes.length];
};
