export interface BoonInfo {
  id: string;
  name: string;
  faction: 'crimson' | 'inferno' | 'volt' | 'cryo' | 'greed' | 'juggernaut' | 'dual';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  desc: string;
  effectType: 'bleed' | 'burn' | 'shock' | 'freeze' | 'cash' | 'reload' | 'damage' | 'dodge' | 'stat';
  value: number;
}

export const BOON_DATABASE: BoonInfo[] = [
  // 1. 猩紅刺殺流 (10種)
  { id: 'c1', name: '割喉本能', faction: 'crimson', rarity: 'common', desc: '輕攻擊 30 百分比機率附加流血 每秒造成 15 點持續傷害', effectType: 'bleed', value: 15 },
  { id: 'c2', name: '大出血', faction: 'crimson', rarity: 'rare', desc: '敵人移動時 受到的流血傷害提升 150 百分比', effectType: 'bleed', value: 1.5 },
  { id: 'c3', name: '淬毒刀刃', faction: 'crimson', rarity: 'rare', desc: '流血敵人受到重攻擊時 爆發毒霧傳染周圍小怪', effectType: 'bleed', value: 25 },
  { id: 'c4', name: '幻影殘影', faction: 'crimson', rarity: 'rare', desc: '翻滾閃避在原地留下殘影 吸引敵人仇恨 1.5 秒', effectType: 'dodge', value: 1.5 },
  { id: 'c5', name: '背刺處刑', faction: 'crimson', rarity: 'epic', desc: '背部攻擊必定暴擊 造成 250 百分比致命傷害', effectType: 'damage', value: 2.5 },
  { id: 'c6', name: '殺戮盛宴', faction: 'crimson', rarity: 'common', desc: '擊殺處於流血狀態的敵人 恢復 3 點生命值', effectType: 'stat', value: 3 },
  { id: 'c7', name: '死亡標記', faction: 'crimson', rarity: 'rare', desc: '特技命中標記敵人 後續受到的所有傷害提升 35 百分比', effectType: 'damage', value: 0.35 },
  { id: 'c8', name: '刺客步法', faction: 'crimson', rarity: 'common', desc: '移動速度永久提升 15 百分比', effectType: 'stat', value: 0.15 },
  { id: 'c9', name: '傳奇血染巴黎', faction: 'crimson', rarity: 'legendary', desc: '擊殺任意敵人時 引爆全場所有敵人的流血層數造成全屏爆發', effectType: 'bleed', value: 80 },
  { id: 'c10', name: '傳奇靈魂撕裂', faction: 'crimson', rarity: 'legendary', desc: '每次暴擊額外觸發一次無消耗的瞬影背刺斬擊', effectType: 'damage', value: 60 },

  // 2. 烈焰焦土流 (10種)
  { id: 'i1', name: '燃油塗裝', faction: 'inferno', rarity: 'common', desc: '所有子彈與揮砍附加點燃效果 持續燃燒 3 秒', effectType: 'burn', value: 12 },
  { id: 'i2', name: '連鎖殉爆', faction: 'inferno', rarity: 'rare', desc: '被點燃擊殺的敵人引發範圍火球爆炸', effectType: 'burn', value: 45 },
  { id: 'i3', name: '焦土步法', faction: 'inferno', rarity: 'common', desc: '翻滾時在身後留下一道持續 3 秒的火海', effectType: 'burn', value: 20 },
  { id: 'i4', name: '火力壓制', faction: 'inferno', rarity: 'common', desc: '攻擊處於燃燒中的敵人時 攻速與射速提升 25 百分比', effectType: 'stat', value: 0.25 },
  { id: 'i5', name: '莫洛托夫之怒', faction: 'inferno', rarity: 'rare', desc: '蓄力重攻擊時 額外向周圍散落 3 顆小燃燒彈', effectType: 'burn', value: 30 },
  { id: 'i6', name: '熔火破甲', faction: 'inferno', rarity: 'rare', desc: '燃燒效果同時降低敵人 40 百分比護甲防禦', effectType: 'damage', value: 0.4 },
  { id: 'i7', name: '爆破大師', faction: 'inferno', rarity: 'epic', desc: '手雷與爆炸範圍提升 50 百分比 傷害提升 35 百分比', effectType: 'damage', value: 0.35 },
  { id: 'i8', name: '高溫蒸發', faction: 'inferno', rarity: 'common', desc: '對低於 30 百分比血量的燃燒敵人 傷害加倍', effectType: 'damage', value: 1.0 },
  { id: 'i9', name: '傳奇末日火海', faction: 'inferno', rarity: 'legendary', desc: '暴擊時召喚天降燃燒榴彈 轟炸目標區域', effectType: 'burn', value: 100 },
  { id: 'i10', name: '傳奇地獄咆哮', faction: 'inferno', rarity: 'legendary', desc: '受到傷害時 自動釋放全屏爆震衝擊波燃燒全場', effectType: 'burn', value: 70 },

  // 3. 電磁連鎖流 (10種)
  { id: 'v1', name: '電弧跳躍', faction: 'volt', rarity: 'common', desc: '攻擊命中時 彈射一道電弧至附近 2 名黑幫小弟', effectType: 'shock', value: 18 },
  { id: 'v2', name: '超導過載', faction: 'volt', rarity: 'rare', desc: '麻痺累積滿時引發 EMP 衝擊波 擊暈周遭 1.5 秒', effectType: 'shock', value: 35 },
  { id: 'v3', name: '磁暴翻滾', faction: 'volt', rarity: 'common', desc: '翻滾時對穿過的所有敵人 釋放高壓電擊', effectType: 'shock', value: 22 },
  { id: 'v4', name: '導電彈頭', faction: 'volt', rarity: 'rare', desc: '子彈貫穿多個敵人時 傷害不衰減並附帶電擊', effectType: 'damage', value: 0.2 },
  { id: 'v5', name: '能量回充', faction: 'volt', rarity: 'common', desc: '每次觸發電弧 使武器專屬特技冷卻時間減少 0.4 秒', effectType: 'stat', value: 0.4 },
  { id: 'v6', name: '電磁護盾', faction: 'volt', rarity: 'epic', desc: '每進入一個新房間 自動生成一個吸收 1 次傷害的護盾', effectType: 'stat', value: 1 },
  { id: 'v7', name: '高壓電湧', faction: 'volt', rarity: 'rare', desc: '對處於麻痺狀態的敵人 造成額外 50 百分比暴擊傷害', effectType: 'damage', value: 0.5 },
  { id: 'v8', name: '電磁脈衝彈', faction: 'volt', rarity: 'common', desc: '重攻擊命中時 額外使目標武器癱瘓 1 秒', effectType: 'shock', value: 1 },
  { id: 'v9', name: '傳奇雷暴降臨', faction: 'volt', rarity: 'legendary', desc: '釋放特技時 引導全屏落雷轟擊所有敵人', effectType: 'shock', value: 90 },
  { id: 'v10', name: '傳奇過載共振', faction: 'volt', rarity: 'legendary', desc: '場上每存在一名感電敵人 自身攻擊力提升 10 百分比', effectType: 'damage', value: 0.1 },

  // 4. 極寒碎冰流 (10種)
  { id: 'k1', name: '霜凍侵蝕', faction: 'cryo', rarity: 'common', desc: '攻擊降低敵人 35 百分比移速與攻速', effectType: 'freeze', value: 0.35 },
  { id: 'k2', name: '極寒碎裂', faction: 'cryo', rarity: 'rare', desc: '對被減速或凍結的敵人 施加重攻擊造成 200 百分比碎冰暴擊', effectType: 'damage', value: 2.0 },
  { id: 'k3', name: '寒霜足跡', faction: 'cryo', rarity: 'common', desc: '翻滾凍結路徑上的敵人 1 秒', effectType: 'freeze', value: 1 },
  { id: 'k4', name: '絕對零度', faction: 'cryo', rarity: 'epic', desc: '霜凍疊加 4 層後 敵人被完全凍結成冰雕 2 秒', effectType: 'freeze', value: 2 },
  { id: 'k5', name: '冰晶護甲', faction: 'cryo', rarity: 'epic', desc: '受到致命傷害時 立即凍結周圍並免疫本次死亡 (每輪 1 次)', effectType: 'stat', value: 1 },
  { id: 'k6', name: '碎冰濺射', faction: 'cryo', rarity: 'common', desc: '擊殺凍結敵人時 向四周射出 8 顆穿透冰錐', effectType: 'freeze', value: 20 },
  { id: 'k7', name: '寒冬之擁', faction: 'cryo', rarity: 'rare', desc: '自身周圍常駐 2 米低溫減速光環', effectType: 'freeze', value: 0.25 },
  { id: 'k8', name: '凍結穿刺', faction: 'cryo', rarity: 'common', desc: '子彈命中凍結目標時 額外產生貫穿傷害', effectType: 'damage', value: 0.3 },
  { id: 'k9', name: '傳奇萬物冰封', faction: 'cryo', rarity: 'legendary', desc: '進入戰鬥房間前 5 秒 全場所有敵人攻速與移速降低 50 百分比', effectType: 'freeze', value: 0.5 },
  { id: 'k10', name: '傳奇永凍領域', faction: 'cryo', rarity: 'legendary', desc: '處於凍結狀態的敵人 受到的所有傷害翻倍', effectType: 'damage', value: 2.0 },

  // 5. 貪婪資本流 (10種)
  { id: 'g1', name: '金幣就是子彈', faction: 'greed', rarity: 'rare', desc: '每持有 100 黑金鈔票 全武器傷害提升 5 百分比 (上限 50 百分比)', effectType: 'cash', value: 0.05 },
  { id: 'g2', name: '懸賞獵人', faction: 'greed', rarity: 'common', desc: '擊殺精英怪與 Boss 掉落雙倍黑金鈔票', effectType: 'cash', value: 2.0 },
  { id: 'g3', name: '保險箱防衛', faction: 'greed', rarity: 'rare', desc: '受到傷害時 自動掉落 3 枚爆炸金幣手雷反擊敵人', effectType: 'cash', value: 35 },
  { id: 'g4', name: '黑金賄賂', faction: 'greed', rarity: 'common', desc: '黑市商人所有商品與武器全場打 7 折', effectType: 'stat', value: 0.3 },
  { id: 'g5', name: '賭徒的硬幣', faction: 'greed', rarity: 'epic', desc: '每次開火有 20 百分比機率 造成 3 倍幸運暴擊', effectType: 'damage', value: 3.0 },
  { id: 'g6', name: '黑市高利貸', faction: 'greed', rarity: 'common', desc: '開局立即獲得 300 黑金鈔票 但受傷增加 10 百分比', effectType: 'cash', value: 300 },
  { id: 'g7', name: '鑲金彈藥', faction: 'greed', rarity: 'common', desc: '暴擊時 敵人額外掉落黑金金幣', effectType: 'cash', value: 10 },
  { id: 'g8', name: '貪婪利息', faction: 'greed', rarity: 'rare', desc: '通關一個房間 依當前持有金幣獲得 5 百分比利息獎勵', effectType: 'cash', value: 0.05 },
  { id: 'g9', name: '傳奇金手套處刑', faction: 'greed', rarity: 'legendary', desc: '拾取黑金鈔票時 獲得 2 秒無敵時間與無限射速', effectType: 'cash', value: 2 },
  { id: 'g10', name: '傳奇黑金帝國', faction: 'greed', rarity: 'legendary', desc: '在黑市商人處購買物品後 永久提升 15 百分比全傷害', effectType: 'damage', value: 0.15 },

  // 6. 鐵腕重裝與戰術換彈流 (10種)
  { id: 'j1', name: '快速上膛', faction: 'juggernaut', rarity: 'common', desc: '所有槍械換彈裝填時間 縮短 50 百分比', effectType: 'reload', value: 0.5 },
  { id: 'j2', name: '致命末彈', faction: 'juggernaut', rarity: 'rare', desc: '彈匣最後 1 發子彈 必定造成 250 百分比致命暴擊', effectType: 'reload', value: 2.5 },
  { id: 'j3', name: '戰術換彈煙幕', faction: 'juggernaut', rarity: 'common', desc: '換彈時 向周圍釋放擊退煙霧 推開近身敵人', effectType: 'reload', value: 1 },
  { id: 'j4', name: '鋼鐵之軀', faction: 'juggernaut', rarity: 'common', desc: '永久減免 20 百分比 所受到的所有傷害', effectType: 'stat', value: 0.2 },
  { id: 'j5', name: '霸體重擊', faction: 'juggernaut', rarity: 'rare', desc: '蓄力重攻擊期間 完全免疫硬直與擊退', effectType: 'stat', value: 1 },
  { id: 'j6', name: '衝撞先鋒', faction: 'juggernaut', rarity: 'common', desc: '翻滾撞擊敵人 造成重度擊退與 0.5 秒眩暈', effectType: 'dodge', value: 15 },
  { id: 'j7', name: '巨人之握', faction: 'juggernaut', rarity: 'rare', desc: '所有武器重攻擊蓄力速度 加快 50 百分比', effectType: 'stat', value: 0.5 },
  { id: 'j8', name: '破甲震波', faction: 'juggernaut', rarity: 'common', desc: '重攻擊命中使目標防禦永久降低 30 百分比', effectType: 'damage', value: 0.3 },
  { id: 'j9', name: '傳奇不可阻擋', faction: 'juggernaut', rarity: 'legendary', desc: '擊殺敵人立即自動補滿當前彈匣 並刷新翻滾冷卻', effectType: 'reload', value: 1 },
  { id: 'j10', name: '傳奇不死泰坦', faction: 'juggernaut', rarity: 'legendary', desc: '生命值低於 25 百分比時 獲得 50 百分比全傷害減免與霸體', effectType: 'stat', value: 0.5 },

  // 7. 跨派系雙重融合神級天賦 (Dual Synergies)
  { id: 'syn1', name: '【雙重】超載爆轟', faction: 'dual', rarity: 'legendary', desc: '【烈焰+電磁】觸電敵人受到燃燒時 引發連鎖電漿雷爆 (60 範圍傷)', effectType: 'shock', value: 60 },
  { id: 'syn2', name: '【雙重】血晶碎裂', faction: 'dual', rarity: 'legendary', desc: '【猩紅+極寒】凍結敵人受到流血時 碎裂成 8 枚吸血冰刺 (35 傷+汲取HP)', effectType: 'freeze', value: 35 },
  { id: 'syn3', name: '【雙重】沸血蒸騰', faction: 'dual', rarity: 'legendary', desc: '【猩紅+烈焰】同時處於流血與燃燒的敵人 每秒向周圍噴發高傷火霧', effectType: 'burn', value: 40 },
  { id: 'syn4', name: '【雙重】超導低溫', faction: 'dual', rarity: 'legendary', desc: '【電磁+極寒】電弧在凍結目標間傳導並擊暈 1.5 秒', effectType: 'shock', value: 1.5 },
  { id: 'syn5', name: '【雙重】刀刃反彈風暴', faction: 'dual', rarity: 'legendary', desc: '【猩紅+鐵腕】近戰揮刀切彈 原路 300 百分比速度與威力反射回敵人群', effectType: 'damage', value: 3.0 },
  { id: 'syn6', name: '【雙重】黑金暴徒裝甲', faction: 'dual', rarity: 'legendary', desc: '【貪婪+鐵腕】每持有 100 黑金獲得 3 百分比減傷 且近戰重擊爆發金幣衝擊波', effectType: 'cash', value: 0.03 }
];

