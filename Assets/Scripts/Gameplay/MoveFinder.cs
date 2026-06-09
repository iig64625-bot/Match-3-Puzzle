using System.Collections.Generic;
using System.Linq;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// 扫描棋盘所有合法交换，供 Hint 与 AutoPlayer 使用。
    /// 通过快照模拟，不修改原棋盘状态。
    /// </summary>
    public class MoveFinder
    {
        private readonly Board _board;
        private readonly GameConfig _config;

        public MoveFinder(Board board, GameConfig config)
        {
            _board = board;
            _config = config;
        }

        /// <summary>
        /// 扫描整个棋盘，返回所有合法交换（每对相邻格只出现一次）。
        /// </summary>
        public List<MoveData> FindAllValidMoves()
        {
            var moves = new List<MoveData>();

            for (var x = 0; x < _board.Width; x++)
            {
                for (var y = 0; y < _board.Height; y++)
                {
                    var from = new GridPos(x, y);

                    if (x + 1 < _board.Width)
                        TryAddMove(moves, from, new GridPos(x + 1, y));

                    if (y + 1 < _board.Height)
                        TryAddMove(moves, from, new GridPos(x, y + 1));
                }
            }

            return moves;
        }

        /// <summary>
        /// 返回预估消除格数最多的交换，供 Hint / AutoPlayer 使用。
        /// </summary>
        public MoveData? FindBestMove()
        {
            var moves = FindAllValidMoves();
            if (moves.Count == 0)
                return null;

            return moves.OrderByDescending(m => m.EstimatedMatchCount).First();
        }

        private void TryAddMove(List<MoveData> moves, GridPos from, GridPos to)
        {
            var matchCount = EstimateMatchCount(from, to);
            if (matchCount > 0)
                moves.Add(new MoveData(from, to, matchCount));
        }

        private int EstimateMatchCount(GridPos from, GridPos to)
        {
            var snapshot = _board.CreateSnapshot();
            snapshot.Swap(from, to);

            var matcher = new Matcher(snapshot, _config);
            return matcher.FindAllMatches().Count;
        }
    }
}
