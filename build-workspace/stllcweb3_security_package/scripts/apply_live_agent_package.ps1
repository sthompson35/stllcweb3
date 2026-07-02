# Run from the package folder after unzipping.
# Example: powershell -ExecutionPolicy Bypass -File .\scripts\apply_live_agent_package.ps1 -RepoPath C:\stllcweb3

param(
  [string]$RepoPath = "C:\stllcweb3"
)

if (!(Test-Path $RepoPath)) {
  throw "Repo path not found: $RepoPath"
}

$PackageRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Copy-Item -Path "$PackageRoot\src" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\supabase" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\deploy" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\.env.example" -Destination "$RepoPath\.env.example" -Force

Set-Location $RepoPath
npm install @supabase/supabase-js 0xsequence

git status
Write-Host "Live agent + Sequence package applied. Add env values, run Supabase migration/seed, then npm run dev."
