using System;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// 主游戏控制器：关卡目标、难度递进、胜负判定。
    /// </summary>
    public class Game
    {
        private readonly GameConfig _config;
        private readonly Board _board;
        private readonly Matcher _matcher;
        private readonly Eliminator _eliminator;

        public GameStateType State { get; private set; } = GameStateType.Playing;
        public int Score { get; private set; }
        public int Level { get; private set; } = 1;
        public int TotalScore { get; private set; }

        public Board Board => _board;
        public GameConfig Config => _config;

        public Game(GameConfig? config = null, Random? random = null)
        {
            _config = config ?? new GameConfig();
            var rng = random ?? new Random();
            _board = new Board(rng);
            _matcher = new Matcher(_board, _config);
            _eliminator = new Eliminator(_board, _config);
        }

        public void Initialize()
        {
            State = GameStateType.Playing;
            Score = 0;
            Level = 1;
            TotalScore = 0;
            LevelProgression.ApplyToConfig(_config, Level);
            _board.InitializeForLevel(_config, Level);
        }

        public bool TrySwap(GridPos a, GridPos b)
        {
            if (State != GameStateType.Playing)
                return false;

            if (!_board.IsValid(a) || !_board.IsValid(b) || !IsAdjacent(a, b))
                return false;

            if (!PieceTypeHelper.CanSwap(_board.GetPiece(a)) ||
                !PieceTypeHelper.CanSwap(_board.GetPiece(b)))
                return false;

            _board.Swap(a, b);

            if (_matcher.FindAllMatches().Count == 0)
            {
                _board.Swap(a, b);
                return false;
            }

            State = GameStateType.Processing;
            ProcessTurn();
            return true;
        }

        private void ProcessTurn()
        {
            while (true)
            {
                var matches = _matcher.FindAllMatches();
                if (matches.Count == 0)
                    break;

                var points = _eliminator.ProcessMatches(matches);
                AddScore(points);

                if (State == GameStateType.LevelComplete)
                    return;
            }

            if (Score >= _config.LevelTargetScore)
            {
                CompleteLevel();
                return;
            }

            if (!_matcher.HasValidMoves())
            {
                State = GameStateType.GameOver;
                return;
            }

            State = GameStateType.Playing;
        }

        private void AddScore(int points)
        {
            Score += points;
            TotalScore += points;

            if (Score >= _config.LevelTargetScore)
                CompleteLevel();
        }

        private void CompleteLevel()
        {
            State = GameStateType.LevelComplete;
            Level++;
            Score = 0;
            LevelProgression.ApplyToConfig(_config, Level);
            _board.InitializeForLevel(_config, Level);
            State = GameStateType.Playing;
        }

        private static bool IsAdjacent(GridPos a, GridPos b)
        {
            var dx = Math.Abs(a.X - b.X);
            var dy = Math.Abs(a.Y - b.Y);
            return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
        }
    }
}
