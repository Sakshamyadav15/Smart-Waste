$files = Get-ChildItem -Path "src" -Include *.tsx,*.ts -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    $content = $content -replace '[\x{1F300}-\x{1F9FF}]', ''
    $content = $content -replace '[\x{2600}-\x{26FF}]', ''
    $content = $content -replace '[\x{2700}-\x{27BF}]', ''
    
    $content = $content -replace '//\s*[^\n]*\n', "`n"
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    
    $content = $content -replace '\n\s*\n\s*\n', "`n`n"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Cleaned $($files.Count) files"
