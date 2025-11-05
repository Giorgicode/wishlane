# Encode a file to base64 suitable for storing as a GitHub secret
# Usage: .\scripts\encode-secret.ps1 -Path "app/google-services.json"
param(
  [Parameter(Mandatory=$true)]
  [string]$Path
)

if (-Not (Test-Path $Path)) {
  Write-Error "File not found: $Path"
  exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($Path)
$b64 = [Convert]::ToBase64String($bytes)
Write-Output $b64
