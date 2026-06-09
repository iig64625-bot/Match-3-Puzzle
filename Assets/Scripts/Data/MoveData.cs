namespace Match3.Data
{
    /// <summary>
    /// 一次合法交换及其预估消除数量。
    /// </summary>
    public readonly struct MoveData
    {
        public GridPos From { get; }
        public GridPos To { get; }
        public int EstimatedMatchCount { get; }

        public MoveData(GridPos from, GridPos to, int estimatedMatchCount)
        {
            From = from;
            To = to;
            EstimatedMatchCount = estimatedMatchCount;
        }

        public override string ToString() =>
            $"{From} -> {To}, 预估消除 {EstimatedMatchCount} 格";
    }
}
