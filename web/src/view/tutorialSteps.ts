export interface TutorialStep {
  title: string;
  body: string;
  tips?: string[];
  /** 阅读后需用户实际操作；弹窗自动隐藏，完成后进入下一步 */
  practice?: "swap" | "hint" | "auto";
  practiceHint?: string;
  /** 操作错误时的补充指导（仅 swap 等需校验成功的步骤） */
  practiceRetry?: {
    title: string;
    body: string;
    tips?: string[];
  };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "欢迎来到 RuneMind",
    body: "三消益智小游戏：交换相邻符文，同色连成 3 个及以上即可消除得分。",
    tips: ["类似开心消消乐", "打开即玩"],
  },
  {
    title: "试试交换",
    body: "先点一个格子，再点相邻（上下左右）的格子完成交换。",
    tips: ["只能交换相邻格", "对角线不行", "交换后要能形成三连"],
    practice: "swap",
    practiceHint: "请在棋盘上交换两个相邻符文",
    practiceRetry: {
      title: "没关系，再试一次",
      body: "这次交换无法形成三连，棋子已自动换回。请换另一对相邻格子，确保交换后同色能连成横排或竖排。",
      tips: ["必须选上下左右相邻的格子", "冰块不能交换", "提示：找两个同色符文，中间隔一个不同色"],
    },
  },
  {
    title: "消除规则",
    body: "形成横/竖三连会消除并加分；无法三连的交换会自动换回，不扣分。",
    tips: ["消除后上方符文下落", "可触发连锁连击"],
  },
  {
    title: "顶部信息",
    body: "顶部显示关卡、棋盘大小、符文种类、本关目标分与累计总分。",
    tips: ["目标分达标即过关", "关卡越高难度越大"],
  },
  {
    title: "炸弹 💣",
    body: "炸弹可交换；参与消除时引爆周围 3×3，有专属爆炸音效与震动。",
    tips: ["留意棋盘上的炸弹", "适合快速冲分"],
  },
  {
    title: "冰块 🧊",
    body: "冰块不能交换、不能三连；相邻符文被消除时才会碎裂。",
    tips: ["先清冰块旁边的符文"],
  },
  {
    title: "连锁连击",
    body: "消除后若新落下符文又形成三连，会连续消除，连击越高分越多。",
    tips: ["留意连击飘字与分数弹跳"],
  },
  {
    title: "过关与结束",
    body: "达到目标分过关；若无任何有效交换则游戏结束，记录最高分。",
    tips: ["过关后棋盘会变大", "善用提示避免无路可走"],
  },
  {
    title: "试试提示按钮",
    body: "不确定下一步？点击下方「提示」按钮，系统会高亮推荐交换。",
    tips: ["也可使用「自动」走一步", "「重来」从第 1 关重启"],
    practice: "hint",
    practiceHint: "请点击底部「提示」按钮",
  },
  {
    title: "准备开始！",
    body: "教程完成！随时点右上角 📖 可重新查看。",
    tips: ["祝游戏愉快"],
  },
];
