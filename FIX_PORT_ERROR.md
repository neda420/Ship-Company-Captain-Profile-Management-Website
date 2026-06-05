# Fix "Port Already in Use" Error

## Quick Fix

If you see `Error: listen EADDRINUSE: address already in use :::4000`, it means a previous backend server instance is still running.

### Option 1: Use the PowerShell Script (Easiest)

```powershell
.\kill-port.ps1
```


Or for a different port:
```powershell
.\kill-port.ps1 4001
```

### Option 2: Manual PowerShell Command

```powershell
$port = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port) { Stop-Process -Id $port.OwningProcess -Force }
```

### Option 3: Windows CMD

```cmd
netstat -ano | findstr :4000
taskkill /F /PID <PID_NUMBER>
```

Replace `<PID_NUMBER>` with the process ID from the first command.

### Option 4: Change Port

Edit `server/.env` file and change:
```
PORT=4001
```

Then update `vite.config.ts` proxy target to match:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:4001',  // Changed from 4000
    ...
  }
}
```

## Why This Happens

- Previous server instance wasn't closed properly
- Server crashed but process is still running
- Multiple terminal windows running the server

## Prevention

Always stop the server properly:
- Press `Ctrl+C` in the terminal running the server
- Wait for it to fully stop before starting again
- Close terminal windows when done
