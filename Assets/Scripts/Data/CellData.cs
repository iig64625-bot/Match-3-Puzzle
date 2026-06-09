namespace Match3.Data
{
    /// <summary>
    /// 单个格子的只读快照。
    /// </summary>
    public readonly struct CellData
    {
        public GridPos Position { get; }
        public PieceType Type { get; }

        public CellData(GridPos position, PieceType type)
        {
            Position = position;
            Type = type;
        }

        public bool IsEmpty => Type == PieceType.None;
    }
}
