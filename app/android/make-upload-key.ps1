# ═══════════════════════════════════════════════════════════════════════════
#  Creates the WayPool upload key.
#
#    powershell -ExecutionPolicy Bypass -File make-upload-key.ps1
#
#  This key IS the app's identity on Google Play. Every future update has to
#  be signed with it. If it is lost, the listing cannot be updated — not by
#  you, not by Google, not by anyone — and the app has to be republished under
#  a new package name, losing its reviews, its installs and its URL.
#
#  So two rules are built into this script:
#
#    1. The password is generated here, on this machine, written only into
#       keystore.properties (which is gitignored), and never printed. Nothing
#       that can read this script's output ever learns it.
#    2. It refuses to overwrite an existing keystore. Regenerating one is
#       indistinguishable from destroying the old one.
#
#  After it runs: open keystore.properties, copy the password into a password
#  manager, and put a copy of the .keystore file somewhere you will still have
#  in five years. Do that before you ship anything.
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$KeystoreFile = 'waypool-upload.keystore'
$Alias        = 'waypool-upload'
$PropsFile    = 'keystore.properties'

if (Test-Path $KeystoreFile) {
    Write-Host ""
    Write-Host "  $KeystoreFile already exists." -ForegroundColor Yellow
    Write-Host "  Refusing to replace it - that would throw away the app's identity."
    Write-Host "  Delete it by hand first if you are certain it was never used."
    Write-Host ""
    exit 1
}

# keytool has to be found before a password exists, so a missing JDK fails
# loudly rather than halfway through.
$keytool = (Get-Command keytool -ErrorAction SilentlyContinue).Source
if (-not $keytool -and $env:JAVA_HOME) {
    $candidate = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
    if (Test-Path $candidate) { $keytool = $candidate }
}
if (-not $keytool) {
    Write-Host "  keytool not found. Install a JDK or set JAVA_HOME." -ForegroundColor Red
    exit 1
}

# 30 characters from a 62-character alphabet - about 178 bits. The password is
# never typed by a human, so there is no reason for it to be weaker than that.
$alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
# RNGCryptoServiceProvider rather than RandomNumberGenerator.Fill: this runs
# under Windows PowerShell 5.1, whose .NET Framework has no Fill method.
$bytes = New-Object byte[] 30
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$rng.GetBytes($bytes)
$rng.Dispose()
$password = -join ($bytes | ForEach-Object { $alphabet[$_ % $alphabet.Length] })

Write-Host ""
Write-Host "  Generating a 4096-bit RSA key, valid for ~27 years..." -ForegroundColor Cyan

$dname = "CN=WayPool, OU=Mobile, O=WayPool, L=Bangalore, ST=Karnataka, C=IN"

# The password goes on keytool's command line.
#
# Feeding it on stdin would be tidier, and that was tried first: keytool
# detects that stdin is not a console, warns that input may be visible, and
# then misreads the two answers. The remaining options are an argument list
# that exists for the second or two this process runs, on your own machine,
# or an interactive prompt you type by hand. The argument is the lesser
# problem - the same password is about to be written to a file in this folder
# regardless, and that file is the thing actually worth protecting.
$keytoolArgs = @(
    '-genkeypair', '-v',
    '-keystore', $KeystoreFile,
    '-alias', $Alias,
    '-keyalg', 'RSA',
    '-keysize', '4096',
    '-validity', '10000',
    '-dname', $dname,
    '-storepass', $password,
    '-keypass', $password
)

# No 2>&1. keytool writes its ordinary progress line to stderr, and Windows
# PowerShell 5.1 turns a native command's redirected stderr into an
# ErrorRecord - which, under ErrorActionPreference='Stop', killed the script
# on a message that was only saying it had started.
$ErrorActionPreference = 'Continue'
& $keytool @keytoolArgs | Out-Null
$code = $LASTEXITCODE
$ErrorActionPreference = 'Stop'

if ($code -ne 0 -or -not (Test-Path $KeystoreFile)) {
    Write-Host "  keytool failed:" -ForegroundColor Red
    Write-Host $err
    exit 1
}

# Gradle reads this file. It is listed in the repository's .gitignore.
# WriteAllText with a BOM-less encoder, not Set-Content -Encoding utf8:
# PowerShell 5.1's "utf8" writes a byte-order mark, and java.util.Properties
# reads that BOM as part of the first key. Gradle then sees a storeFile of
# null and fails with "Cannot convert 'null' to File", several steps away
# from anything that mentions encoding.
$props = "storeFile=$KeystoreFile`nstorePassword=$password`nkeyAlias=$Alias`nkeyPassword=$password`n"
[System.IO.File]::WriteAllText(
    (Join-Path $PSScriptRoot $PropsFile),
    $props,
    (New-Object System.Text.UTF8Encoding($false))
)

# The fingerprint is public information - it is what Play shows you - so it is
# safe to print, and it is the one thing worth checking against the console.
$fp = & $keytool -list -v -keystore $KeystoreFile -alias $Alias -storepass $password 2>$null |
      Select-String 'SHA256:' | Select-Object -First 1

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
Write-Host ""
Write-Host "    key        $((Resolve-Path $KeystoreFile).Path)"
Write-Host "    password   $((Resolve-Path $PropsFile).Path)  (not shown here, on purpose)"
if ($fp) { Write-Host "    $($fp.ToString().Trim())" }
Write-Host ""
Write-Host "  Before you ship anything:" -ForegroundColor Yellow
Write-Host "    1. Open keystore.properties and put the password in a password manager."
Write-Host "    2. Back up the .keystore file somewhere off this machine."
Write-Host "       Lose it and this app can never be updated again."
Write-Host ""
