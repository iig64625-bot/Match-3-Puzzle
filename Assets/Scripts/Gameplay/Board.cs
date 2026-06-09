using System;
using System.Collections.Generic;
using Match3.Data;

namespace Match3.Gameplay
{
    public class Board
    {
        private readonly Random _random;
        private GameConfig _config = new();

        public BoardData Data { get; private set; } = new BoardData(1, 1);

        public Board(Random? random = null)
        {
            _random = random ?? new Random();
        }

        public int Width => Data.Width;
        public int Height => Data.Height;

        public void Initialize(GameConfig config) =>
            InitializeForLevel(config, 1);

        public void InitializeForLevel(GameConfig config, int level)
        {
            _config = config;
            Data = new BoardData(config.BoardWidth, config.BoardHeight);
            FillAllRandom();
            RemoveInitialMatches();
            PlaceIceCells(LevelProgression.IceCountForLevel(level));
        }

        public PieceType GetPiece(GridPos pos) => Data.Get(pos);
        public CellData GetCell(GridPos pos) => new CellData(pos, GetPiece(pos));
        public void SetPiece(GridPos pos, PieceType type) => Data.Set(pos, type);
        public void ClearCell(GridPos pos) => SetPiece(pos, PieceType.None);
        public bool IsValid(GridPos pos) => Data.IsValid(pos);

        public Board CreateSnapshot()
        {
            var snapshot = new Board(_random);
            snapshot.LoadSnapshot(Data.Clone(), _config);
            return snapshot;
        }

        private void LoadSnapshot(BoardData data, GameConfig config)
        {
            _config = config;
            Data = data;
        }

        public void Swap(GridPos a, GridPos b)
        {
            var temp = GetPiece(a);
            SetPiece(a, GetPiece(b));
            SetPiece(b, temp);
        }

        public void ApplyGravity()
        {
            for (var x = 0; x < Width; x++)
            {
                var writeY = Height - 1;
                for (var y = Height - 1; y >= 0; y--)
                {
                    var pos = new GridPos(x, y);
                    var piece = GetPiece(pos);
                    if (piece == PieceType.None)
                        continue;

                    if (y != writeY)
                    {
                        SetPiece(new GridPos(x, writeY), piece);
                        SetPiece(pos, PieceType.None);
                    }
                    writeY--;
                }
            }
        }

        public void FillEmpty()
        {
            for (var x = 0; x < Width; x++)
            {
                for (var y = 0; y < Height; y++)
                {
                    var pos = new GridPos(x, y);
                    if (GetPiece(pos) == PieceType.None)
                        SetPiece(pos, RollSpawnType());
                }
            }
        }

        public void PlaceIceCells(int count)
        {
            var candidates = new List<GridPos>();
            for (var y = 0; y < Height; y++)
            {
                for (var x = 0; x < Width; x++)
                {
                    var pos = new GridPos(x, y);
                    if (GetPiece(pos) != PieceType.Ice)
                        candidates.Add(pos);
                }
            }

            Shuffle(candidates);
            var place = Math.Min(count, candidates.Count);
            for (var i = 0; i < place; i++)
                SetPiece(candidates[i], PieceType.Ice);
        }

        private void FillAllRandom()
        {
            for (var x = 0; x < Width; x++)
            {
                for (var y = 0; y < Height; y++)
                    SetPiece(new GridPos(x, y), RollSpawnType());
            }
        }

        private PieceType RollSpawnType()
        {
            if (_random.NextDouble() < _config.BombSpawnRate)
                return PieceType.Bomb;
            return GetRandomRune();
        }

        private PieceType GetRandomRune() =>
            (PieceType)_random.Next(0, _config.ElementTypes);

        private void RemoveInitialMatches()
        {
            var matcher = new Matcher(this, _config);
            var safety = Width * Height * 10;

            while (matcher.FindAllMatches().Count > 0 && safety-- > 0)
            {
                foreach (var pos in matcher.FindAllMatches())
                    SetPiece(pos, GetRandomRune());
            }
        }

        private void Shuffle<T>(IList<T> list)
        {
            for (var i = list.Count - 1; i > 0; i--)
            {
                var j = _random.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}