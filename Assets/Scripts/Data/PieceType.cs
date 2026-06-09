namespace Match3.Data
{
    /// <summary>
    /// 棋盘符文类型。None 表示空格。
    /// </summary>
    public enum PieceType
    {
        None = -1,
        Fire = 0,
        Water = 1,
        Nature = 2,
        Lightning = 3,
        Light = 4,
        Shadow = 5,
        Bomb = 6,
        Ice = 7
    }

    public static class PieceTypeHelper
    {
        public static bool IsRune(PieceType type) =>
            type >= PieceType.Fire && type <= PieceType.Shadow;

        public static bool IsMatchable(PieceType type) => IsRune(type) || type == PieceType.Bomb;

        public static bool CanSwap(PieceType type) =>
            type != PieceType.None && type != PieceType.Ice;
    }
}
