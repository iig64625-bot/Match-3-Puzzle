namespace Match3.Data
{
    public class GameConfig
    {
        public int BoardWidth { get; set; } = 8;
        public int BoardHeight { get; set; } = 8;
        public int ElementTypes { get; set; } = 4;
        public int MinMatchCount { get; set; } = 3;
        public int BaseScore { get; set; } = 10;
        public int LevelTargetScore { get; set; } = 600;
        public double BombSpawnRate { get; set; } = 0.04;
        public int MaxBoardSize { get; set; } = 10;
        public int MaxElementTypes { get; set; } = 6;
    }
}
