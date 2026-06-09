using System.Collections.Generic;

namespace Match3.Data
{
    public enum SolverStopReason
    {
        TargetScoreReached,
        NoValidMoves,
        GameOver,
        UserCancelled
    }

    public readonly struct SolverStep
    {
        public int StepNumber { get; }
        public MoveData Move { get; }
        public int PointsGained { get; }
        public int Score { get; }
        public int TotalScore { get; }
        public int Level { get; }

        public SolverStep(
            int stepNumber,
            MoveData move,
            int pointsGained,
            int score,
            int totalScore,
            int level)
        {
            StepNumber = stepNumber;
            Move = move;
            PointsGained = pointsGained;
            Score = score;
            TotalScore = totalScore;
            Level = level;
        }
    }

    public class SolverResult
    {
        public SolverStopReason Reason { get; }
        public IReadOnlyList<SolverStep> Steps { get; }
        public int FinalScore { get; }
        public int FinalTotalScore { get; }
        public int FinalLevel { get; }
        public int TargetScore { get; }

        public SolverResult(
            SolverStopReason reason,
            IReadOnlyList<SolverStep> steps,
            int finalScore,
            int finalTotalScore,
            int finalLevel,
            int targetScore)
        {
            Reason = reason;
            Steps = steps;
            FinalScore = finalScore;
            FinalTotalScore = finalTotalScore;
            FinalLevel = finalLevel;
            TargetScore = targetScore;
        }
    }
}
