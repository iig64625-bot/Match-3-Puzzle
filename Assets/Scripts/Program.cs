using System;
using Match3.Data;
using Match3.Gameplay;

namespace Match3
{
    internal static class Program
    {
        private static readonly HighScoreStore HighScores = new();

        private static void Main()
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.WriteLine("=== RuneMind Match-3 ===");
            Console.WriteLine("交换相邻格子: 列x 行y 列x 行y   h=提示  a=自动  s=Solver  r=排行榜  q=退出");
            Console.WriteLine("目标: 达到关卡分数通关 | 炸弹=B 消除时爆炸 | 冰块=# 不可交换，邻格消除时碎裂\n");

            var game = new Game();
            game.Initialize();
            var moveFinder = new MoveFinder(game.Board, game.Config);
            var solver = new SolverSystem(game, moveFinder);

            while (game.State != GameStateType.GameOver)
            {
                RenderBoard(game);
                Console.WriteLine(
                    $"关卡 {game.Level}  分数 {game.Score}/{game.Config.LevelTargetScore}  " +
                    $"棋盘 {game.Board.Width}x{game.Board.Height}  " +
                    $"元素 {game.Config.ElementTypes}  总分 {game.TotalScore}");
                Console.Write("> ");

                var input = Console.ReadLine()?.Trim();
                if (string.IsNullOrEmpty(input))
                    continue;

                if (input.Equals("q", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("退出游戏。");
                    return;
                }

                if (input.Equals("r", StringComparison.OrdinalIgnoreCase))
                {
                    ShowLeaderboard();
                    continue;
                }

                if (input.Equals("h", StringComparison.OrdinalIgnoreCase))
                {
                    ShowHint(moveFinder);
                    continue;
                }

                if (input.Equals("a", StringComparison.OrdinalIgnoreCase))
                {
                    if (!TryAutoPlay(game, moveFinder))
                        Console.WriteLine("没有合法交换。\n");
                    else
                        RefreshMoveFinder(game, ref moveFinder);
                    continue;
                }

                if (input.Equals("s", StringComparison.OrdinalIgnoreCase))
                {
                    RunSolver(game, solver);
                    continue;
                }

                if (!TryParseSwap(input, out var a, out var b))
                {
                    Console.WriteLine("格式错误，例如: 2 1 3 1\n");
                    continue;
                }

                if (!game.TrySwap(a, b))
                    Console.WriteLine("无效交换（冰块/不相邻/无匹配）。\n");
                else
                    RefreshMoveFinder(game, ref moveFinder);
            }

            RenderBoard(game);
            HighScores.TryAdd(game.TotalScore, game.Level);
            Console.WriteLine($"\n游戏结束！总分 {game.TotalScore}，到达关卡 {game.Level}");
            ShowLeaderboard();
        }

        private static void RefreshMoveFinder(Game game, ref MoveFinder moveFinder) =>
            moveFinder = new MoveFinder(game.Board, game.Config);

        private static void ShowLeaderboard()
        {
            Console.WriteLine("\n--- 排行榜 Top 5 ---");
            var entries = HighScores.Load();
            if (entries.Count == 0)
            {
                Console.WriteLine("（暂无记录）");
            }
            else
            {
                var rank = 1;
                foreach (var entry in entries)
                    Console.WriteLine($"{rank++}. 分数 {entry.Score}  关卡 {entry.Level}  {entry.Date:yyyy-MM-dd}");
            }
            Console.WriteLine();
        }

        private static void ShowHint(MoveFinder moveFinder)
        {
            var hint = moveFinder.FindBestMove();
            if (!hint.HasValue)
            {
                Console.WriteLine("没有合法交换。\n");
                return;
            }

            var move = hint.Value;
            Console.WriteLine(
                $"提示: 交换 {FormatPos(move.From)} ↔ {FormatPos(move.To)}，" +
                $"预估消除 {move.EstimatedMatchCount} 格");
            Console.WriteLine($"输入: {move.From.X} {move.From.Y} {move.To.X} {move.To.Y}\n");
        }

        private static bool TryAutoPlay(Game game, MoveFinder moveFinder)
        {
            var best = moveFinder.FindBestMove();
            if (!best.HasValue)
                return false;

            var move = best.Value;
            Console.WriteLine($"自动交换 {FormatPos(move.From)} ↔ {FormatPos(move.To)}");
            return game.TrySwap(move.From, move.To);
        }

        private static void RunSolver(Game game, SolverSystem solver)
        {
            solver.RunDemo(Console.WriteLine, WaitForDemoConfirm, () => RenderBoard(game));
        }

        private static bool WaitForDemoConfirm()
        {
            SolverSystem.ShowDemoPrompt(Console.WriteLine);
            var input = Console.ReadLine()?.Trim() ?? "";
            return !input.Equals("q", StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatPos(GridPos pos) => $"({pos.X},{pos.Y})";

        private static bool TryParseSwap(string input, out GridPos a, out GridPos b)
        {
            a = default;
            b = default;

            var parts = input.Split(new[] { ' ', ',', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 4)
                return false;

            if (!int.TryParse(parts[0], out var x1) ||
                !int.TryParse(parts[1], out var y1) ||
                !int.TryParse(parts[2], out var x2) ||
                !int.TryParse(parts[3], out var y2))
                return false;

            a = new GridPos(x1, y1);
            b = new GridPos(x2, y2);
            return true;
        }

        private const int CellWidth = 3;

        private static void RenderBoard(Game game)
        {
            var board = game.Board;
            var labelWidth = Math.Max(
                Math.Max((board.Width - 1).ToString().Length, (board.Height - 1).ToString().Length),
                1);

            var gutter = labelWidth + 1;

            Console.Write(new string(' ', gutter));
            for (var x = 0; x < board.Width; x++)
                WriteCentered(x.ToString(), CellWidth);
            Console.WriteLine();

            for (var y = 0; y < board.Height; y++)
            {
                WriteCentered(y.ToString(), labelWidth);
                Console.Write(' ');

                for (var x = 0; x < board.Width; x++)
                    WriteCell(board.GetPiece(new GridPos(x, y)));

                Console.WriteLine();
            }
        }

        private static void WriteCentered(string text, int width)
        {
            if (text.Length >= width)
            {
                Console.Write(text.Substring(0, width));
                return;
            }

            var pad = width - text.Length;
            var left = pad / 2;
            var right = pad - left;
            Console.Write(new string(' ', left));
            Console.Write(text);
            Console.Write(new string(' ', right));
        }

        private static void WriteCell(PieceType type)
        {
            var (symbol, color) = type switch
            {
                PieceType.Fire => ('F', ConsoleColor.Red),
                PieceType.Water => ('W', ConsoleColor.Blue),
                PieceType.Nature => ('N', ConsoleColor.Green),
                PieceType.Lightning => ('L', ConsoleColor.Yellow),
                PieceType.Light => ('I', ConsoleColor.White),
                PieceType.Shadow => ('S', ConsoleColor.Magenta),
                PieceType.Bomb => ('B', ConsoleColor.DarkRed),
                PieceType.Ice => ('#', ConsoleColor.Cyan),
                _ => ('.', ConsoleColor.DarkGray)
            };

            var pad = CellWidth - 1;
            var left = pad / 2;
            var right = pad - left;

            Console.Write(new string(' ', left));
            Console.ForegroundColor = color;
            Console.Write(symbol);
            Console.ResetColor();
            Console.Write(new string(' ', right));
        }
    }
}
