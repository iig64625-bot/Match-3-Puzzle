# 推送代码到 GitHub 并提示开启 Pages
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$remote = "https://github.com/iig64625-bot/Match-3-Puzzle.git"

if (-not (git remote get-url origin 2>$null)) {
    git remote add origin $remote
}

Write-Host "Pushing to $remote ..."
git push -u origin main

Write-Host ""
Write-Host "Push 成功后，请到 GitHub 开启 Pages："
Write-Host "  Settings -> Pages -> Source -> GitHub Actions"
Write-Host ""
Write-Host "Demo 地址："
Write-Host "  https://iig64625-bot.github.io/Match-3-Puzzle/"
