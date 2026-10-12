$docPaths = @(
    "C:\Users\ESHOP\.gemini\antigravity\scratch\Shaheen-Traders-POS\docs\Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx",
    "C:\Users\ESHOP\.gemini\antigravity\scratch\Shaheen-Traders-POS\Shaheen_Traders_POS_IEEE_SRS_DFD_SDS_ERD_SEMANTIC_NET.docx"
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false

foreach ($path in $docPaths) {
    if (Test-Path $path) {
        try {
            $doc = $word.Documents.Open($path, $false, $true) # Open read-only
            Write-Host "OPENED_SUCCESSFULLY: $($doc.Name) | Words: $($doc.Words.Count) | Paragraphs: $($doc.Paragraphs.Count)"
            $doc.Close([ref]$false)
        } catch {
            Write-Host "ERROR opening $($path): $($_.Exception.Message)"
        }
    } else {
        Write-Host "NOT FOUND: $path"
    }
}

$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
