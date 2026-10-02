# Petit serveur local pour tester le jeu dans le navigateur.
# Lancé automatiquement par l'aperçu ; sert aussi à tester à la main :
#   powershell -File .claude\serve.ps1 -Root . -Port 8765
param([string]$Root, [int]$Port = 8765)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Undercover Z sur http://localhost:$Port/  (racine : $Root)"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $Root $path
  if (Test-Path $file -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $type = 'application/octet-stream'
    if ($file -like '*.html') { $type = 'text/html; charset=utf-8' }
    elseif ($file -like '*.js') { $type = 'text/javascript; charset=utf-8' }
    elseif ($file -like '*.css') { $type = 'text/css; charset=utf-8' }
    elseif ($file -like '*.json') { $type = 'application/json; charset=utf-8' }
    elseif ($file -like '*.jpg' -or $file -like '*.jpeg') { $type = 'image/jpeg' }
    elseif ($file -like '*.png') { $type = 'image/png' }
    elseif ($file -like '*.webp') { $type = 'image/webp' }
    elseif ($file -like '*.svg') { $type = 'image/svg+xml' }
    $ctx.Response.ContentType = $type
    $ctx.Response.ContentLength64 = $bytes.Length
    if ($ctx.Request.HttpMethod -ne 'HEAD') {
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
