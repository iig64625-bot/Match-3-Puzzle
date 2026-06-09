using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Match3.Data
{
    /// <summary>
    /// 本地排行榜：持久化最高分 Top N。
    /// </summary>
    public class HighScoreStore
    {
        private const int MaxEntries = 5;
        private readonly string _filePath;

        public HighScoreStore(string? filePath = null)
        {
            _filePath = filePath ?? Path.Combine(AppContext.BaseDirectory, "highscores.txt");
        }

        public IReadOnlyList<HighScoreEntry> Load()
        {
            if (!File.Exists(_filePath))
                return Array.Empty<HighScoreEntry>();

            var entries = new List<HighScoreEntry>();
            foreach (var line in File.ReadAllLines(_filePath))
            {
                if (TryParse(line, out var entry))
                    entries.Add(entry);
            }

            return entries
                .OrderByDescending(e => e.Score)
                .ThenByDescending(e => e.Level)
                .Take(MaxEntries)
                .ToList();
        }

        public void TryAdd(int score, int level)
        {
            var entries = Load().ToList();
            entries.Add(new HighScoreEntry(score, level, DateTime.Now));
            entries = entries
                .OrderByDescending(e => e.Score)
                .ThenByDescending(e => e.Level)
                .Take(MaxEntries)
                .ToList();

            File.WriteAllLines(_filePath, entries.Select(Format));
        }

        private static bool TryParse(string line, out HighScoreEntry entry)
        {
            entry = default!;
            var parts = line.Split('|');
            if (parts.Length < 3)
                return false;

            if (!int.TryParse(parts[0], out var score))
                return false;
            if (!int.TryParse(parts[1], out var level))
                return false;
            if (!DateTime.TryParse(parts[2], out var date))
                date = DateTime.MinValue;

            entry = new HighScoreEntry(score, level, date);
            return true;
        }

        private static string Format(HighScoreEntry entry) =>
            $"{entry.Score}|{entry.Level}|{entry.Date:O}";
    }

    public readonly struct HighScoreEntry
    {
        public int Score { get; }
        public int Level { get; }
        public DateTime Date { get; }

        public HighScoreEntry(int score, int level, DateTime date)
        {
            Score = score;
            Level = level;
            Date = date;
        }
    }
}
