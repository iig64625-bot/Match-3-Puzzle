using System;
using System.Collections.Generic;
using Match3.Data;

namespace Match3.Gameplay
{
    /// <summary>
    /// AI 演示模式：逐步分析、用户确认后执行，仅负责展示与调度。
    /// </summary>
    public class SolverSystem
    {
        private readonly Game _game;
        private readonly MoveFinder _moveFinder;
        private readonly int _targetScore;

        public SolverSystem(Game game, MoveFinder moveFinder, int? targetScore = null)
        {
            _game = game;
            _moveFinder = moveFinder;
            _targetScore = targetScore ?? game.Config.LevelTargetScore;
        }

        public int TargetScore => _targetScore;

        /// <summary>
        /// 进入 Demo 模式：每步分析 → 等待确认 → 执行 → 展示结果，循环直至结束或用户退出。
        /// </summary>
        public SolverResult RunDemo(
            Action<string> write,
            Func<bool> waitForConfirm,
            Action? renderBoard = null)
        {
            var steps = new List<SolverStep>();

            if (_game.State != GameStateType.Playing)
                return Finish(write, steps, SolverStopReason.GameOver);

            if (IsTargetReached())
                return FinishLevelComplete(write, steps);

            while (_game.State == GameStateType.Playing)
            {
                if (IsTargetReached())
                    return FinishLevelComplete(write, steps);

                renderBoard?.Invoke();

                var moves = _moveFinder.FindAllValidMoves();
                var best = _moveFinder.FindBestMove();

                if (!best.HasValue || moves.Count == 0)
                    return FinishNoValidMoves(write, steps);

                var stepNumber = steps.Count + 1;
                ShowStepAnalysis(write, stepNumber, moves.Count, best.Value);

                if (!waitForConfirm())
                    return Finish(write, steps, SolverStopReason.UserCancelled);

                var totalBefore = _game.TotalScore;
                var levelBefore = _game.Level;

                if (!_game.TrySwap(best.Value.From, best.Value.To))
                    return FinishNoValidMoves(write, steps);

                var pointsGained = _game.TotalScore - totalBefore;
                ShowStepResult(write, pointsGained);
                steps.Add(new SolverStep(
                    stepNumber,
                    best.Value,
                    pointsGained,
                    _game.Score,
                    _game.TotalScore,
                    _game.Level));

                write("");

                if (_game.Level > levelBefore || IsTargetReached())
                    return FinishLevelComplete(write, steps);

                if (_game.State == GameStateType.GameOver)
                    return FinishNoValidMoves(write, steps);
            }

            return FinishNoValidMoves(write, steps);
        }

        private bool IsTargetReached() => _game.Score >= _targetScore;

        private int EstimateScore(MoveData move) =>
            move.EstimatedMatchCount * _game.Config.BaseScore;

        private static string FormatPos(GridPos pos) => $"({pos.X},{pos.Y})";

        private void ShowStepAnalysis(Action<string> write, int stepNumber, int moveCount, MoveData best)
        {
            write("");
            write("---");
            write("");
            write($"## AI Solver Demo  ·  Step {stepNumber}");
            write("");
            write("当前棋盘分析中...");
            write("");
            write($"发现 {moveCount} 个合法移动");
            write("");
            write("最佳移动：");
            write($"{FormatPos(best.From)} ↔ {FormatPos(best.To)}");
            write("");
            write("预计消除：");
            write($"{best.EstimatedMatchCount} 个");
            write("");
            write("预计得分：");
            write($"{EstimateScore(best)}");
            write("");
            write("---");
        }

        public static void ShowDemoPrompt(Action<string> write)
        {
            write("按 Enter 执行此步");
            write("按 q 退出 Demo");
            write("-----------");
        }

        private void ShowStepResult(Action<string> write, int pointsGained)
        {
            write("Match");
            write("↓");
            write("Destroy");
            write("↓");
            write("Drop");
            write("↓");
            write("Spawn");
            write("");
            write("本步获得：");
            write($"{pointsGained} 分");
            write("");
            write("当前总分：");
            write($"{_game.Score} / {_game.Config.LevelTargetScore}");
        }

        private SolverResult FinishLevelComplete(Action<string> write, List<SolverStep> steps)
        {
            write("");
            write("---");
            write("");
            write("Level Complete");
            write("AI Solver 完成关卡");
            write($"总步数：{steps.Count}");
            write($"最终得分：{_game.TotalScore}");
            write("");
            write("---");
            write("");

            return BuildResult(steps, SolverStopReason.TargetScoreReached);
        }

        private SolverResult FinishNoValidMoves(Action<string> write, List<SolverStep> steps)
        {
            write("");
            write("---");
            write("");
            write("No Valid Moves");
            write("AI Solver 停止");
            write("");
            write("---");
            write("");

            var reason = _game.State == GameStateType.GameOver
                ? SolverStopReason.GameOver
                : SolverStopReason.NoValidMoves;

            return BuildResult(steps, reason);
        }

        private SolverResult Finish(Action<string> write, List<SolverStep> steps, SolverStopReason reason)
        {
            if (reason == SolverStopReason.UserCancelled)
            {
                write("");
                write("---");
                write("Demo 已退出");
                write($"已完成步数：{steps.Count}");
                write("---");
                write("");
            }

            return BuildResult(steps, reason);
        }

        private SolverResult BuildResult(List<SolverStep> steps, SolverStopReason reason)
        {
            return new SolverResult(
                reason,
                steps,
                _game.Score,
                _game.TotalScore,
                _game.Level,
                _targetScore);
        }
    }
}
