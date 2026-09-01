param(
    [string]$SkillRoot = (Join-Path $PSScriptRoot '..\.agents\skills'),
    [switch]$Force
)

$SkillRoot = (Resolve-Path $SkillRoot).Path
$GlobalRoot = Join-Path $HOME '.agents\skills'

New-Item -ItemType Directory -Force -Path (Split-Path $GlobalRoot) | Out-Null
if (Test-Path $GlobalRoot) {
    if (-not $Force) {
        throw "$GlobalRoot already exists. Remove it or rerun with -Force."
    }
    Remove-Item -LiteralPath $GlobalRoot -Recurse -Force
}
New-Item -ItemType Junction -Path $GlobalRoot -Target $SkillRoot | Out-Null
Write-Output "Global skills installed at $GlobalRoot -> $SkillRoot"
