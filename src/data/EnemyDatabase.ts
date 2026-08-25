export interface EnemyInfo {
  id: number;
  name: string;
  faction: string;
  hp: number;
  speed: number;
  damage: number;
  attackRange: number;
  windupTime: number;
  color: string;
  attackType: 'melee_slash' | 'pounce' | 'shoot_bullet' | 'buckshot' | 'sniper_laser' | 'toss_molotov' | 'flame_jet' | 'charge';
  tellType: 'yellow_exclamation' | 'red_line' | 'red_sector' | 'body_flash' | 'gas_smoke';
  aiArchetype: 'swarm' | 'flanker' | 'kiter' | 'shield' | 'sniper' | 'charger';
}

export const ENEMY_DATABASE: { [id: number]: EnemyInfo } = {
  1: { id: 1, name: '短棍混混', faction: '街頭混混幫', hp: 40, speed: 110, damage: 10, attackRange: 35, windupTime: 0.35, color: '#a0a0a0', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'swarm' },
  2: { id: 2, name: '彈簧刀扒手', faction: '街頭混混幫', hp: 32, speed: 150, damage: 14, attackRange: 40, windupTime: 0.28, color: '#707070', attackType: 'pounce', tellType: 'body_flash', aiArchetype: 'flanker' },
  3: { id: 3, name: '鐵鍊流氓', faction: '街頭混混幫', hp: 55, speed: 90, damage: 12, attackRange: 55, windupTime: 0.45, color: '#888888', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'swarm' },
  4: { id: 4, name: '碎酒瓶暴徒', faction: '街頭混混幫', hp: 38, speed: 125, damage: 11, attackRange: 30, windupTime: 0.3, color: '#556b2f', attackType: 'melee_slash', tellType: 'body_flash', aiArchetype: 'flanker' },
  5: { id: 5, name: '高台投石飛賊', faction: '街頭混混幫', hp: 30, speed: 85, damage: 8, attackRange: 200, windupTime: 0.5, color: '#8b4513', attackType: 'shoot_bullet', tellType: 'yellow_exclamation', aiArchetype: 'kiter' },
  
  6: { id: 6, name: '截短霰彈水手', faction: '碼頭走私幫', hp: 60, speed: 95, damage: 24, attackRange: 130, windupTime: 0.45, color: '#1e3f66', attackType: 'buckshot', tellType: 'red_sector', aiArchetype: 'charger' },
  7: { id: 7, name: '魚叉投擲手', faction: '碼頭走私幫', hp: 45, speed: 105, damage: 15, attackRange: 180, windupTime: 0.4, color: '#2e5b88', attackType: 'shoot_bullet', tellType: 'red_line', aiArchetype: 'sniper' },
  8: { id: 8, name: '重錨水手長', faction: '碼頭走私幫', hp: 90, speed: 75, damage: 22, attackRange: 50, windupTime: 0.6, color: '#0d2b45', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'shield' },
  9: { id: 9, name: '滾桶工', faction: '碼頭走私幫', hp: 50, speed: 100, damage: 18, attackRange: 150, windupTime: 0.5, color: '#5c4033', attackType: 'charge', tellType: 'red_line', aiArchetype: 'charger' },
  10: { id: 10, name: '下水道毒蛙', faction: '碼頭走私幫', hp: 28, speed: 120, damage: 10, attackRange: 120, windupTime: 0.35, color: '#2d5a27', attackType: 'shoot_bullet', tellType: 'gas_smoke', aiArchetype: 'kiter' },

  11: { id: 11, name: '噴火工兵', faction: '私酒地下兵工廠', hp: 65, speed: 85, damage: 16, attackRange: 110, windupTime: 0.4, color: '#c0392b', attackType: 'flame_jet', tellType: 'red_sector', aiArchetype: 'charger' },
  12: { id: 12, name: '射釘槍狂徒', faction: '私酒地下兵工廠', hp: 48, speed: 110, damage: 12, attackRange: 160, windupTime: 0.35, color: '#d35400', attackType: 'shoot_bullet', tellType: 'yellow_exclamation', aiArchetype: 'kiter' },
  13: { id: 13, name: '蒸汽背包工', faction: '私酒地下兵工廠', hp: 70, speed: 80, damage: 14, attackRange: 60, windupTime: 0.45, color: '#7f8c8d', attackType: 'flame_jet', tellType: 'gas_smoke', aiArchetype: 'swarm' },
  14: { id: 14, name: '毒氣擲彈兵', faction: '私酒地下兵工廠', hp: 42, speed: 90, damage: 15, attackRange: 190, windupTime: 0.55, color: '#27ae60', attackType: 'toss_molotov', tellType: 'gas_smoke', aiArchetype: 'kiter' },
  15: { id: 15, name: '重型電焊工', faction: '私酒地下兵工廠', hp: 75, speed: 90, damage: 18, attackRange: 45, windupTime: 0.4, color: '#f39c12', attackType: 'melee_slash', tellType: 'body_flash', aiArchetype: 'shield' },

  16: { id: 16, name: '黑西裝左輪槍手', faction: '暗夜秘密賭場', hp: 50, speed: 105, damage: 14, attackRange: 190, windupTime: 0.35, color: '#1a1a1a', attackType: 'shoot_bullet', tellType: 'red_line', aiArchetype: 'sniper' },
  17: { id: 17, name: '雙持衝鋒暴徒', faction: '暗夜秘密賭場', hp: 55, speed: 120, damage: 18, attackRange: 140, windupTime: 0.3, color: '#2c3e50', attackType: 'shoot_bullet', tellType: 'yellow_exclamation', aiArchetype: 'kiter' },
  18: { id: 18, name: '地下拳擊手', faction: '暗夜秘密賭場', hp: 80, speed: 130, damage: 20, attackRange: 35, windupTime: 0.32, color: '#962d2d', attackType: 'charge', tellType: 'red_line', aiArchetype: 'charger' },
  19: { id: 19, name: '飛牌魔術師', faction: '暗夜秘密賭場', hp: 45, speed: 110, damage: 12, attackRange: 170, windupTime: 0.38, color: '#8e44ad', attackType: 'buckshot', tellType: 'red_sector', aiArchetype: 'flanker' },
  20: { id: 20, name: '隱形女刺客', faction: '暗夜秘密賭場', hp: 38, speed: 160, damage: 25, attackRange: 30, windupTime: 0.25, color: '#34495e', attackType: 'pounce', tellType: 'body_flash', aiArchetype: 'flanker' },

  21: { id: 21, name: '防暴重盾憲兵', faction: '腐敗憲兵防暴隊', hp: 110, speed: 70, damage: 15, attackRange: 40, windupTime: 0.5, color: '#2980b9', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'shield' },
  22: { id: 22, name: '催淚瓦斯特警', faction: '腐敗憲兵防暴隊', hp: 60, speed: 95, damage: 12, attackRange: 180, windupTime: 0.45, color: '#16a085', attackType: 'toss_molotov', tellType: 'gas_smoke', aiArchetype: 'kiter' },
  23: { id: 23, name: '紅外狙擊手', faction: '腐敗憲兵防暴隊', hp: 40, speed: 80, damage: 35, attackRange: 260, windupTime: 0.8, color: '#c0392b', attackType: 'sniper_laser', tellType: 'red_line', aiArchetype: 'sniper' },
  24: { id: 24, name: '黑幫杜賓惡犬', faction: '腐敗憲兵防暴隊', hp: 35, speed: 180, damage: 14, attackRange: 35, windupTime: 0.22, color: '#4a235a', attackType: 'pounce', tellType: 'body_flash', aiArchetype: 'swarm' },
  25: { id: 25, name: '偵查無人機', faction: '腐敗憲兵防暴隊', hp: 25, speed: 140, damage: 20, attackRange: 100, windupTime: 0.4, color: '#3498db', attackType: 'charge', tellType: 'red_line', aiArchetype: 'flanker' },

  26: { id: 26, name: '變異鼠群', faction: '地鐵深層墓穴', hp: 20, speed: 165, damage: 8, attackRange: 25, windupTime: 0.2, color: '#3e2723', attackType: 'pounce', tellType: 'body_flash', aiArchetype: 'swarm' },
  27: { id: 27, name: '鐵路鎬斧工', faction: '地鐵深層墓穴', hp: 65, speed: 95, damage: 18, attackRange: 40, windupTime: 0.42, color: '#4e342e', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'flanker' },
  28: { id: 28, name: '重裝鋼板防護員', faction: '地鐵深層墓穴', hp: 130, speed: 65, damage: 22, attackRange: 45, windupTime: 0.55, color: '#37474f', attackType: 'melee_slash', tellType: 'yellow_exclamation', aiArchetype: 'shield' },
  29: { id: 29, name: '毒氣工兵', faction: '地鐵深層墓穴', hp: 45, speed: 90, damage: 10, attackRange: 130, windupTime: 0.4, color: '#1b5e20', attackType: 'flame_jet', tellType: 'gas_smoke', aiArchetype: 'kiter' },

  30: { id: 30, name: '金甲雙槍衛士', faction: '市政廳黑金禁衛軍', hp: 85, speed: 115, damage: 22, attackRange: 180, windupTime: 0.32, color: '#b7950b', attackType: 'shoot_bullet', tellType: 'red_line', aiArchetype: 'kiter' },
  31: { id: 31, name: '皇家防暴大劍士', faction: '市政廳黑金禁衛軍', hp: 140, speed: 90, damage: 28, attackRange: 55, windupTime: 0.4, color: '#7d6608', attackType: 'melee_slash', tellType: 'red_sector', aiArchetype: 'shield' },
  32: { id: 32, name: '自律機槍塔', faction: '市政廳黑金禁衛軍', hp: 120, speed: 0, damage: 16, attackRange: 220, windupTime: 0.45, color: '#212f3d', attackType: 'shoot_bullet', tellType: 'red_line', aiArchetype: 'sniper' }
};

