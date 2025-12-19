# PowerShell script to kill process on port 4000
# Usage: .\kill-port.ps1 [port_number]

param(
    [int]$Port = 4000
)

Write-Host "Checking for processes on port $Port..." -ForegroundColor Cyan

$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
        Write-Host "Killing process..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
        Write-Host "✅ Process killed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Process ID $processId not found (may have already terminated)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No process found on port $Port" -ForegroundColor Green
}
