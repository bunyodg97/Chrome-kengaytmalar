# Windows uchun (Node.js shart emas):
#   PowerShell'da kengaytma papkasida:  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
param([string]$Version = "3")
$ErrorActionPreference = "Stop"
$lib = Join-Path $PSScriptRoot "..\lib"
New-Item -ItemType Directory -Force -Path $lib | Out-Null
$tx = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@$Version/dist/"

Write-Host "Yuklanmoqda: transformers.min.js ..."
$jsPath = Join-Path $lib "transformers.min.js"
Invoke-WebRequest -UseBasicParsing -Uri ($tx + "transformers.min.js") -OutFile $jsPath

$sources = @($tx)
$m = Select-String -Path $jsPath -Pattern 'onnxruntime-web@([0-9][\w.\-]*)' | Select-Object -First 1
if ($m) { $sources += "https://cdn.jsdelivr.net/npm/onnxruntime-web@$($m.Matches[0].Groups[1].Value)/dist/" }

$files = @("ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm")
$got = 0
foreach ($f in $files) {
  foreach ($s in $sources) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri ($s + $f) -OutFile (Join-Path $lib $f)
      Write-Host "OK $f"; $got++; break
    } catch { }
  }
}
if ($got -eq 0) { Write-Host "ONNX Runtime fayllari topilmadi." -ForegroundColor Red; exit 1 }
Write-Host "`nTayyor! chrome://extensions sahifasida kengaytmani yangilang." -ForegroundColor Green
