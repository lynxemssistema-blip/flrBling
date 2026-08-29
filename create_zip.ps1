param (
    [string]$SourceDir,
    [string]$ZipPath
)

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$resolvedSource = (Resolve-Path $SourceDir).Path
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $resolvedSource -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
    $fullPath = $_.FullName
    $relPath = $fullPath.Substring($resolvedSource.Length).TrimStart('\', '/').Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $relPath) | Out-Null
}

$zip.Dispose()
Write-Host "ZIP generated with normalized forward slashes: $ZipPath"
