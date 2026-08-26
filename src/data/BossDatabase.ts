export type BossMoveType = 
  | 'slam' 
  | 'laser' 
  | 'bullet_hell' 
  | 'rush' 
  | 'spawn_minions' 
  | 'smoke_teleport' 
  | 'whirlwind'
  | 'mortar_strike'
  | 'rolling_barrel'
  | 'bouncing_chips'
  | 'scythe_boomerang'
  | 'sound_wave'
  | 'grapple_pull'
  | 'trap_field'
  | 'drone_swarm'
  | 'ice_avalanche'
  | 'acid_miasma'
  | 'crystal_chandelier'
  | 'apocalypse_combo';

export interface BossMove {
  name: string;
  type: BossMoveType;
  windupTime: number;
  damage: number;
  cooldown: number;
}

export interface BossInfo {
  id: number;
  name: string;
  title: string;
  quote: string;
  weaponRewardId: number;
  color: string;
  tierMoves: {
    1: BossMove[];
    2: BossMove[];
    3: BossMove[];
    4: BossMove[];
  };
}

export const BOSS_DATABASE: { [id: number]: BossInfo } = {
  1: {
    id: 1,
    name: '皮耶',
    title: '私酒坊 碎骨者',
    quote: '「這裡的每根骨頭，都歸我管。」',
    weaponRewardId: 2,
    color: '#a37c48',
    tierMoves: {
      1: [
        { name: '巨鎚橫掃', type: 'slam', windupTime: 0.9, damage: 25, cooldown: 3.5 },
        { name: '直線地裂', type: 'rush', windupTime: 0.9, damage: 20, cooldown: 4.0 }
      ],
      2: [
        { name: '巨鎚橫掃', type: 'slam', windupTime: 0.5, damage: 30, cooldown: 3.0 },
        { name: '直線地裂', type: 'rush', windupTime: 0.5, damage: 25, cooldown: 3.5 },
        { name: '泰坦崩山砸', type: 'slam', windupTime: 0.6, damage: 45, cooldown: 5.0 }
      ],
      3: [
        { name: '巨鎚橫掃', type: 'slam', windupTime: 0.35, damage: 35, cooldown: 2.5 },
        { name: '直線地裂', type: 'rush', windupTime: 0.35, damage: 30, cooldown: 3.0 },
        { name: '泰坦崩山砸', type: 'slam', windupTime: 0.45, damage: 55, cooldown: 4.5 },
        { name: '旋風巨鎚追擊', type: 'whirlwind', windupTime: 0.5, damage: 40, cooldown: 6.0 }
      ],
      4: [
        { name: '巨鎚橫掃', type: 'slam', windupTime: 0.25, damage: 45, cooldown: 2.0 },
        { name: '直線地裂', type: 'rush', windupTime: 0.25, damage: 40, cooldown: 2.5 },
        { name: '泰坦崩山砸', type: 'slam', windupTime: 0.35, damage: 70, cooldown: 3.5 },
        { name: '旋風巨鎚追擊', type: 'whirlwind', windupTime: 0.4, damage: 50, cooldown: 5.0 },
        { name: '黃金重裝震地狂瀾', type: 'bullet_hell', windupTime: 0.5, damage: 60, cooldown: 7.0 }
      ]
    }
  },
  2: {
    id: 2,
    name: '莫里斯',
    title: '軍火黑市 毒蛇',
    quote: '「子彈不長眼，但我從不失手。」',
    weaponRewardId: 3,
    color: '#707070',
    tierMoves: {
      1: [
        { name: '雙動點射', type: 'laser', windupTime: 0.85, damage: 18, cooldown: 3.0 },
        { name: '手榴彈拋投', type: 'slam', windupTime: 0.9, damage: 22, cooldown: 4.0 }
      ],
      2: [
        { name: '左輪三連點射', type: 'laser', windupTime: 0.5, damage: 25, cooldown: 2.5 },
        { name: '手榴彈拋投', type: 'slam', windupTime: 0.5, damage: 30, cooldown: 3.5 },
        { name: '煙霧瞬移', type: 'smoke_teleport', windupTime: 0.3, damage: 0, cooldown: 5.0 }
      ],
      3: [
        { name: '左輪三連點射', type: 'laser', windupTime: 0.35, damage: 32, cooldown: 2.0 },
        { name: '扇形火網壓制', type: 'bullet_hell', windupTime: 0.45, damage: 38, cooldown: 4.0 },
        { name: '煙霧瞬移', type: 'smoke_teleport', windupTime: 0.25, damage: 0, cooldown: 4.0 },
        { name: '穿甲狙擊死光', type: 'laser', windupTime: 0.5, damage: 55, cooldown: 5.5 }
      ],
      4: [
        { name: '左輪三連點射', type: 'laser', windupTime: 0.25, damage: 40, cooldown: 1.8 },
        { name: '扇形火網壓制', type: 'bullet_hell', windupTime: 0.35, damage: 50, cooldown: 3.5 },
        { name: '煙霧瞬移', type: 'smoke_teleport', windupTime: 0.2, damage: 0, cooldown: 3.0 },
        { name: '穿甲狙擊死光', type: 'laser', windupTime: 0.4, damage: 75, cooldown: 4.5 },
        { name: '天降燃燒迫擊砲風暴', type: 'bullet_hell', windupTime: 0.5, damage: 65, cooldown: 6.5 }
      ]
    }
  },
  3: {
    id: 3,
    name: '亨利',
    title: '走私碼頭 大白鯊',
    quote: '「塞納河底，永遠不缺多一具沉屍。」',
    weaponRewardId: 4,
    color: '#1e3f66',
    tierMoves: {
      1: [
        { name: '重錨劈砸', type: 'slam', windupTime: 0.9, damage: 28, cooldown: 3.5 },
        { name: '雙管霰彈噴射', type: 'bullet_hell', windupTime: 0.85, damage: 24, cooldown: 4.0 }
      ],
      2: [
        { name: '重錨劈砸', type: 'slam', windupTime: 0.5, damage: 35, cooldown: 3.0 },
        { name: '雙管霰彈噴射', type: 'bullet_hell', windupTime: 0.5, damage: 30, cooldown: 3.5 },
        { name: '滾動炸藥酒桶', type: 'rush', windupTime: 0.55, damage: 40, cooldown: 4.5 }
      ],
      3: [
        { name: '重錨劈砸', type: 'slam', windupTime: 0.35, damage: 42, cooldown: 2.2 },
        { name: '雙管霰彈噴射', type: 'bullet_hell', windupTime: 0.35, damage: 38, cooldown: 2.8 },
        { name: '滾動炸藥酒桶', type: 'rush', windupTime: 0.4, damage: 50, cooldown: 4.0 },
        { name: '巨浪衝擊波', type: 'rush', windupTime: 0.45, damage: 55, cooldown: 5.0 }
      ],
      4: [
        { name: '重錨劈砸', type: 'slam', windupTime: 0.25, damage: 55, cooldown: 1.8 },
        { name: '雙管霰彈噴射', type: 'bullet_hell', windupTime: 0.25, damage: 50, cooldown: 2.2 },
        { name: '滾動炸藥酒桶', type: 'rush', windupTime: 0.3, damage: 65, cooldown: 3.0 },
        { name: '巨浪衝擊波', type: 'rush', windupTime: 0.35, damage: 70, cooldown: 4.0 },
        { name: '深海狂暴暴風雨', type: 'bullet_hell', windupTime: 0.45, damage: 80, cooldown: 6.0 }
      ]
    }
  },
  4: {
    id: 4,
    name: '薇洛妮克',
    title: '歌劇院刺客 黑寡婦',
    quote: '「最甜美的謝幕，往往伴隨著劇毒。」',
    weaponRewardId: 5,
    color: '#8e44ad',
    tierMoves: {
      1: [
        { name: '黑曜瞬步刺', type: 'rush', windupTime: 0.85, damage: 22, cooldown: 3.0 },
        { name: '投擲雙飛刀', type: 'bullet_hell', windupTime: 0.8, damage: 18, cooldown: 3.5 }
      ],
      2: [
        { name: '黑曜瞬步刺', type: 'rush', windupTime: 0.45, damage: 28, cooldown: 2.5 },
        { name: '投擲雙飛刀', type: 'bullet_hell', windupTime: 0.4, damage: 24, cooldown: 3.0 },
        { name: '劇毒煙霧瞬移', type: 'smoke_teleport', windupTime: 0.25, damage: 15, cooldown: 4.5 }
      ],
      3: [
        { name: '黑曜瞬步刺', type: 'rush', windupTime: 0.3, damage: 36, cooldown: 2.0 },
        { name: '扇形六連毒刃', type: 'bullet_hell', windupTime: 0.35, damage: 32, cooldown: 2.5 },
        { name: '劇毒煙霧瞬移', type: 'smoke_teleport', windupTime: 0.2, damage: 20, cooldown: 3.5 },
        { name: '紅外雷射防線', type: 'laser', windupTime: 0.4, damage: 45, cooldown: 5.0 }
      ],
      4: [
        { name: '黑曜瞬步刺', type: 'rush', windupTime: 0.2, damage: 48, cooldown: 1.5 },
        { name: '扇形六連毒刃', type: 'bullet_hell', windupTime: 0.25, damage: 42, cooldown: 2.0 },
        { name: '劇毒煙霧瞬移', type: 'smoke_teleport', windupTime: 0.15, damage: 30, cooldown: 2.8 },
        { name: '紅外雷射防線', type: 'laser', windupTime: 0.3, damage: 60, cooldown: 4.0 },
        { name: '千刃凌遲終極暗影處刑', type: 'bullet_hell', windupTime: 0.4, damage: 75, cooldown: 5.5 }
      ]
    }
  },
  5: {
    id: 5,
    name: '盧西安',
    title: '毒氣實驗師 瘋狂鍊金',
    quote: '「聞到了嗎？那是恐懼被蒸餾的香氣。」',
    weaponRewardId: 6,
    color: '#e25822',
    tierMoves: {
      1: [
        { name: '化學火舌噴射', type: 'slam', windupTime: 0.9, damage: 20, cooldown: 3.5 },
        { name: '毒瓦斯投擲', type: 'bullet_hell', windupTime: 0.85, damage: 18, cooldown: 4.0 }
      ],
      2: [
        { name: '化學火舌噴射', type: 'slam', windupTime: 0.5, damage: 26, cooldown: 2.8 },
        { name: '毒瓦斯投擲', type: 'bullet_hell', windupTime: 0.5, damage: 24, cooldown: 3.2 },
        { name: '地面焦土燃燒', type: 'slam', windupTime: 0.55, damage: 35, cooldown: 4.5 }
      ],
      3: [
        { name: '化學火舌噴射', type: 'slam', windupTime: 0.35, damage: 35, cooldown: 2.2 },
        { name: '毒瓦斯投擲', type: 'bullet_hell', windupTime: 0.35, damage: 30, cooldown: 2.5 },
        { name: '地面焦土燃燒', type: 'slam', windupTime: 0.4, damage: 45, cooldown: 3.8 },
        { name: '高壓爆震火浪', type: 'bullet_hell', windupTime: 0.45, damage: 55, cooldown: 5.0 }
      ],
      4: [
        { name: '化學火舌噴射', type: 'slam', windupTime: 0.25, damage: 48, cooldown: 1.8 },
        { name: '毒瓦斯投擲', type: 'bullet_hell', windupTime: 0.25, damage: 40, cooldown: 2.0 },
        { name: '地面焦土燃燒', type: 'slam', windupTime: 0.3, damage: 60, cooldown: 3.0 },
        { name: '高壓爆震火浪', type: 'bullet_hell', windupTime: 0.35, damage: 70, cooldown: 4.0 },
        { name: '末日毒火大爆發', type: 'bullet_hell', windupTime: 0.45, damage: 85, cooldown: 5.5 }
      ]
    }
  },
  6: {
    id: 6,
    name: '加斯頓',
    title: '腐敗憲兵 鐵腕加斯頓',
    quote: '「在巴黎，法律就是我手裡的警棍。」',
    weaponRewardId: 7,
    color: '#556b2f',
    tierMoves: {
      1: [
        { name: '卡賓連射', type: 'laser', windupTime: 0.85, damage: 20, cooldown: 3.0 },
        { name: '鐵腕重拳', type: 'slam', windupTime: 0.9, damage: 25, cooldown: 4.0 }
      ],
      2: [
        { name: '卡賓連射', type: 'laser', windupTime: 0.5, damage: 28, cooldown: 2.5 },
        { name: '鋼纜抓鉤猛拉', type: 'rush', windupTime: 0.45, damage: 32, cooldown: 3.5 },
        { name: '呼叫憲兵增援', type: 'spawn_minions', windupTime: 0.5, damage: 0, cooldown: 5.0 }
      ],
      3: [
        { name: '卡賓連射', type: 'laser', windupTime: 0.35, damage: 35, cooldown: 2.0 },
        { name: '鋼纜抓鉤猛拉', type: 'rush', windupTime: 0.35, damage: 45, cooldown: 3.0 },
        { name: '催淚瓦斯彈幕', type: 'bullet_hell', windupTime: 0.4, damage: 40, cooldown: 4.0 }
      ],
      4: [
        { name: '卡賓連射', type: 'laser', windupTime: 0.25, damage: 48, cooldown: 1.5 },
        { name: '鋼纜抓鉤猛拉', type: 'rush', windupTime: 0.25, damage: 60, cooldown: 2.5 },
        { name: '全城戒嚴防暴風暴', type: 'bullet_hell', windupTime: 0.35, damage: 70, cooldown: 4.5 }
      ]
    }
  },
  7: {
    id: 7,
    name: '幸運骰',
    title: '暗夜秘密賭場 荷官教頭',
    quote: '「押上你的命吧，紳士。莊家通吃。」',
    weaponRewardId: 8,
    color: '#ffd700',
    tierMoves: {
      1: [
        { name: '短衝鋒速射', type: 'bullet_hell', windupTime: 0.8, damage: 18, cooldown: 3.0 },
        { name: '金幣手雷', type: 'slam', windupTime: 0.85, damage: 24, cooldown: 3.8 }
      ],
      2: [
        { name: '短衝鋒速射', type: 'bullet_hell', windupTime: 0.45, damage: 25, cooldown: 2.5 },
        { name: '輪盤狂賭金幣雨', type: 'bullet_hell', windupTime: 0.5, damage: 35, cooldown: 3.5 }
      ],
      3: [
        { name: '短衝鋒速射', type: 'bullet_hell', windupTime: 0.3, damage: 35, cooldown: 2.0 },
        { name: '輪盤狂賭金幣雨', type: 'bullet_hell', windupTime: 0.35, damage: 48, cooldown: 3.0 },
        { name: '金手套無敵衝鋒', type: 'rush', windupTime: 0.4, damage: 55, cooldown: 4.5 }
      ],
      4: [
        { name: '雙持衝鋒風暴', type: 'bullet_hell', windupTime: 0.2, damage: 50, cooldown: 1.5 },
        { name: '賭徒全押大爆炸', type: 'bullet_hell', windupTime: 0.3, damage: 75, cooldown: 3.5 }
      ]
    }
  },
  8: {
    id: 8,
    name: '鐵甲列車長',
    title: '地下鐵巨漢 鐵甲列車長',
    quote: '「下一站，地獄末班車！」',
    weaponRewardId: 9,
    color: '#4682b4',
    tierMoves: {
      1: [
        { name: '鋼盾猛擊', type: 'slam', windupTime: 0.9, damage: 28, cooldown: 3.5 },
        { name: '警棍重擊', type: 'slam', windupTime: 0.85, damage: 22, cooldown: 3.0 }
      ],
      2: [
        { name: '鋼盾猛擊', type: 'slam', windupTime: 0.5, damage: 35, cooldown: 3.0 },
        { name: '高壓電磁衝擊', type: 'whirlwind', windupTime: 0.5, damage: 32, cooldown: 4.0 }
      ],
      3: [
        { name: '鋼盾猛擊', type: 'slam', windupTime: 0.35, damage: 45, cooldown: 2.2 },
        { name: '列車鐵甲衝撞', type: 'rush', windupTime: 0.4, damage: 55, cooldown: 3.5 }
      ],
      4: [
        { name: '無堅不摧重盾狂衝', type: 'rush', windupTime: 0.25, damage: 70, cooldown: 2.5 },
        { name: '超載 EMP 大地暴鳴', type: 'bullet_hell', windupTime: 0.35, damage: 65, cooldown: 4.0 }
      ]
    }
  },
  9: {
    id: 9,
    name: '馴獸狂',
    title: '獵犬大亨 馴獸狂',
    quote: '「我的獵犬們，已經嗅到了血腥味。」',
    weaponRewardId: 10,
    color: '#8b4513',
    tierMoves: {
      1: [
        { name: '十字重弩射擊', type: 'laser', windupTime: 0.9, damage: 30, cooldown: 3.5 },
        { name: '放犬撲咬', type: 'rush', windupTime: 0.85, damage: 20, cooldown: 4.0 }
      ],
      2: [
        { name: '十字重弩射擊', type: 'laser', windupTime: 0.5, damage: 40, cooldown: 2.8 },
        { name: '捕獸夾拋投', type: 'slam', windupTime: 0.5, damage: 25, cooldown: 3.5 }
      ],
      3: [
        { name: '穿甲連環弩', type: 'laser', windupTime: 0.35, damage: 55, cooldown: 2.2 },
        { name: '群犬撕咬狂潮', type: 'spawn_minions', windupTime: 0.4, damage: 0, cooldown: 4.5 }
      ],
      4: [
        { name: '狂暴獵殺重矢', type: 'laser', windupTime: 0.25, damage: 80, cooldown: 1.8 },
        { name: '絕命陷阱風暴', type: 'bullet_hell', windupTime: 0.3, damage: 60, cooldown: 3.5 }
      ]
    }
  },
  10: {
    id: 10,
    name: '狂暴野獸',
    title: '地下黑拳王 狂暴野獸',
    quote: '「用拳頭說話，弱者只配躺在血泊裡。」',
    weaponRewardId: 11,
    color: '#b22222',
    tierMoves: {
      1: [
        { name: '鋼指重拳', type: 'slam', windupTime: 0.8, damage: 25, cooldown: 3.0 },
        { name: '前衝刺拳', type: 'rush', windupTime: 0.85, damage: 22, cooldown: 3.5 }
      ],
      2: [
        { name: '升龍上勾拳', type: 'slam', windupTime: 0.45, damage: 38, cooldown: 2.5 },
        { name: '連環刺拳衝擊', type: 'rush', windupTime: 0.5, damage: 32, cooldown: 3.0 }
      ],
      3: [
        { name: '霸體狂暴亂舞', type: 'whirlwind', windupTime: 0.35, damage: 50, cooldown: 2.5 },
        { name: '破空音速拳', type: 'laser', windupTime: 0.35, damage: 45, cooldown: 2.8 }
      ],
      4: [
        { name: '終極泰坦崩天烈拳', type: 'slam', windupTime: 0.25, damage: 85, cooldown: 2.0 },
        { name: '百裂拳煞光浪', type: 'bullet_hell', windupTime: 0.3, damage: 65, cooldown: 3.5 }
      ]
    }
  },
  11: {
    id: 11,
    name: '引線吉爾',
    title: '爆破狂徒 引線吉爾',
    quote: '「聽這引線燃燒的聲音... 多麼美妙的交響曲！」',
    weaponRewardId: 12,
    color: '#ff4500',
    tierMoves: {
      1: [
        { name: '燃燒瓶投擲', type: 'slam', windupTime: 0.85, damage: 25, cooldown: 3.5 },
        { name: '炸藥桶滾動', type: 'rush', windupTime: 0.9, damage: 30, cooldown: 4.0 }
      ],
      2: [
        { name: '定點黏性炸彈', type: 'slam', windupTime: 0.5, damage: 40, cooldown: 3.0 },
        { name: '燃燒火浪爆裂', type: 'bullet_hell', windupTime: 0.5, damage: 35, cooldown: 3.5 }
      ],
      3: [
        { name: '連鎖地雷引爆', type: 'bullet_hell', windupTime: 0.35, damage: 55, cooldown: 2.5 },
        { name: '自爆狂奔', type: 'rush', windupTime: 0.4, damage: 60, cooldown: 4.0 }
      ],
      4: [
        { name: '毀滅性大爆破殉燃', type: 'bullet_hell', windupTime: 0.25, damage: 90, cooldown: 2.5 }
      ]
    }
  },
  12: {
    id: 12,
    name: '盲眼',
    title: '孤鷹神槍手 盲眼',
    quote: '「我看不到你的臉，但我能聽見你的心跳。」',
    weaponRewardId: 13,
    color: '#2f4f4f',
    tierMoves: {
      1: [
        { name: '狙擊瞄準死光', type: 'laser', windupTime: 1.0, damage: 45, cooldown: 4.0 },
        { name: '煙幕隱匿後撤', type: 'smoke_teleport', windupTime: 0.5, damage: 0, cooldown: 5.0 }
      ],
      2: [
        { name: '狙擊瞄準死光', type: 'laser', windupTime: 0.6, damage: 60, cooldown: 3.0 },
        { name: '毒煙步槍連射', type: 'bullet_hell', windupTime: 0.5, damage: 35, cooldown: 3.5 }
      ],
      3: [
        { name: '瞬狙穿甲彈', type: 'laser', windupTime: 0.35, damage: 80, cooldown: 2.2 },
        { name: '交叉紅外狙擊網', type: 'bullet_hell', windupTime: 0.4, damage: 50, cooldown: 3.5 }
      ],
      4: [
        { name: '一擊必殺天眼貫穿', type: 'laser', windupTime: 0.25, damage: 110, cooldown: 1.8 }
      ]
    }
  },
  13: {
    id: 13,
    name: '曼陀羅',
    title: '夜總會花魁 曼陀羅',
    quote: '「在盛開與凋零之間，你選擇哪種死法？」',
    weaponRewardId: 14,
    color: '#2e8b57',
    tierMoves: {
      1: [
        { name: '荊棘鋼鞭長甩', type: 'slam', windupTime: 0.85, damage: 24, cooldown: 3.0 },
        { name: '毒刺花瓣', type: 'bullet_hell', windupTime: 0.8, damage: 20, cooldown: 3.5 }
      ],
      2: [
        { name: '荊棘風暴防禦圈', type: 'whirlwind', windupTime: 0.5, damage: 36, cooldown: 2.8 },
        { name: '魅惑毒霧', type: 'smoke_teleport', windupTime: 0.4, damage: 20, cooldown: 4.0 }
      ],
      3: [
        { name: '荊棘狂亂絞殺', type: 'rush', windupTime: 0.35, damage: 50, cooldown: 2.2 },
        { name: '萬毒朝宗花雨', type: 'bullet_hell', windupTime: 0.35, damage: 45, cooldown: 3.0 }
      ],
      4: [
        { name: '曼陀羅終極凋零風暴', type: 'bullet_hell', windupTime: 0.25, damage: 75, cooldown: 2.0 }
      ]
    }
  },
  14: {
    id: 14,
    name: '碎肉者',
    title: '黑市屠夫 碎肉者',
    quote: '「今晚的黑市，有最新鮮的上等肉。」',
    weaponRewardId: 15,
    color: '#800000',
    tierMoves: {
      1: [
        { name: '鋸齒砍刀劈落', type: 'slam', windupTime: 0.9, damage: 32, cooldown: 3.5 },
        { name: '狂暴衝撞', type: 'rush', windupTime: 0.85, damage: 25, cooldown: 4.0 }
      ],
      2: [
        { name: '嗜血咆哮戰吼', type: 'whirlwind', windupTime: 0.5, damage: 20, cooldown: 4.0 },
        { name: '飛擲屠夫鉤索', type: 'laser', windupTime: 0.5, damage: 40, cooldown: 3.0 }
      ],
      3: [
        { name: '連環屠夫狂砍', type: 'rush', windupTime: 0.35, damage: 55, cooldown: 2.5 },
        { name: '碎骨血雨噴濺', type: 'bullet_hell', windupTime: 0.35, damage: 48, cooldown: 3.0 }
      ],
      4: [
        { name: '屠宰場無盡血祭處刑', type: 'bullet_hell', windupTime: 0.25, damage: 85, cooldown: 2.0 }
      ]
    }
  },
  15: {
    id: 15,
    name: '齒輪',
    title: '鐘錶發明家 齒輪',
    quote: '「時間到了，精密的處刑齒輪即將咬合。」',
    weaponRewardId: 16,
    color: '#00ced1',
    tierMoves: {
      1: [
        { name: '放出自爆無人機', type: 'rush', windupTime: 0.85, damage: 24, cooldown: 3.5 },
        { name: '齒輪飛刃射擊', type: 'bullet_hell', windupTime: 0.8, damage: 18, cooldown: 3.0 }
      ],
      2: [
        { name: '發條機甲狂暴', type: 'whirlwind', windupTime: 0.5, damage: 35, cooldown: 3.0 },
        { name: '雙無人機夾擊', type: 'spawn_minions', windupTime: 0.5, damage: 0, cooldown: 4.5 }
      ],
      3: [
        { name: '無人機光束矩陣', type: 'laser', windupTime: 0.35, damage: 55, cooldown: 2.2 },
        { name: '發條大爆炸', type: 'bullet_hell', windupTime: 0.35, damage: 50, cooldown: 3.0 }
      ],
      4: [
        { name: '天頂超載無人機蜂群', type: 'bullet_hell', windupTime: 0.25, damage: 80, cooldown: 2.0 }
      ]
    }
  },
  16: {
    id: 16,
    name: '歌劇魅影',
    title: '墮落首席 歌劇魅影',
    quote: '「這最後的詠嘆調，為你的葬禮而唱。」',
    weaponRewardId: 17,
    color: '#9370db',
    tierMoves: {
      1: [
        { name: '音叉催眠共振', type: 'whirlwind', windupTime: 0.85, damage: 20, cooldown: 3.5 },
        { name: '高頻聲波刃', type: 'bullet_hell', windupTime: 0.8, damage: 22, cooldown: 3.0 }
      ],
      2: [
        { name: '魅影瞬步刺殺', type: 'smoke_teleport', windupTime: 0.45, damage: 30, cooldown: 3.0 },
        { name: '管風琴狂想曲彈幕', type: 'bullet_hell', windupTime: 0.5, damage: 38, cooldown: 3.5 }
      ],
      3: [
        { name: '奪魂混亂音波', type: 'whirlwind', windupTime: 0.35, damage: 45, cooldown: 2.5 },
        { name: '致命尖嘯雷射', type: 'laser', windupTime: 0.35, damage: 60, cooldown: 2.5 }
      ],
      4: [
        { name: '夜之樂章終極大毀滅', type: 'bullet_hell', windupTime: 0.25, damage: 85, cooldown: 2.0 }
      ]
    }
  },
  17: {
    id: 17,
    name: '冰人',
    title: '冷庫大亨 冰人',
    quote: '「溫度降到零下時，血液凝固的聲音很脆。」',
    weaponRewardId: 18,
    color: '#00bfff',
    tierMoves: {
      1: [
        { name: '急凍乾冰噴射', type: 'slam', windupTime: 0.85, damage: 22, cooldown: 3.5 },
        { name: '冰錐散射', type: 'bullet_hell', windupTime: 0.8, damage: 20, cooldown: 3.0 }
      ],
      2: [
        { name: '全場極寒急凍', type: 'whirlwind', windupTime: 0.5, damage: 32, cooldown: 3.0 },
        { name: '巨大冰山滾砸', type: 'rush', windupTime: 0.5, damage: 42, cooldown: 3.5 }
      ],
      3: [
        { name: '萬物冰雕爆破', type: 'bullet_hell', windupTime: 0.35, damage: 55, cooldown: 2.5 },
        { name: '極寒冰霜死光', type: 'laser', windupTime: 0.35, damage: 60, cooldown: 2.5 }
      ],
      4: [
        { name: '冰河世紀終極急凍風暴', type: 'bullet_hell', windupTime: 0.25, damage: 85, cooldown: 2.0 }
      ]
    }
  },
  18: {
    id: 18,
    name: '鐵甲暴君',
    title: '叛軍軍閥 鐵甲暴君',
    quote: '「在絕對的重火力和鋼鐵面前，沒有正義。」',
    weaponRewardId: 19,
    color: '#708090',
    tierMoves: {
      1: [
        { name: '加特林狂暴預熱掃射', type: 'bullet_hell', windupTime: 0.9, damage: 28, cooldown: 3.5 },
        { name: '鐵裝重拳轟擊', type: 'slam', windupTime: 0.85, damage: 30, cooldown: 4.0 }
      ],
      2: [
        { name: '鋼鐵堡壘展開護盾', type: 'whirlwind', windupTime: 0.5, damage: 0, cooldown: 4.5 },
        { name: '手提加特林暴雨', type: 'bullet_hell', windupTime: 0.5, damage: 45, cooldown: 3.0 }
      ],
      3: [
        { name: '穿甲鎢芯重彈風暴', type: 'bullet_hell', windupTime: 0.35, damage: 65, cooldown: 2.2 },
        { name: '泰坦裝甲狂暴衝撞', type: 'rush', windupTime: 0.35, damage: 60, cooldown: 3.0 }
      ],
      4: [
        { name: '毀天滅地金屬風暴洪流', type: 'bullet_hell', windupTime: 0.25, damage: 95, cooldown: 2.0 }
      ]
    }
  },
  19: {
    id: 19,
    name: '路易',
    title: '幕後黑金大教父',
    quote: '「整個巴黎的黑夜，都是我手中的籌碼。」',
    weaponRewardId: 20,
    color: '#ffd700',
    tierMoves: {
      1: [
        { name: '黃金左輪點射', type: 'laser', windupTime: 0.8, damage: 22, cooldown: 3.0 },
        { name: '護衛召喚', type: 'spawn_minions', windupTime: 0.9, damage: 0, cooldown: 5.0 }
      ],
      2: [
        { name: '黃金左輪點射', type: 'laser', windupTime: 0.45, damage: 30, cooldown: 2.5 },
        { name: '護衛召喚', type: 'spawn_minions', windupTime: 0.5, damage: 0, cooldown: 4.0 },
        { name: '燃燒榴彈轟炸', type: 'slam', windupTime: 0.5, damage: 40, cooldown: 4.5 }
      ],
      3: [
        { name: '湯姆森金幣掃射', type: 'bullet_hell', windupTime: 0.35, damage: 45, cooldown: 2.0 },
        { name: '護衛召喚', type: 'spawn_minions', windupTime: 0.35, damage: 0, cooldown: 3.5 },
        { name: '燃燒榴彈轟炸', type: 'slam', windupTime: 0.35, damage: 55, cooldown: 3.5 },
        { name: '黑金護盾展開', type: 'whirlwind', windupTime: 0.4, damage: 30, cooldown: 5.0 }
      ],
      4: [
        { name: '湯姆森金幣掃射', type: 'bullet_hell', windupTime: 0.25, damage: 55, cooldown: 1.5 },
        { name: '護衛召喚', type: 'spawn_minions', windupTime: 0.25, damage: 0, cooldown: 3.0 },
        { name: '燃燒榴彈轟炸', type: 'slam', windupTime: 0.25, damage: 70, cooldown: 2.8 },
        { name: '黑金護盾展開', type: 'whirlwind', windupTime: 0.3, damage: 45, cooldown: 4.0 },
        { name: '教父終極黑金處刑風暴', type: 'bullet_hell', windupTime: 0.4, damage: 95, cooldown: 5.0 }
      ]
    }
  },
  20: {
    id: 20,
    name: '灰燼拉斐爾',
    title: '掘墓人 灰燼拉斐爾',
    quote: '「我為二十四位霸主掘過墓，今天輪到你了。」',
    weaponRewardId: 21,
    color: '#4b5320',
    tierMoves: {
      1: [
        { name: '工兵鏟劈砸', type: 'slam', windupTime: 0.85, damage: 26, cooldown: 3.0 },
        { name: '潛土突襲', type: 'smoke_teleport', windupTime: 0.8, damage: 22, cooldown: 4.0 }
      ],
      2: [
        { name: '破土衝天震擊', type: 'slam', windupTime: 0.45, damage: 38, cooldown: 2.8 },
        { name: '投擲墓土毒瘴', type: 'bullet_hell', windupTime: 0.5, damage: 30, cooldown: 3.5 }
      ],
      3: [
        { name: '連續地底突刺', type: 'rush', windupTime: 0.35, damage: 50, cooldown: 2.2 },
        { name: '墓穴死者狂嘯', type: 'bullet_hell', windupTime: 0.35, damage: 45, cooldown: 3.0 }
      ],
      4: [
        { name: '萬骨歸宗大崩塌', type: 'bullet_hell', windupTime: 0.25, damage: 85, cooldown: 2.0 }
      ]
    }
  },
  21: {
    id: 21,
    name: '毒霧克勞德',
    title: '毒梟 毒霧克勞德',
    quote: '「呼吸吧，讓綠色蔓延進你的每一寸肺葉。」',
    weaponRewardId: 22,
    color: '#006400',
    tierMoves: {
      1: [
        { name: '毒氣榴彈發射', type: 'slam', windupTime: 0.85, damage: 28, cooldown: 3.5 },
        { name: '毒雲瀰漫', type: 'bullet_hell', windupTime: 0.8, damage: 20, cooldown: 3.0 }
      ],
      2: [
        { name: '毒性連鎖大爆破', type: 'bullet_hell', windupTime: 0.45, damage: 40, cooldown: 3.0 },
        { name: '生化腐蝕光束', type: 'laser', windupTime: 0.5, damage: 45, cooldown: 3.5 }
      ],
      3: [
        { name: '全屏毒雨地毯轟炸', type: 'bullet_hell', windupTime: 0.35, damage: 60, cooldown: 2.2 },
        { name: '生化狂暴猛毒', type: 'whirlwind', windupTime: 0.35, damage: 50, cooldown: 3.0 }
      ],
      4: [
        { name: '滅絕生化毒霾大風暴', type: 'bullet_hell', windupTime: 0.25, damage: 90, cooldown: 2.0 }
      ]
    }
  },
  22: {
    id: 22,
    name: '查爾斯',
    title: '雙槍殺手 查爾斯',
    quote: '「在我拔出第二把槍前，為你的罪孽祈禱。」',
    weaponRewardId: 23,
    color: '#daa520',
    tierMoves: {
      1: [
        { name: '雙槍輪射', type: 'laser', windupTime: 0.8, damage: 24, cooldown: 2.8 },
        { name: '翻滾速射', type: 'rush', windupTime: 0.8, damage: 22, cooldown: 3.5 }
      ],
      2: [
        { name: '致命速射漫遊', type: 'bullet_hell', windupTime: 0.45, damage: 38, cooldown: 2.5 },
        { name: '黃金和平子彈彈跳', type: 'bullet_hell', windupTime: 0.5, damage: 32, cooldown: 3.0 }
      ],
      3: [
        { name: '神速漫步十二連射', type: 'laser', windupTime: 0.35, damage: 65, cooldown: 2.0 },
        { name: '黃金火網彈幕', type: 'bullet_hell', windupTime: 0.35, damage: 55, cooldown: 2.8 }
      ],
      4: [
        { name: '終極殺手死線狂瀾', type: 'bullet_hell', windupTime: 0.25, damage: 90, cooldown: 1.8 }
      ]
    }
  },
  23: {
    id: 23,
    name: '盧卡斯',
    title: '審判法官 盧卡斯',
    quote: '「黑鋼處刑重鐮已舉起，此處即是終審法庭。」',
    weaponRewardId: 24,
    color: '#1c1c1c',
    tierMoves: {
      1: [
        { name: '死神重鐮劈擊', type: 'slam', windupTime: 0.85, damage: 35, cooldown: 3.5 },
        { name: '法官審判光刃', type: 'laser', windupTime: 0.8, damage: 28, cooldown: 3.0 }
      ],
      2: [
        { name: '血色迴旋飛鐮', type: 'whirlwind', windupTime: 0.45, damage: 45, cooldown: 2.8 },
        { name: '靈魂收割瞬步', type: 'rush', windupTime: 0.5, damage: 40, cooldown: 3.5 }
      ],
      3: [
        { name: '末日審判斷頭台', type: 'slam', windupTime: 0.35, damage: 75, cooldown: 2.2 },
        { name: '無盡黑鋼飛鐮狂瀾', type: 'bullet_hell', windupTime: 0.35, damage: 60, cooldown: 2.8 }
      ],
      4: [
        { name: '死神終極大裁決', type: 'bullet_hell', windupTime: 0.25, damage: 100, cooldown: 1.8 }
      ]
    }
  },
  24: {
    id: 24,
    name: '夜鶯始祖',
    title: '暗夜巴黎 始祖夜鶯',
    quote: '「黑金的輪迴永無止境，你不過是夜色中的下一道亡魂。」',
    weaponRewardId: 1,
    color: '#d4af37',
    tierMoves: {
      1: [
        { name: '手杖劍瞬影斬', type: 'rush', windupTime: 0.8, damage: 30, cooldown: 3.0 },
        { name: '巴黎暗夜黑金風暴', type: 'bullet_hell', windupTime: 0.8, damage: 25, cooldown: 3.5 }
      ],
      2: [
        { name: '全武器神技解放', type: 'bullet_hell', windupTime: 0.45, damage: 48, cooldown: 2.5 },
        { name: '黑金領域展開', type: 'whirlwind', windupTime: 0.5, damage: 40, cooldown: 3.5 }
      ],
      3: [
        { name: '無極圓舞百裂斬', type: 'rush', windupTime: 0.35, damage: 80, cooldown: 2.0 },
        { name: '始祖夜鶯天罰彈幕', type: 'bullet_hell', windupTime: 0.35, damage: 70, cooldown: 2.5 }
      ],
      4: [
        { name: '暗夜巴黎終極黑金輪迴', type: 'bullet_hell', windupTime: 0.25, damage: 120, cooldown: 1.5 }
      ]
    }
  }
};
