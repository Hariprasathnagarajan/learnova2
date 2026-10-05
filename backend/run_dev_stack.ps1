<#
.SYNOPSIS
  Starts the local verification stack: Razorpay gateway stub + Django API.

.DESCRIPTION
  The e2e suite talks to a live HTTP server, so it can only verify code that is
  actually loaded. This script guarantees a known-good pair of processes and
  waits until the health endpoint reports the database is reachable.

  Point tests_e2e.py at a gateway stub so the payment signature check can be
  exercised for real without live Razorpay credentials.

.PARAMETER Gateway
  'stub'  - run against the local stub, so a correctly signed payment succeeds (default)
  'none'  - run with no Razorpay credentials, to verify the API refuses to
            create orders rather than simulating one

.EXAMPLE
  .\run_dev_stack.ps1
  .\run_dev_stack.ps1 -Gateway none
#>
[CmdletBinding()]
param(
  [ValidateSet('stub', 'none')]
  [string]$Gateway = 'stub',
  [int]$Port = 8000,
  [int]$StubPort = 8001
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $env:TEMP 'learnova-stack'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Stop-Port {
  param([int]$Port)
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Wait-Healthy {
  param([string]$Url, [int]$Attempts = 30)
  for ($i = 0; $i -lt $Attempts; $i++) {
    try {
      $r = Invoke-RestMethod -Uri $Url -TimeoutSec 3
      if ($r.status -eq 'ok') { return $true }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

Write-Host "Stopping anything on ports $Port / $StubPort ..."
Stop-Port -Port $Port
Stop-Port -Port $StubPort
Start-Sleep -Seconds 1

if ($Gateway -eq 'stub') {
  Write-Host "Starting Razorpay stub on $StubPort ..."
  Start-Process -FilePath 'python' `
    -ArgumentList 'tests_razorpay_stub.py', $StubPort `
    -WorkingDirectory $Root `
    -RedirectStandardOutput (Join-Path $LogDir 'stub.log') `
    -RedirectStandardError (Join-Path $LogDir 'stub.err.log') `
    -WindowStyle Hidden | Out-Null

  $env:RAZORPAY_KEY_ID = 'rzp_test_stub_key'
  $env:RAZORPAY_KEY_SECRET = 'stub_secret'
  $env:RAZORPAY_API_BASE = "http://127.0.0.1:$StubPort/v1"
} else {
  # Must be cleared, not just unset upstream, or Django inherits them.
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_API_BASE' |
    ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
  Write-Host "No Razorpay credentials - the API should refuse to create orders."
}

Write-Host "Starting Django on $Port ..."
Start-Process -FilePath 'python' `
  -ArgumentList 'manage.py', 'runserver', $Port, '--noreload' `
  -WorkingDirectory $Root `
  -RedirectStandardOutput (Join-Path $LogDir 'django.log') `
  -RedirectStandardError (Join-Path $LogDir 'django.err.log') `
  -WindowStyle Hidden | Out-Null

$health = "http://127.0.0.1:$Port/api/v1/health/"
if (Wait-Healthy -Url $health) {
  Write-Host "Ready: $health  (logs in $LogDir)"
  Write-Host "Run the suite with:  python tests_e2e.py"
  exit 0
}

Write-Host "Django did not become healthy. See $LogDir\django.err.log"
exit 1