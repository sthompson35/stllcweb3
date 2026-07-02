param(
  [string]$RepoPath = "C:\stllcweb3"
)

$ErrorActionPreference = "Stop"
$PackageRoot = Split-Path -Parent $PSScriptRoot

if (!(Test-Path $RepoPath)) {
  throw "Repo path not found: $RepoPath"
}

Write-Host "Applying STLLCWeb3 onboarding package to $RepoPath"

Copy-Item -Path "$PackageRoot\src" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\supabase" -Destination $RepoPath -Recurse -Force
Copy-Item -Path "$PackageRoot\ARCHITECT_IMPLEMENTATION_ORDER.md" -Destination "$RepoPath\ARCHITECT_ONBOARDING_IMPLEMENTATION_ORDER.md" -Force
Copy-Item -Path "$PackageRoot\ARCHITECT_NEXT_COMMAND.md" -Destination "$RepoPath\ARCHITECT_NEXT_COMMAND.md" -Force

Push-Location $RepoPath
npm install @supabase/supabase-js
Pop-Location

Write-Host "Onboarding package applied. Next: run Supabase migration 003 and test /onboarding + /deal-room."
