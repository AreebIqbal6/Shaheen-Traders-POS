$url = "https://github.com/AreebIqbal6/Shaheen-Traders-POS/releases/download/v0.4.7/Shaheen.Global.Traders.POS_0.4.7_x64-setup.exe"
$outPath = "installer_v0.4.7.exe"

Write-Host "Waiting for v0.4.7 release to be available..."
while ($true) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
            Write-Host "Release found! Downloading..."
            break
        }
    } catch {
        # Ignore 404s
    }
    Start-Sleep -Seconds 30
}

Invoke-WebRequest -Uri $url -OutFile $outPath
Write-Host "Installing v0.4.7 silently..."
Start-Process -FilePath $outPath -ArgumentList "/S" -Wait
Remove-Item $outPath
Write-Host "Installation complete."
