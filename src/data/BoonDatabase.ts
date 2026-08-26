export interface BoonInfo {
  id: string;
  name: string;
  faction: 'crimson' | 'inferno' | 'volt' | 'cryo' | 'greed' | 'juggernaut' | 'chrono' | 'drone' | 'puppet' | 'roulette' | 'moonshine' | 'noir_film' | 'dual';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  desc: string;
  effectType: 'bleed' | 'burn' | 'shock' | 'freeze' | 'cash' | 'reload' | 'damage' | 'dodge' | 'stat' | 'drone' | 'bullet_time' | 'parry' | 'puppet' | 'roulette' | 'moonshine' | 'echo';
  value: number;
}

export const BOON_DATABASE: BoonInfo[] = [
  // ================= 1. 🩸 猩紅處刑與斷頭台派系 (Crimson Guillotine) =================
  { id: 'c1', name: '割喉之刃', faction: 'crimson', rarity: 'common', desc: '攻擊附加撕裂流血，每秒造成 20 點真實傷害', effectType: 'bleed', value: 20 },
  { id: 'c2', name: '大出血噴濺', faction: 'crimson', rarity: 'rare', desc: '敵人移動時流血傷害翻倍，並向四周噴濺血滴減速附近怪物 50%', effectType: 'bleed', value: 2.0 },
  { id: 'c3', name: '暗影背刺處刑', faction: 'crimson', rarity: 'epic', desc: '背刺必定 350% 暴擊，並將目標血量上限永久削減 20%', effectType: 'damage', value: 3.5 },
  { id: 'c4', name: '暗影殘像替身', faction: 'crimson', rarity: 'rare', desc: '翻滾時在原地留下殘影嘲諷吸引全場仇恨 2 秒', effectType: 'dodge', value: 2.0 },
  { id: 'c5', name: '天降斷頭台', faction: 'crimson', rarity: 'epic', desc: '目標血量低於 25% 時，天頂落下巨大鐵斷頭台將其直接斬首秒殺', effectType: 'damage', value: 999 },
  { id: 'c6', name: '血腥盛宴', faction: 'crimson', rarity: 'common', desc: '擊殺流血目標立即掉落血珠，拾取恢復 6 點生命', effectType: 'stat', value: 6 },
  { id: 'c7', name: '千刃暗影步', faction: 'crimson', rarity: 'common', desc: '身處煙霧中時獲得 100% 暴擊率與 50% 移速加成', effectType: 'stat', value: 0.5 },
  { id: 'c8', name: '死神之印', faction: 'crimson', rarity: 'rare', desc: '特技標記目標，使其受到的所有後續傷害提升 45%', effectType: 'damage', value: 0.45 },
  { id: 'c9', name: '傳奇血染巴黎', faction: 'crimson', rarity: 'legendary', desc: '擊殺任意敵人時，引爆全場所有敵人的流血層數造成連鎖全屏血霧大殉爆', effectType: 'bleed', value: 95 },
  { id: 'c10', name: '傳奇影分身瞬殺', faction: 'crimson', rarity: 'legendary', desc: '暴擊或背刺時，召喚 1 具黑影分身瞬移至最遠敵人身後施展同步斬擊 (80 傷害)', effectType: 'damage', value: 80 },

  // ================= 2. 🔥 煉獄焦土與黑市炸藥派系 (Inferno Demolition) =================
  { id: 'i1', name: '燃油附魔', faction: 'inferno', rarity: 'common', desc: '所有彈道與斬擊附加點燃，燃燒 4 秒且自身 100% 免疫自傷', effectType: 'burn', value: 16 },
  { id: 'i2', name: '高溫鏈式殉爆', faction: 'inferno', rarity: 'rare', desc: '被點燃擊殺的敵人引發半徑 80px 的高爆火球，引燃全場掩體', effectType: 'burn', value: 55 },
  { id: 'i3', name: '烈焰風暴足跡', faction: 'inferno', rarity: 'common', desc: '翻滾時在身後留下一道持續 3.5 秒的焦土地毯火海', effectType: 'burn', value: 28 },
  { id: 'i4', name: '熔爐破甲', faction: 'inferno', rarity: 'rare', desc: '燃燒目標防禦力歸零，受到的所有傷害提升 50%', effectType: 'damage', value: 0.5 },
  { id: 'i5', name: '莫洛托夫洗禮', faction: 'inferno', rarity: 'rare', desc: '重攻擊時向周圍散落 3 顆小型燃燒彈，鋪滿地面', effectType: 'burn', value: 35 },
  { id: 'i6', name: '狂暴火神', faction: 'inferno', rarity: 'common', desc: '攻擊處於燃燒中的敵人時，自身攻速與射速提升 35%', effectType: 'stat', value: 0.35 },
  { id: 'i7', name: '烈性炸藥大師', faction: 'inferno', rarity: 'epic', desc: '所有爆炸與手雷範圍提升 60%，爆炸傷害提升 45%', effectType: 'damage', value: 0.45 },
  { id: 'i8', name: '高溫蒸發處決', faction: 'inferno', rarity: 'common', desc: '對血量低於 35% 的燃燒敵人造成 2.5 倍致命傷害', effectType: 'damage', value: 1.5 },
  { id: 'i9', name: '傳奇末日火海', faction: 'inferno', rarity: 'legendary', desc: '暴擊時天降 3 枚重型迫擊砲轟炸目標區域，引發全屏火海', effectType: 'burn', value: 120 },
  { id: 'i10', name: '傳奇地獄炎帝爆震', faction: 'inferno', rarity: 'legendary', desc: '受傷時自動向 360 度釋放全屏高壓火焰衝擊波，推開並點燃全場', effectType: 'burn', value: 85 },

  // ================= 3. ⚡ 電磁連鎖與特斯拉死光派系 (Volt Tesla Storm) =================
  { id: 'v1', name: '高壓連鎖電弧', faction: 'volt', rarity: 'common', desc: '攻擊命中向周圍 4 名敵人彈射高壓電弧 (24 傷害)', effectType: 'shock', value: 24 },
  { id: 'v2', name: '超導 EMP 癱瘓', faction: 'volt', rarity: 'rare', desc: '感電敵人累積 3 次電擊後引爆 EMP，癱瘓周圍敵人 2.0 秒', effectType: 'shock', value: 45 },
  { id: 'v3', name: '磁暴翻滾', faction: 'volt', rarity: 'common', desc: '翻滾穿過敵人時釋放高壓雷擊並擊暈路徑敵人 0.8 秒', effectType: 'shock', value: 30 },
  { id: 'v4', name: '特斯拉死光穿甲', faction: 'volt', rarity: 'rare', desc: '子彈貫穿目標時在目標間拉出一道持續 2 秒的致死高壓雷網', effectType: 'damage', value: 35 },
  { id: 'v5', name: '動能回充', faction: 'volt', rarity: 'common', desc: '每次觸發電弧彈射，使神兵特技冷卻減少 0.5 秒', effectType: 'stat', value: 0.5 },
  { id: 'v6', name: '法拉第電磁護盾', faction: 'volt', rarity: 'epic', desc: '每進入新房間生成 1 層吸收 30 點傷害並反彈電弧的電磁護盾', effectType: 'stat', value: 30 },
  { id: 'v7', name: '高壓過載暴擊', faction: 'volt', rarity: 'rare', desc: '對處於麻痺或感電狀態的目標，暴擊傷害提升 70%', effectType: 'damage', value: 0.7 },
  { id: 'v8', name: '電磁過熱啞火', faction: 'volt', rarity: 'common', desc: '重攻擊命中使目標槍械武器過熱啞火 2 秒無法開火', effectType: 'shock', value: 2.0 },
  { id: 'v9', name: '傳奇雷暴天降', faction: 'volt', rarity: 'legendary', desc: '施放特技時引導全屏金色落雷轟擊所有敵人 (100 傷害+全體麻痺)', effectType: 'shock', value: 100 },
  { id: 'v10', name: '傳奇磁場共振狂暴', faction: 'volt', rarity: 'legendary', desc: '場上每存在 1 名感電敵人，自身移速 +6%，全武器傷害 +15%', effectType: 'damage', value: 0.15 },

  // ================= 4. ❄️ 永凍碎冰與絕對零度派系 (Cryo Absolute Zero) =================
  { id: 'k1', name: '霜凍侵蝕', faction: 'cryo', rarity: 'common', desc: '攻擊降低目標 45% 移速與攻速，並附加極寒冰霜印記', effectType: 'freeze', value: 0.45 },
  { id: 'k2', name: '極寒碎冰暴擊', faction: 'cryo', rarity: 'rare', desc: '對冰凍或霜凍目標重攻擊造成 300% 碎冰暴擊並引爆冰晶', effectType: 'damage', value: 3.0 },
  { id: 'k3', name: '寒霜滑步足跡', faction: 'cryo', rarity: 'common', desc: '翻滾在地面留下極寒冰面，踩中敵人強制定身凍結 1.5 秒', effectType: 'freeze', value: 1.5 },
  { id: 'k4', name: '絕對零度冰雕', faction: 'cryo', rarity: 'epic', desc: '霜凍累積滿時將目標完全凍結為晶瑩冰雕，持續 3 秒無法動彈', effectType: 'freeze', value: 3.0 },
  { id: 'k5', name: '涅槃冰晶護甲', faction: 'cryo', rarity: 'epic', desc: '受到致命傷害時立即凍結全場並免疫本次死亡 (每局 1 次)', effectType: 'stat', value: 1 },
  { id: 'k6', name: '碎冰八方射線', faction: 'cryo', rarity: 'common', desc: '擊殺凍結目標時向四周高速散射 8 顆貫穿冰錐 (30 傷害+再次凍結)', effectType: 'freeze', value: 30 },
  { id: 'k7', name: '西伯利亞暴風圈', faction: 'cryo', rarity: 'rare', desc: '自身周圍常駐 110px 極寒光環，持續減速並減免 25% 近戰傷害', effectType: 'freeze', value: 0.25 },
  { id: 'k8', name: '冰刺破甲穿透', faction: 'cryo', rarity: 'common', desc: '子彈命中凍結目標時分裂為 2 顆貫穿側翼冰彈', effectType: 'damage', value: 0.35 },
  { id: 'k9', name: '傳奇萬物冰封', faction: 'cryo', rarity: 'legendary', desc: '進入戰鬥房間時立即釋放全屏急凍寒流，凍結所有小怪 3.5 秒', effectType: 'freeze', value: 3.5 },
  { id: 'k10', name: '傳奇永凍領域', faction: 'cryo', rarity: 'legendary', desc: '處於凍結狀態的目標受到的所有傷害提升 130%', effectType: 'damage', value: 1.3 },

  // ================= 5. ⏳ 時空平行宇宙與回溯派系 (Chrono Dimension Echo) =================
  { id: 't1', name: '極限擦彈感應', faction: 'chrono', rarity: 'common', desc: '在敵方子彈 25px 內極限閃避時，觸發 2.0 秒 75% 時空慢動作', effectType: 'bullet_time', value: 2.0 },
  { id: 't2', name: '漫步槍手', faction: 'chrono', rarity: 'rare', desc: '在慢動作期間自身移速不受減速影響，且暴擊率 +50%', effectType: 'stat', value: 0.5 },
  { id: 't3', name: '神經爆頭延時', faction: 'chrono', rarity: 'rare', desc: '在慢動作期間擊殺目標，使子彈時間延長 1.2 秒 (最多延長 3 次)', effectType: 'bullet_time', value: 1.2 },
  { id: 't4', name: '瞬影換彈裝填', faction: 'chrono', rarity: 'common', desc: '進入時空慢動作瞬間自動裝滿當前武器彈匣', effectType: 'reload', value: 1 },
  { id: 't5', name: '時空遲緩力場', faction: 'chrono', rarity: 'epic', desc: '自身周圍 130px 內的所有敵方子彈飛行速度驟降 70%', effectType: 'stat', value: 0.7 },
  { id: 't6', name: '時空殘響大爆震', faction: 'chrono', rarity: 'rare', desc: '慢動作結束瞬間，對全場所有在慢動作中受傷的敵人結算一次二次時空爆震 (60 傷害)', effectType: 'damage', value: 60 },
  { id: 't7', name: '倒轉秒針回溯', faction: 'chrono', rarity: 'epic', desc: '受到重傷時回溯至 2 秒前的位置並恢復所受傷害 (冷卻 30 秒)', effectType: 'stat', value: 1 },
  { id: 't8', name: '槍斗術連環節奏', faction: 'chrono', rarity: 'common', desc: '每次翻滾後 2 秒內射速提升 60%，開火不消耗精力', effectType: 'stat', value: 0.6 },
  { id: 't9', name: '傳奇駭客黑金空間', faction: 'chrono', rarity: 'legendary', desc: '主動按 E 鍵進入 4.5 秒全場 80% 大慢動作，期間換彈時間為 0', effectType: 'bullet_time', value: 4.5 },
  { id: 't10', name: '傳奇平行宇宙時空幽靈', faction: 'chrono', rarity: 'legendary', desc: '召喚 1 具 3 秒前的黑白時空幽靈，同步複製主角的所有開火與斬擊！', effectType: 'echo', value: 1.0 },

  // ================= 6. 🤖 機械工兵與重裝無人機派系 (Drone Engineering) =================
  { id: 'e1', name: '自律護衛無人機', faction: 'drone', rarity: 'common', desc: '身邊常駐 1 架雷射無人機，自動鎖定射擊周圍敵人 (每秒 28 傷害)', effectType: 'drone', value: 1 },
  { id: 'e2', name: '蜂群編隊攔截', faction: 'drone', rarity: 'rare', desc: '無人機數量 +1，且無人機會主動攔截撞毀敵方子彈', effectType: 'drone', value: 1 },
  { id: 'e3', name: '倒鉤捕獸夾地雷', faction: 'drone', rarity: 'common', desc: '翻滾時在身後佈設 1 個隱蔽捕獸夾，踩中定身 2.5 秒並造成 50 傷害', effectType: 'stat', value: 50 },
  { id: 'e4', name: '戰術防彈沙袋堡壘', faction: 'drone', rarity: 'rare', desc: '特技在身前建造 1 座吸收 10 發子彈的防彈沙袋掩體', effectType: 'stat', value: 10 },
  { id: 'e5', name: '充能貫穿光束機', faction: 'drone', rarity: 'epic', desc: '無人機攻擊升級為貫穿雷射光束，可同時射穿一整排敵人', effectType: 'drone', value: 45 },
  { id: 'e6', name: '俯衝神風自爆', faction: 'drone', rarity: 'rare', desc: '敵人靠近 45px 時，無人機自動俯衝撞擊自爆 (90 範圍傷害)', effectType: 'drone', value: 90 },
  { id: 'e7', name: '防禦工事專家', faction: 'drone', rarity: 'common', desc: '站在任何掩體周圍 70px 內時，全武器傷害提升 45%', effectType: 'damage', value: 0.45 },
  { id: 'e8', name: '捕獸夾連環破片', faction: 'drone', rarity: 'epic', desc: '捕獸夾被觸發時額外爆發 8 枚破片跳彈，造成連鎖擊退', effectType: 'damage', value: 40 },
  { id: 'e9', name: '傳奇天頂空中母艦', faction: 'drone', rarity: 'legendary', desc: '召喚 1 架大型重裝無人機，持續向戰場傾瀉微型導彈雨 (每發 50 傷害)', effectType: 'drone', value: 50 },
  { id: 'e10', name: '傳奇發條死神過載', faction: 'drone', rarity: 'legendary', desc: '所有機關、陷阱與無人機的攻擊頻率提升 100%，傷害翻倍', effectType: 'drone', value: 2.0 },

  // ================= 7. 🎭 歌劇魅影·傀儡木偶操縱派系 (Marionette Puppeteer) =================
  { id: 'p1', name: '提線木偶引線', faction: 'puppet', rarity: 'common', desc: '子彈命中敵人有 25% 機率操控其神經，使其調轉槍頭攻擊身邊隊友 3 秒', effectType: 'puppet', value: 3.0 },
  { id: 'p2', name: '混亂假面舞會', faction: 'puppet', rarity: 'rare', desc: '被魅惑或操控的敵人死亡時，爆發 3 張紫色歌劇面具詛咒周遭敵人', effectType: 'puppet', value: 40 },
  { id: 'p3', name: '替罪木偶人偶', faction: 'puppet', rarity: 'epic', desc: '受傷時將 70% 的傷害轉移給場上最近的一名敵人承受', effectType: 'puppet', value: 0.7 },
  { id: 'p4', name: '歌劇魅影音波叉', faction: 'puppet', rarity: 'common', desc: '近戰揮擊附帶紫色聲波環，使前方敵人方向感顛倒並短暫眩暈', effectType: 'shock', value: 1.0 },
  { id: 'p5', name: '傳奇水晶吊燈砸頂', faction: 'puppet', rarity: 'legendary', desc: '房間戰鬥開始時，天花板轟然砸落巨型歌劇院水晶吊燈，秒殺半場小怪並重創 Boss！', effectType: 'damage', value: 300 },

  // ================= 8. 🎰 俄羅斯輪盤·狂徒賭命派系 (Russian Roulette) =================
  { id: 'r1', name: '第六發黃金死神彈', faction: 'roulette', rarity: 'rare', desc: '彈匣每第 6 發子彈必定為【黃金致命彈】，造成 500% 毀滅真實傷害！', effectType: 'roulette', value: 5.0 },
  { id: 'r2', name: '幸運空膛轉輪', faction: 'roulette', rarity: 'common', desc: '彈匣耗盡打空膛時，獲得 1.5 秒無敵時間與 2 次免費瞬間衝刺', effectType: 'stat', value: 1.5 },
  { id: 'r3', name: '賭徒全押大狂熱', faction: 'roulette', rarity: 'epic', desc: '開火有 15% 機率觸發大滿貫，射速飆升 200% 且子彈化為全場彈跳金幣', effectType: 'cash', value: 2.0 },
  { id: 'r4', name: '黑金賄賂買命', faction: 'roulette', rarity: 'common', desc: '每持有 $100 黑金全武器傷害提升 6% (上限提升 60%)', effectType: 'cash', value: 0.06 },
  { id: 'r5', name: '傳奇命運輪盤大劫案', faction: 'roulette', rarity: 'legendary', desc: '每擊殺 5 名敵人召喚 1 顆旋轉黃金輪盤，全屏射出 24 顆折射 4 次的巨額籌碼彈！', effectType: 'roulette', value: 24 },

  // ================= 9. 🍸 禁酒令·私酒醉拳毒王派系 (Prohibition Moonshine) =================
  { id: 'm1', name: '烈性私酒醉步', faction: 'moonshine', rarity: 'common', desc: '移動路徑變得飄忽不定，獲得 35% 常駐閃避率，閃避成功釋放酒氣爆震', effectType: 'moonshine', value: 0.35 },
  { id: 'm2', name: '酒精爆燃噴吐', faction: 'moonshine', rarity: 'rare', desc: '受到攻擊或換彈時，向前方大口噴出烈焰酒精，引發扇形 3 秒大火海', effectType: 'burn', value: 45 },
  { id: 'm3', name: '醉拳重擊霸體', faction: 'moonshine', rarity: 'rare', desc: '近戰攻擊獲得 50% 霸體減傷，連段第 3 段將敵人打入泥醉眩暈 2 秒', effectType: 'stat', value: 2.0 },
  { id: 'm4', name: '走私私酒桶投擲', faction: 'moonshine', rarity: 'epic', desc: '特技額外向前拋出一隻滾動炸藥私酒桶，撞擊敵人或掩體引發大爆破', effectType: 'damage', value: 80 },
  { id: 'm5', name: '傳奇教父私酒狂暴', faction: 'moonshine', rarity: 'legendary', desc: '血量低於 50% 時喝下私酒神仙水，獲得 6 秒 100% 暴擊、50% 移速與 40% 攻擊吸血', effectType: 'moonshine', value: 6.0 },

  // ================= 10. 🪞 鏡花水月·黑白電影放映派系 (Film Noir Monochromatic) =================
  { id: 'f1', name: '黑白電影慢鏡頭', faction: 'noir_film', rarity: 'common', desc: '暴擊擊殺敵人時觸發經典黑色電影 1 秒定格特寫，期間填滿彈匣', effectType: 'stat', value: 1.0 },
  { id: 'f2', name: '擬聲實體化 BANG!', faction: 'noir_film', rarity: 'rare', desc: '開火時在空中實體化飛出巨大的美漫字樣【BANG!】，撞擊目標造成二次物理鈍擊', effectType: 'damage', value: 35 },
  { id: 'f3', name: '爵士樂鼓點節奏', faction: 'noir_film', rarity: 'rare', desc: '伴隨戰鬥音樂鼓點節奏開火，射速提升 40% 且子彈附帶穿透破甲', effectType: 'stat', value: 0.4 },
  { id: 'f4', name: '傳奇放映機膠片倒流', faction: 'noir_film', rarity: 'legendary', desc: '受到致命傷害時膠片倒轉，全場時間與怪物倒退 3 秒，主角滿血重啟本房間！', effectType: 'stat', value: 1 },

  // ================= 11. 🥊 鐵拳重裝與盾反格擋派系 (Juggernaut Bastion) =================
  { id: 'j1', name: '戰術快速裝填', faction: 'juggernaut', rarity: 'common', desc: '所有槍械換彈時間縮短 55%', effectType: 'reload', value: 0.55 },
  { id: 'j2', name: '致命末尾重彈', faction: 'juggernaut', rarity: 'rare', desc: '彈匣最後 1 發子彈必定造成 300% 破甲致命暴擊', effectType: 'reload', value: 3.0 },
  { id: 'j3', name: '防暴鋼鐵格擋', faction: 'juggernaut', rarity: 'common', desc: '近戰攻擊時正面 120 度 100% 抵消子彈與怪物衝撞', effectType: 'parry', value: 1 },
  { id: 'j4', name: '完美彈反反射', faction: 'juggernaut', rarity: 'rare', desc: '在子彈即將命中前 0.15 秒切彈，以 300% 威力與 2 倍速原路反彈擊殺敵人', effectType: 'parry', value: 3.0 },
  { id: 'j5', name: '鋼鐵重裝韌性', faction: 'juggernaut', rarity: 'common', desc: '永久減免 25% 所受到的所有傷害', effectType: 'stat', value: 0.25 },
  { id: 'j6', name: '泰坦霸體出拳', faction: 'juggernaut', rarity: 'rare', desc: '蓄力與近戰連段期間完全免疫硬直、擊退與眩暈', effectType: 'stat', value: 1 },
  { id: 'j7', name: '鐵山靠重裝衝撞', faction: 'juggernaut', rarity: 'common', desc: '翻滾撞擊敵人造成重度擊退並擊暈 0.8 秒', effectType: 'dodge', value: 20 },
  { id: 'j8', name: '崩山破甲震波', faction: 'juggernaut', rarity: 'common', desc: '重攻擊命中使目標防禦力永久下降 35%', effectType: 'damage', value: 0.35 },
  { id: 'j9', name: '傳奇擊殺自動上膛', faction: 'juggernaut', rarity: 'legendary', desc: '擊殺任意敵人立即自動補滿彈匣並刷新翻滾精力', effectType: 'reload', value: 1 },
  { id: 'j10', name: '傳奇不滅泰坦狂暴', faction: 'juggernaut', rarity: 'legendary', desc: '生命低於 30% 時獲得 60% 減傷、霸體與 50% 攻擊吸血', effectType: 'stat', value: 0.6 },

  // ================= 12. 🌟 跨派系十二大雙重融合傳奇天賦 (Dual Synergies) =================
  { id: 'syn1', name: '【雙重】超載電漿爆轟', faction: 'dual', rarity: 'legendary', desc: '【烈焰+電磁】感電敵人受到燃燒時引發連鎖超載雷爆 (75 範圍傷害)', effectType: 'shock', value: 75 },
  { id: 'syn2', name: '【雙重】血晶吸血碎裂', faction: 'dual', rarity: 'legendary', desc: '【猩紅+極寒】凍結敵人受到流血時碎裂成 8 顆吸血冰刺 (汲取 HP)', effectType: 'freeze', value: 40 },
  { id: 'syn3', name: '【雙重】沸血焚燒烈霧', faction: 'dual', rarity: 'legendary', desc: '【猩紅+烈焰】同時處於流血與燃燒的目標每秒向周圍噴發高傷火霧', effectType: 'burn', value: 45 },
  { id: 'syn4', name: '【雙重】超導極低溫雷暴', faction: 'dual', rarity: 'legendary', desc: '【電磁+極寒】電弧在凍結目標間傳導傷害翻倍並延長凍結時間', effectType: 'shock', value: 2.0 },
  { id: 'syn5', name: '【雙重】刀刃反彈風暴', faction: 'dual', rarity: 'legendary', desc: '【猩紅+鐵腕】近戰揮刀切彈以 350% 速度與威力原路反射回敵陣', effectType: 'damage', value: 3.5 },
  { id: 'syn6', name: '【雙重】黑金暴徒重裝', faction: 'dual', rarity: 'legendary', desc: '【輪盤+鐵腕】每持有 $100 黑金獲得 3% 減傷且近戰重擊爆發金幣震波', effectType: 'cash', value: 0.03 },
  { id: 'syn7', name: '【雙重】醉拳焦土風暴', faction: 'dual', rarity: 'legendary', desc: '【私酒+烈焰】私酒翻滾直接點燃全場地毯，噴吐酒精傷害提升 150%', effectType: 'burn', value: 70 },
  { id: 'syn8', name: '【雙重】傀儡雷霆連鎖', faction: 'dual', rarity: 'legendary', desc: '【傀儡+電磁】被操控的傀儡化為移動特斯拉電塔，持續電擊身邊隊友', effectType: 'shock', value: 40 },
  { id: 'syn9', name: '【雙重】時空瞬獄斷頭台', faction: 'dual', rarity: 'legendary', desc: '【時空+猩紅】時空慢動作期間背刺處刑傷害提升至 500% 並直接觸發斷頭台', effectType: 'damage', value: 5.0 },
  { id: 'syn10', name: '【雙重】無人機雷霆母艦', faction: 'dual', rarity: 'legendary', desc: '【機關+電磁】無人機射擊附加連鎖電弧，並定期召喚天頂落雷轟炸', effectType: 'drone', value: 50 },
  { id: 'syn11', name: '【雙重】黑白電影金幣雨', faction: 'dual', rarity: 'legendary', desc: '【電影+輪盤】每次觸發 BANG! 實體字樣爆發一圈金色輪盤折射籌碼彈', effectType: 'roulette', value: 35 },
  { id: 'syn12', name: '【雙重】醉仙時空漫步', faction: 'dual', rarity: 'legendary', desc: '【私酒+時空】私酒醉步閃避時直接觸發 2.5 秒時空慢動作且全暴擊', effectType: 'bullet_time', value: 2.5 }
];

