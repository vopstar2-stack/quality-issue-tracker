$env:Path = "C:\Program Files\nodejs;" + $env:Path
$projectDir = "C:\Users\wonsoo83.kim\Documents\quality-issue-tracker"
$url = "http://localhost:3000"

function Test-ServerUp {
    try {
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-ServerUp)) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir`" && npm run dev" -WindowStyle Minimized
    $tries = 0
    while (-not (Test-ServerUp) -and $tries -lt 40) {
        Start-Sleep -Seconds 1
        $tries++
    }
}

Start-Process $url
