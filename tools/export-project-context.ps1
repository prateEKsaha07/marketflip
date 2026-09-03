$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$output = Join-Path $root 'PROJECT_CONTEXT.md'

$excludedDirectories = @(
    '\mfx\',
    '\node_modules\',
    '\.git\',
    '\.temp\',
    '\__pycache__\',
    '\dist\',
    '\build\'
)

$excludedNames = @('.env', '.env.local', '.env.development', '.env.production')
$excludedExtensions = @(
    '.joblib', '.pyc', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
    '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.mov', '.zip'
)

$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($root.Length + 1)
    $pathForFilter = "\$relativePath"
    $isExcludedDirectory = $excludedDirectories | Where-Object { $pathForFilter.Contains($_) }
    -not $isExcludedDirectory -and
    $_.Name -notin $excludedNames -and
    $_.Extension.ToLowerInvariant() -notin $excludedExtensions -and
    $_.FullName -ne $output
} | Sort-Object FullName

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# MarketFlip Project Context')
$lines.Add('')
$lines.Add('Use this file as context for the current MarketFlip repository. It is generated from authored text files; dependencies, secrets, generated metadata, binaries, and trained model artifacts are omitted.')
$lines.Add('')
$lines.Add('## Included Files')
$lines.Add('')

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    $lines.Add("- $relativePath")
}

$lines.Add('')
$lines.Add('## File Contents')
$lines.Add('')

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    if ($null -eq $content) {
        $content = ''
    }
    $extension = $file.Extension.ToLowerInvariant()
    $language = switch ($extension) {
        '.py' { 'python' }
        '.js' { 'javascript' }
        '.jsx' { 'jsx' }
        '.ts' { 'typescript' }
        '.tsx' { 'tsx' }
        '.css' { 'css' }
        '.html' { 'html' }
        '.json' { 'json' }
        '.md' { 'markdown' }
        '.sql' { 'sql' }
        '.yml' { 'yaml' }
        '.yaml' { 'yaml' }
        '.ps1' { 'powershell' }
        '.cjs' { 'javascript' }
        default { '' }
    }

    $lines.Add("### FILE: $relativePath")
    $lines.Add('')
    $lines.Add("```$language")
    $lines.Add($content.TrimEnd())
    $lines.Add('```')
    $lines.Add('')
}

[System.IO.File]::WriteAllText($output, ($lines -join [Environment]::NewLine) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Output "Wrote $output"
Write-Output "Included $($files.Count) files"