# build-loopify-exe-pkg.ps1

# 1. Install pkg if not present
if (-not (Get-Command pkg -ErrorAction SilentlyContinue)) {
    npm install -g pkg
}

# 2. Build the EXE with pkg
pkg loopify-launcher.js --output loopify.exe --icon "C:\Users\User\Downloads\Loopify\capy-in-currents.ico" --targets node18-win-x64

# 3. Create Desktop Shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Loopify.lnk")
$Shortcut.TargetPath = "$PWD\loopify.exe"
# Ensure no arguments are set
$Shortcut.Arguments = ""
$Shortcut.IconLocation = "C:\Users\User\Downloads\Loopify\capy-in-currents.ico"
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.Save()
Write-Host "Loopify.exe and desktop shortcut created!" 