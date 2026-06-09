using System.Collections.Generic;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// 匹配检测：符文/炸弹可匹配，冰块不参与颜色匹配。
    /// </summary>
    public class Matcher
    {
        private readonly Board _board;
        private readonly GameConfig _config;

        public Matcher(Board board, GameConfig config)
        {
            _board = board;
            _config = config;
        }

        public HashSet<GridPos> FindAllMatches()
        {
            var matches = new HashSet<GridPos>();

            for (var y = 0; y < _board.Height; y++)
            {
                for (var x = 0; x < _board.Width; x++)
                {
                    foreach (var pos in GetHorizontalMatch(x, y))
                        matches.Add(pos);
                }
            }

            for (var x = 0; x < _board.Width; x++)
            {
                for (var y = 0; y < _board.Height; y++)
                {
                    foreach (var pos in GetVerticalMatch(x, y))
                        matches.Add(pos);
                }
            }

            return matches;
        }

        public bool HasValidMoves()
        {
            for (var x = 0; x < _board.Width; x++)
            {
                for (var y = 0; y < _board.Height; y++)
                {
                    var pos = new GridPos(x, y);
                    if (!PieceTypeHelper.CanSwap(_board.GetPiece(pos)))
                        continue;

                    if (x + 1 < _board.Width)
                    {
                        var right = new GridPos(x + 1, y);
                        if (PieceTypeHelper.CanSwap(_board.GetPiece(right)) &&
                            WouldMatchAfterSwap(pos, right))
                            return true;
                    }

                    if (y + 1 < _board.Height)
                    {
                        var down = new GridPos(x, y + 1);
                        if (PieceTypeHelper.CanSwap(_board.GetPiece(down)) &&
                            WouldMatchAfterSwap(pos, down))
                            return true;
                    }
                }
            }

            return false;
        }

        private bool WouldMatchAfterSwap(GridPos a, GridPos b)
        {
            _board.Swap(a, b);
            var hasMatch = FindAllMatches().Count > 0;
            _board.Swap(a, b);
            return hasMatch;
        }

        private List<GridPos> GetHorizontalMatch(int x, int y)
        {
            var result = new List<GridPos> { new GridPos(x, y) };
            var type = _board.GetPiece(new GridPos(x, y));
            if (!PieceTypeHelper.IsMatchable(type))
                return new List<GridPos>();

            for (var i = x + 1; i < _board.Width; i++)
            {
                if (_board.GetPiece(new GridPos(i, y)) == type)
                    result.Add(new GridPos(i, y));
                else
                    break;
            }

            return result.Count >= _config.MinMatchCount ? result : new List<GridPos>();
        }

        private List<GridPos> GetVerticalMatch(int x, int y)
        {
            var result = new List<GridPos> { new GridPos(x, y) };
            var type = _board.GetPiece(new GridPos(x, y));
            if (!PieceTypeHelper.IsMatchable(type))
                return new List<GridPos>();

            for (var i = y + 1; i < _board.Height; i++)
            {
                if (_board.GetPiece(new GridPos(x, i)) == type)
                    result.Add(new GridPos(x, i));
                else
                    break;
            }

            return result.Count >= _config.MinMatchCount ? result : new List<GridPos>();
        }
    }
}
