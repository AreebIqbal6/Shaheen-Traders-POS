Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Shaheen Global Traders POS Setup"
$form.Size = New-Object System.Drawing.Size(400,250)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(20,20)
$label.Size = New-Object System.Drawing.Size(350,40)
$label.Text = "Select the components you want to install on this machine:"
$label.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($label)

$checkAdmin = New-Object System.Windows.Forms.CheckBox
$checkAdmin.Location = New-Object System.Drawing.Point(40,60)
$checkAdmin.Size = New-Object System.Drawing.Size(300,20)
$checkAdmin.Text = "Install Admin POS"
$checkAdmin.Checked = $true
$checkAdmin.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Controls.Add($checkAdmin)

$checkBooker = New-Object System.Windows.Forms.CheckBox
$checkBooker.Location = New-Object System.Drawing.Point(40,90)
$checkBooker.Size = New-Object System.Drawing.Size(300,20)
$checkBooker.Text = "Install Booker App"
$checkBooker.Checked = $true
$checkBooker.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Controls.Add($checkBooker)

$buttonOk = New-Object System.Windows.Forms.Button
$buttonOk.Location = New-Object System.Drawing.Point(140,150)
$buttonOk.Size = New-Object System.Drawing.Size(100,30)
$buttonOk.Text = "Create Shortcuts"
$buttonOk.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$buttonOk.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $buttonOk
$form.Controls.Add($buttonOk)

$result = $form.ShowDialog()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $WshShell = New-Object -comObject WScript.Shell
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    
    # Path where the MSI installs the app
    $appPath = "C:\Program Files\Shaheen Global Traders POS\app.exe"
    if (-not (Test-Path $appPath)) {
        # Fallback if installed in LocalAppData
        $appPath = "$env:LOCALAPPDATA\Shaheen Global Traders POS\app.exe"
    }

    if (-not (Test-Path $appPath)) {
        [System.Windows.Forms.MessageBox]::Show("Could not find the installed POS application. Please run the official installer first.", "Error", 0, [System.Windows.Forms.MessageBoxIcon]::Error)
        exit
    }

    if ($checkAdmin.Checked) {
        $shortcut = $WshShell.CreateShortcut("$desktopPath\Shaheen Admin POS.lnk")
        $shortcut.TargetPath = $appPath
        $shortcut.Arguments = "--mode admin"
        $shortcut.IconLocation = $appPath
        $shortcut.Save()
    }

    if ($checkBooker.Checked) {
        $shortcut = $WshShell.CreateShortcut("$desktopPath\Shaheen Booker POS.lnk")
        $shortcut.TargetPath = $appPath
        $shortcut.Arguments = "--mode booker"
        $shortcut.IconLocation = $appPath
        $shortcut.Save()
    }

    [System.Windows.Forms.MessageBox]::Show("Shortcuts created successfully on your Desktop! You can now launch the specific apps.", "Success", 0, [System.Windows.Forms.MessageBoxIcon]::Information)
}
