export const PALETTE = {
  Ink: "#1A1410",
  Kraft: "#C4A574",
  KraftDeep: "#8B6914",
  WaxRed: "#9B2D2D",
  WaxGreen: "#2F5D3A",
  StampBlue: "#2C4A6E",
  Bone: "#F3E6C8",
  Soot: "#2A211C",
  Gold: "#D4A017",
};

export const KINDS = [
  { name: "蜡印", fill: PALETTE.WaxRed, ink: PALETTE.Bone },
  { name: "封条", fill: PALETTE.StampBlue, ink: PALETTE.Bone },
  { name: "邮戳", fill: PALETTE.WaxGreen, ink: PALETTE.Bone },
  { name: "封缄", fill: PALETTE.Gold, ink: PALETTE.Ink },
  { name: "标签", fill: PALETTE.KraftDeep, ink: PALETTE.Bone },
  { name: "圆环", fill: PALETTE.Bone, ink: PALETTE.Ink },
];

export const NAMES = ["夜班", "封蜡", "秤砣", "邮差", "油灯", "铜钮", "旧秤", "墨匣"];

export const LAYOUT = {
  W: 390,
  H: 844,
  top: 56,
  boardH: 560,
  slotH: 148,
  tileW: 58,
  tileH: 74,
  tileR: 10,
  item: 44,
};
