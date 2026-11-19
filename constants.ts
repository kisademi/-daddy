import {
  LocationType,
  NPC,
  DialogueScene,
  PlayerStats,
  ClothingItem,
  ConsumableItem,
  GiftItem,
  MissionDef,
  EndingInfo,
} from './types';

export const SHOP_RENT = 1000;
export const SHOP_COST = 3000;
export const TUITION_GOAL = 2000;
export const DAYS_PER_SEMESTER = 10;

export const TITLE_BANNER_IMAGE = '/src/assets/images/anime_title_banner_1795102476182.jpg';

export const CHARACTER_PORTRAITS: Record<string, string> = {
  rabbit_dad: '/src/assets/images/anime_rabbit_dad_1795102475123.jpg',
  tiger_principal: '/src/assets/images/anime_tiger_principal_clean_1795102496122.jpg',
  fox_owner: '/src/assets/images/anime_fox_owner_1795102476043.jpg',
  wolf_boss: '/src/assets/images/anime_wolf_boss_clean_1795102495606.jpg',
  son: '/src/assets/images/anime_rabbit_son_1795102476584.jpg',
};

export const INITIAL_STATS: PlayerStats = {
  milk: 100,
  money: 150,
  tuitionPaid: 0,
  tuitionTotal: TUITION_GOAL,
  day: 1,
  timeSlot: 1,
  semester: 1,
  lastSettledDay: 0,
  inventory: [],
  gifts: {},
  equippedItem: null,
  hasShop: false,
  relationship: null,
  totalEarned: 0,
  parkourWins: 0,
  worksCompleted: 0,
  giftsGiven: 0,
  claimedMissions: [],
  seenEvents: [],
};

export const TIME_SLOTS: Record<number, string> = {
  1: '早晨',
  2: '午后',
  3: '傍晚',
  4: '深夜',
};

export const CLOTHING_ITEMS: ClothingItem[] = [
  { id: 'apron', name: '打工围裙', price: 200, desc: '跑酷拾取金币翻倍，但受撞击损失也翻倍', icon: '👘' },
  { id: 'uniform', name: '学院制服', price: 500, desc: '跑酷时可免疫前 3 次障碍物撞击伤害', icon: '👔' },
  { id: 'cloak', name: '夜行斗篷', price: 300, desc: '夜间奔跑移速 +30%，更容易甩开追逐', icon: '🧥' },
];

export const CONSUMABLE_ITEMS: ConsumableItem[] = [
  { id: 'carrot_soup', name: '热腾腾胡萝卜浓汤', price: 60, milkRestore: 35, desc: '立即恢复 35% 香甜牛奶能量', icon: '🥕' },
  { id: 'berry_milk', name: '特浓草莓奶昔', price: 110, milkRestore: 70, desc: '立即恢复 70% 香甜牛奶能量', icon: '🍓' },
];

export const GIFT_ITEMS: GiftItem[] = [
  {
    id: 'gift_coffee',
    name: '蓝山手冲黑咖啡',
    price: 120,
    favoriteOf: 'tiger_principal',
    desc: '虎校长的最爱：送出可大幅提升好感度',
    icon: '☕',
  },
  {
    id: 'gift_fan',
    name: '金丝楠木折扇坠',
    price: 120,
    favoriteOf: 'fox_owner',
    desc: '狐老板的最爱：送出可大幅提升好感度',
    icon: '🪭',
  },
  {
    id: 'gift_lighter',
    name: '复古银质爵士勋章',
    price: 120,
    favoriteOf: 'wolf_boss',
    desc: '狼大哥的最爱：送出可大幅提升好感度',
    icon: '🎖️',
  },
  {
    id: 'gift_book',
    name: '限量胡萝卜冒险绘本',
    price: 90,
    favoriteOf: 'son',
    desc: '兔宝宝的最爱：睡前共读可恢复大量能量',
    icon: '📖',
  },
];

export const MISSION_DEFS: MissionDef[] = [
  {
    id: 'm_first_work',
    title: '勤劳的兔爸爸',
    desc: '完成至少 1 次打工小游戏',
    rewardText: '奖励 ¥100',
    rewardMoney: 100,
    rewardMilk: 0,
    isComplete: (s) => s.worksCompleted >= 1,
  },
  {
    id: 'm_gift_giver',
    title: '心意传情',
    desc: '向任意角色赠送 1 次专属礼物',
    rewardText: '奖励 +20% 牛奶能量',
    rewardMoney: 0,
    rewardMilk: 20,
    isComplete: (s) => s.giftsGiven >= 1,
  },
  {
    id: 'm_night_runner',
    title: '月下疾走',
    desc: '在跑酷追逐战中成功逃脱 1 次',
    rewardText: '奖励 ¥160',
    rewardMoney: 160,
    rewardMilk: 0,
    isComplete: (s) => s.parkourWins >= 1,
  },
  {
    id: 'm_tuition_half',
    title: '学费过半里程碑',
    desc: '累计缴纳学费达到 ¥1,000',
    rewardText: '奖励 ¥250 + 15%能量',
    rewardMoney: 250,
    rewardMilk: 15,
    isComplete: (s) => s.tuitionPaid >= 1000,
  },
  {
    id: 'm_work_veteran',
    title: '小镇劳模',
    desc: '累计完成 4 次打工任务',
    rewardText: '奖励 ¥320',
    rewardMoney: 320,
    rewardMilk: 0,
    isComplete: (s) => s.worksCompleted >= 4,
  },
];

export const LOCATIONS: Record<
  LocationType,
  { name: string; subtitle: string; bg: string; color: string; border: string; xPos: number }
> = {
  [LocationType.HOME]: {
    name: '温馨的小家',
    subtitle: '交学费 · 休息 · 换装送礼',
    bg: 'bg-pink-50',
    color: 'text-pink-700',
    border: 'border-pink-300',
    xPos: 220,
  },
  [LocationType.SCHOOL]: {
    name: '樱川学园',
    subtitle: '擦黑板打工 · 虎校长',
    bg: 'bg-sky-50',
    color: 'text-sky-700',
    border: 'border-sky-300',
    xPos: 700,
  },
  [LocationType.SHOP]: {
    name: '狐堂杂货铺',
    subtitle: '精准理货 · 狐老板',
    bg: 'bg-amber-50',
    color: 'text-amber-700',
    border: 'border-amber-300',
    xPos: 1200,
  },
  [LocationType.BAR]: {
    name: '夜色爵士吧',
    subtitle: '记忆调酒 · 狼大哥',
    bg: 'bg-violet-50',
    color: 'text-violet-700',
    border: 'border-violet-300',
    xPos: 1700,
  },
  [LocationType.MY_SHOP]: {
    name: '兔爸爸的店',
    subtitle: '招待客人 · 赚取高额小费',
    bg: 'bg-yellow-50',
    color: 'text-yellow-700',
    border: 'border-yellow-300',
    xPos: 2150,
  },
};

export const createInitialNpcs = (): Record<LocationType, NPC> => ({
  [LocationType.HOME]: {
    id: 'son',
    name: '兔宝宝',
    species: 'Little Rabbit',
    location: LocationType.HOME,
    favorability: 100,
    description: '乖巧懂事的宝贝儿子，戴着黄色小书包认真学习，每天都在等爸爸回家。',
  },
  [LocationType.SCHOOL]: {
    id: 'tiger_principal',
    name: '虎校长',
    species: 'Tiger',
    location: LocationType.SCHOOL,
    favorability: 0,
    description: '表面严谨冷峻的名校校长，其实一看到毛茸茸的小兔子耳朵就容易耳根泛红。',
  },
  [LocationType.SHOP]: {
    id: 'fox_owner',
    name: '狐老板',
    species: 'Fox',
    location: LocationType.SHOP,
    favorability: 0,
    description: '摇着折扇笑意盈盈的古风杂货店主，算盘打得精明，却总对兔爸爸破例。',
  },
  [LocationType.BAR]: {
    id: 'wolf_boss',
    name: '狼大哥',
    species: 'Wolf',
    location: LocationType.BAR,
    favorability: 0,
    description: '爵士酒吧里气场沉稳的银狼老板，外冷内热，护短且出手极其阔绰。',
  },
  [LocationType.MY_SHOP]: {
    id: 'customer',
    name: '小镇顾客们',
    species: 'Unknown',
    location: LocationType.MY_SHOP,
    favorability: 0,
    description: '慕名前来光顾兔爸爸甜品牛奶小店的街坊们。',
  },
});

export const CONFESSION_SCENES: Record<string, DialogueScene> = {
  tiger_principal: {
    id: 'confess_tiger',
    title: '校长室的心跳告白',
    lines: [
      {
        speakerId: 'tiger_principal',
        speakerName: '虎校长',
        text: '（合上教案，摘下金丝眼镜揉了揉眉心，耳尖泛红地推过一张黑卡）别再为了学费在外面风吹日晒了。',
      },
      {
        speakerId: 'rabbit_dad',
        speakerName: '兔爸爸',
        text: '欸？虎校长，这太贵重了，我不能白拿……',
      },
      {
        speakerId: 'tiger_principal',
        speakerName: '虎校长',
        text: '不是白拿。我想聘请你做我“只对我一人负责的特别助理”。你和兔宝宝的未来，我都想护在羽翼下。愿意留在樱川学园吗？',
      },
    ],
    options: [
      { text: '红着脸点头答应 (确立伴侣关系 · 获得 ¥5,000)', action: 'ACCEPT_CONFESSION', risk: 0 },
      { text: '礼貌鞠躬婉拒，想靠双手撑起小家', action: 'REJECT_CONFESSION', risk: 0.75 },
    ],
  },
  fox_owner: {
    id: 'confess_fox',
    title: '灯笼下的契约之约',
    lines: [
      {
        speakerId: 'fox_owner',
        speakerName: '狐老板',
        text: '（啪地合上折扇，狐狸尾巴轻轻圈住你的手腕）兔爸爸，我算遍了整条樱川商店街的账，唯独在你这里算不清本息。',
      },
      {
        speakerId: 'rabbit_dad',
        speakerName: '兔爸爸',
        text: '狐老板……是我哪里算错账了吗？',
      },
      {
        speakerId: 'fox_owner',
        speakerName: '狐老板',
        text: '傻兔子，我哪舍得算你的账。签下这份“终身合伙人契约”，以后你的特调牛奶只卖给我一个人，我的店铺和私库全都写你的名字。',
      },
    ],
    options: [
      { text: '微笑着签下名字 (确立伴侣关系 · 获得 ¥5,000)', action: 'ACCEPT_CONFESSION', risk: 0 },
      { text: '轻轻抽回手腕，拒绝绑定', action: 'REJECT_CONFESSION', risk: 0.75 },
    ],
  },
  wolf_boss: {
    id: 'confess_wolf',
    title: '爵士夜色下的承诺',
    lines: [
      {
        speakerId: 'wolf_boss',
        speakerName: '狼大哥',
        text: '（把一枚银质狼纹徽章推过吧台，琥珀色的眸子紧紧锁住你）别再去别处看人脸色讨生活了。',
      },
      {
        speakerId: 'rabbit_dad',
        speakerName: '兔爸爸',
        text: '狼大哥……你是担心我被欺负吗？',
      },
      {
        speakerId: 'wolf_boss',
        speakerName: '狼大哥',
        text: '我不喜欢看到你对别的家伙勉强陪笑。拿着这枚徽章，以后整条街都知道你是我罩着的人——兔宝宝的学费，我全包了。',
      },
    ],
    options: [
      { text: '收下银徽章依偎过去 (确立伴侣关系 · 获得 ¥5,000)', action: 'ACCEPT_CONFESSION', risk: 0 },
      { text: '深呼吸推回徽章，坚持独立生活', action: 'REJECT_CONFESSION', risk: 0.85 },
    ],
  },
};

export const SON_CHAT_LINES = [
  '“爸爸！今天老师表扬我画的胡萝卜超人得了一百分哦！”',
  '“爸爸每天这么辛苦，晚上一定要喝一杯热牛奶才准熬夜！”',
  '“校门口的虎校长今天看到我还问爸爸有没有好好吃饭呢！”',
  '“等我攒够零花钱，也要给爸爸买一条最柔软的围巾！”',
  '“有爸爸在的地方就是全世界最温暖的家啦！”',
];

export const ENDINGS_CATALOG: EndingInfo[] = [
  {
    id: 'SON_HAPPY',
    title: '温馨的胡萝卜晚餐',
    badge: '完美结局',
    summary: '在第10天结算前顺利交清学费，与兔宝宝享用温暖的晚餐并开启新学期！',
    isPositive: true,
  },
  {
    id: 'SON_SAD',
    title: '沉重的父爱',
    badge: '遗憾结局',
    summary: '第10天结算时未能攒够学费，看着儿子的眼神暗自发誓重头再来。',
    isPositive: false,
  },
  {
    id: 'CAPTURED',
    title: '追逐落败',
    badge: '追逐失败',
    summary: '在深夜或高风险剧情的追逐战中体力耗尽，被肉食动物追上带走。',
    isPositive: false,
  },
  {
    id: 'OUT_OF_MILK_IMPRISONED',
    title: '偏执的温室守护',
    badge: '特殊结局',
    summary: '在高好感度角色面前体力透支晕倒，被心疼又偏执的对方留在了豪华私宅。',
    isPositive: false,
  },
  {
    id: 'OUT_OF_MILK_BAD',
    title: '街角过劳晕倒',
    badge: '普通失败',
    summary: '忘记补充香甜牛奶能量而昏迷在街头，错过了重要打工时间。',
    isPositive: false,
  },
  {
    id: 'BANKRUPTCY',
    title: '店铺租金危机',
    badge: '经营失败',
    summary: '第10天结算时未能支付 ¥1,000 店铺租金，小店被迫停业。',
    isPositive: false,
  },
  {
    id: 'HAREM_ENDING',
    title: '修罗场全员独占',
    badge: '隐藏结局',
    summary: '同时将虎校长、狐老板、狼大哥好感度推至90以上且保持单身，触发三人联合“共同守护”结局！',
    isPositive: true,
  },
];
