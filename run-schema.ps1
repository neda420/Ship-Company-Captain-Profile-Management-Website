# PowerShell script to run the schema file
# Usage: .\run-schema.ps1

Write-Host "Running database schema..." -ForegroundColor Cyan

# Try to find MySQL executable
$mysqlExe = $null

# Check if MySQL is in PATH
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlPath) {
    $mysqlExe = "mysql"
} else {
    # Try common XAMPP locations
    $xamppPaths = @(
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\Program Files\xampp\mysql\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    )
    
    foreach ($path in $xamppPaths) {
        if (Test-Path $path) {
            $mysqlExe = $path
            Write-Host "Found MySQL at: $mysqlExe" -ForegroundColor Green
            break
        }
    }
}

if (-not $mysqlExe) {
    Write-Host "Error: MySQL not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use one of these options:" -ForegroundColor Yellow
    Write-Host "1. Use phpMyAdmin (EASIEST):" -ForegroundColor Cyan
    Write-Host "   - Open http://localhost/phpmyadmin" -ForegroundColor White
    Write-Host "   - Select database 'global shipping company'" -ForegroundColor White
    Write-Host "   - Click SQL tab, paste contents of server\schema_normalized.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Or specify MySQL path manually:" -ForegroundColor Cyan
    Write-Host "   Get-Content server\schema_normalized.sql | & 'C:\xampp\mysql\bin\mysql.exe' -u root -p 'global shipping company'" -ForegroundColor White
    exit 1
}

# Get MySQL password
$password = Read-Host "Enter MySQL root password (press Enter if no password)" -AsSecureString
$passwordPlain = ""
if ($password.Length -gt 0) {
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
}

# Read the SQL file
$sqlFile = "server\schema_normalized.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: Schema file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading schema file..." -ForegroundColor Green
$sqlContent = Get-Content $sqlFile -Raw

# Run the SQL
Write-Host "Executing SQL..." -ForegroundColor Green
try {
    if ($passwordPlain) {
        $sqlContent | & $mysqlExe -u root -p$passwordPlain "global shipping company"
    } else {
        $sqlContent | & $mysqlExe -u root "global shipping company"
    }
    Write-Host ""
    Write-Host "Schema executed successfully!" -ForegroundColor Green
    Write-Host "You should now have 15 tables in your database." -ForegroundColor Cyan
} catch {
    Write-Host "Error executing schema: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try using phpMyAdmin instead (see RUN_SCHEMA.md)" -ForegroundColor Yellow
    exit 1
}
