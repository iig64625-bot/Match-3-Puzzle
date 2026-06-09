using System;

namespace Match3.Data
{
    /// <summary>
    /// 棋盘底层数据：二维 PieceType 网格。
    /// </summary>
    public class BoardData
    {
        public int Width { get; }
        public int Height { get; }
        public PieceType[,] Grid { get; }

        public BoardData(int width, int height)
        {
            if (width <= 0 || height <= 0)
                throw new ArgumentOutOfRangeException(nameof(width), "Board dimensions must be positive.");

            Width = width;
            Height = height;
            Grid = new PieceType[width, height];
        }

        public PieceType Get(int x, int y) => Grid[x, y];

        public PieceType Get(GridPos pos) => Get(pos.X, pos.Y);

        public void Set(int x, int y, PieceType type) => Grid[x, y] = type;

        public void Set(GridPos pos, PieceType type) => Set(pos.X, pos.Y, type);

        public bool IsValid(int x, int y) =>
            x >= 0 && x < Width && y >= 0 && y < Height;

        public bool IsValid(GridPos pos) => IsValid(pos.X, pos.Y);

        public BoardData Clone()
        {
            var copy = new BoardData(Width, Height);
            Array.Copy(Grid, copy.Grid, Grid.Length);
            return copy;
        }
    }
}
