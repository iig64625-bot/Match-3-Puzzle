using System;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// 难度递进：关卡越高，元素种类越多、棋盘越大、目标分数越高。
    /// </summary>
    public static class LevelProgression
    {
        public static void ApplyToConfig(GameConfig config, int level)
        {
            config.ElementTypes = Math.Min(
                3 + (level - 1) / 2,
                config.MaxElementTypes);

            var size = Math.Min(
                6 + (level - 1) / 2,
                config.MaxBoardSize);

            config.BoardWidth = size;
            config.BoardHeight = size;
            config.LevelTargetScore = 400 + level * 350;
        }

        public static int IceCountForLevel(int level) =>
            Math.Min(2 + level / 2, 14);
    }
}
