param(
  [string]$RepoPath = "C:\stllcweb3"
)

$ErrorActionPreference = "Stop"
$PackageRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Applying STLLCWeb3 security package to $RepoPath"

Copy-Item -Path "$PackageRoot\src" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\supabase" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\deploy" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\.env.example" -Destination $RepoPath -Force

Write-Host "Installing required runtime packages..."
Push-Location $RepoPath
npm install @supabase/supabase-js 0xsequence ethers openai
Pop-Location

Write-Host "Security package applied. Next: run Supabase migration 002, set env vars, and deploy."
