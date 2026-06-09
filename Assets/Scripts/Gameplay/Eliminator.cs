using System.Collections.Generic;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// 消除 → 炸弹范围 → 相邻冰块 → 下落 → 填充。
    /// </summary>
    public class Eliminator
    {
        private readonly Board _board;
        private readonly GameConfig _config;

        public Eliminator(Board board, GameConfig config)
        {
            _board = board;
            _config = config;
        }

        public int ProcessMatches(HashSet<GridPos> matches)
        {
            if (matches.Count == 0)
                return 0;

            var toClear = ExpandClears(matches);

            foreach (var pos in toClear)
                _board.ClearCell(pos);

            _board.ApplyGravity();
            _board.FillEmpty();

            return toClear.Count * _config.BaseScore;
        }

        private HashSet<GridPos> ExpandClears(HashSet<GridPos> matches)
        {
            var toClear = new HashSet<GridPos>(matches);

            foreach (var pos in matches)
            {
                if (_board.GetPiece(pos) == PieceType.Bomb)
                    AddBombBlast(toClear, pos);
            }

            AddAdjacentIce(toClear, matches);
            return toClear;
        }

        private void AddBombBlast(HashSet<GridPos> toClear, GridPos center)
        {
            for (var dy = -1; dy <= 1; dy++)
            {
                for (var dx = -1; dx <= 1; dx++)
                {
                    var pos = new GridPos(center.X + dx, center.Y + dy);
                    if (_board.IsValid(pos))
                        toClear.Add(pos);
                }
            }
        }

        private void AddAdjacentIce(HashSet<GridPos> toClear, HashSet<GridPos> matches)
        {
            foreach (var pos in matches)
            {
                TryAddIceNeighbor(toClear, new GridPos(pos.X + 1, pos.Y));
                TryAddIceNeighbor(toClear, new GridPos(pos.X - 1, pos.Y));
                TryAddIceNeighbor(toClear, new GridPos(pos.X, pos.Y + 1));
                TryAddIceNeighbor(toClear, new GridPos(pos.X, pos.Y - 1));
            }
        }

        private void TryAddIceNeighbor(HashSet<GridPos> toClear, GridPos pos)
        {
            if (_board.IsValid(pos) && _board.GetPiece(pos) == PieceType.Ice)
                toClear.Add(pos);
        }
    }
}
