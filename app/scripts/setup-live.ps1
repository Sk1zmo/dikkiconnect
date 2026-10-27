# ═══════════════════════════════════════════════════════════════════════════
#  Takes WayPool from "nothing is live" to "a tester can sign in and book".
#
#    powershell -ExecutionPolicy Bypass -File scripts/setup-live.ps1
#
#  There are exactly two things an agent cannot create for you, because both
#  need an account that is yours: a Gmail App Password, and an Upstash Redis
#  database. This script asks for those two, sets everything else, deploys,
#  and then proves it worked rather than telling you it did.
#
#  Passwords are read with Read-Host -AsSecureString and piped straight to the
#  Vercel CLI. They are never echoed and never written to a file in the repo.
# ═══════════════════════════════════════════════════════════════════════════

# NOT 'Stop'.
#
# Windows PowerShell 5.1 wraps a native command's stderr in an ErrorRecord, and
# under ErrorActionPreference='Stop' that becomes a terminating error. The
# Vercel CLI prints its version banner to stderr on every single invocation, so
# 'Stop' kills this script on a message that only says "hello". Exit codes are
# checked explicitly instead, which is the thing that actually carries meaning.
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..')

function Section($text) {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "  $('-' * $text.Length)" -ForegroundColor DarkGray
}

function Plain($secure) {
    $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

# Writes one env var to production.
#
# The value goes in on stdin rather than as --value, so it never appears in the
# shell history or in this process's argument list. No 2>&1 anywhere near it:
# see the note on ErrorActionPreference above. --force makes re-running this
# script safe, which matters because the first version of it died halfway.
$script:failed = @()
function SetEnv($name, $value) {
    $value | & npx vercel env add $name production --force --yes | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    set $name" -ForegroundColor Green
    } else {
        Write-Host "    FAILED to set $name (exit $LASTEXITCODE)" -ForegroundColor Red
        $script:failed += $name
    }
}

Write-Host ""
Write-Host "  WayPool - going live" -ForegroundColor White
Write-Host "  Two things to paste. Everything else is automatic." -ForegroundColor DarkGray

# ── 1. Mail ────────────────────────────────────────────────────────────────
Section "1 of 4  Email, so testers can sign in"
Write-Host "  Sign-in codes will be sent from waypool1@gmail.com."
Write-Host ""
Write-Host "  You need a Gmail App Password (16 characters, not your login password):" -ForegroundColor Yellow
Write-Host "    1. Sign in as waypool1@gmail.com"
Write-Host "    2. Google Account -> Security -> turn ON 2-Step Verification"
Write-Host "    3. Then Security -> App passwords -> create one, name it WayPool"
Write-Host "    4. Paste the 16 characters below (spaces are fine)"
Write-Host ""
$appPass = Read-Host "  Gmail App Password" -AsSecureString
$appPassPlain = (Plain $appPass) -replace '\s', ''

if ($appPassPlain.Length -lt 16) {
    Write-Host ""
    Write-Host "  That does not look like an App Password (expected 16 characters)." -ForegroundColor Red
    Write-Host "  It is NOT your normal Gmail password - Google blocks those for SMTP."
    exit 1
}

SetEnv 'SMTP_USER' 'waypool1@gmail.com'
SetEnv 'SMTP_PASS' $appPassPlain
SetEnv 'MAIL_FROM' 'WayPool <waypool1@gmail.com>'
SetEnv 'SMTP_HOST' 'smtp.gmail.com'
SetEnv 'SMTP_PORT' '465'

# ── 2. Storage ─────────────────────────────────────────────────────────────
Section "2 of 4  A database that remembers"
Write-Host "  Without this the server forgets every account whenever it goes idle."
Write-Host ""
Write-Host "  Create a free Upstash Redis database:" -ForegroundColor Yellow
Write-Host "    1. https://console.upstash.com -> Create Database -> Redis"
Write-Host "    2. Pick a region near India (ap-south-1 / Mumbai if offered)"
Write-Host "    3. On the database page, find the REST API section"
Write-Host "    4. Copy the REST URL and the REST TOKEN"
Write-Host ""
Write-Host "  (If you connected Upstash through the Vercel Marketplace instead," -ForegroundColor DarkGray
Write-Host "   the variables are already set - just press Enter twice to skip.)" -ForegroundColor DarkGray
Write-Host ""
$redisUrl = Read-Host "  Upstash REST URL (or Enter to skip)"
if ($redisUrl) {
    $redisTok = Read-Host "  Upstash REST TOKEN" -AsSecureString
    SetEnv 'KV_REST_API_URL' $redisUrl.Trim()
    SetEnv 'KV_REST_API_TOKEN' (Plain $redisTok).Trim()
} else {
    Write-Host "    skipped - assuming the Marketplace integration set them" -ForegroundColor DarkGray
}

# ── 3. Ops key ─────────────────────────────────────────────────────────────
Section "3 of 4  A key for the ops dashboard"
$bytes = New-Object byte[] 24
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$rng.GetBytes($bytes); $rng.Dispose()
$opsKey = [Convert]::ToBase64String($bytes) -replace '[^A-Za-z0-9]', ''
SetEnv 'OPS_KEY' $opsKey
Write-Host "    your OPS_KEY (save this, it is how you read /ops):" -ForegroundColor Yellow
Write-Host "    $opsKey"

# ── 4. Deploy and prove it ─────────────────────────────────────────────────
Section "4 of 4  Deploy"
Write-Host "  Environment variables do not apply to a running deployment," -ForegroundColor DarkGray
Write-Host "  so this has to redeploy." -ForegroundColor DarkGray
Write-Host ""
& npx vercel --prod | Select-Object -Last 6
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Deploy failed. Nothing below will be true until it succeeds." -ForegroundColor Red
    exit 1
}

Section "Checking it actually works"
$origin = Read-Host "  Production URL (e.g. https://dikkiconnect-mail.vercel.app)"
if (-not $origin) { $origin = 'https://dikkiconnect-mail.vercel.app' }

Write-Host ""
Write-Host "  Does the API have the new routes?"
# -SkipHttpErrorCheck is PowerShell 7+. On 5.1 a 401 throws, so the status has
# to be read off the exception - and a 401 here is the success case.
$status = 0
try {
    $status = (Invoke-WebRequest "$origin/api/parcels" -TimeoutSec 20 -UseBasicParsing).StatusCode
} catch {
    $status = [int]$_.Exception.Response.StatusCode
}
if ($status -eq 401) {
    Write-Host "    OK - /api/parcels exists and refuses anonymous callers" -ForegroundColor Green
} elseif ($status -eq 404) {
    Write-Host "    NOT DEPLOYED - /api/parcels is 404. The deploy did not include it." -ForegroundColor Red
} elseif ($status -eq 0) {
    Write-Host "    could not reach $origin" -ForegroundColor Red
} else {
    Write-Host "    unexpected: HTTP $status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Does storage survive a cold start?"
try {
    $ops = Invoke-RestMethod "$origin/api/ops" -Headers @{ 'X-Ops-Key' = $opsKey } -TimeoutSec 20
    # The field is health.storage, not storage. Reading the wrong one made this
    # report IN-MEMORY on a perfectly good Upstash connection - a check that is
    # wrong in the alarming direction is worse than no check, because it sends
    # you looking for a problem that is not there.
    if ($ops.health.storageDurable) {
        Write-Host "    OK - $($ops.health.storage)" -ForegroundColor Green
    } else {
        Write-Host "    IN-MEMORY - data will be lost. Upstash is not connected." -ForegroundColor Red
    }
    if ($ops.health.warnings) {
        $ops.health.warnings | ForEach-Object { Write-Host "    ! $_" -ForegroundColor Yellow }
    }
} catch { Write-Host "    /api/ops did not answer - check OPS_KEY" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  Does email actually send?"
$testTo = Read-Host "  An address you can check right now"
if ($testTo) { & node scripts/verify-mail.mjs $testTo $origin }

Write-Host ""
if ($script:failed.Count) {
    Write-Host "  These did not get set: $($script:failed -join ', ')" -ForegroundColor Red
    Write-Host "  Re-run this script - it overwrites, so starting again is safe." -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "  Done. If all three checks above are green, a tester can sign in." -ForegroundColor Green
Write-Host "  Next: rebuild the APK so it points at this API -" -ForegroundColor DarkGray
Write-Host "    `$env:VITE_API_ORIGIN='$origin'; npm run android:release" -ForegroundColor DarkGray
Write-Host ""
