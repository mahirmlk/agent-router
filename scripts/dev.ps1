$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Set-Location $root

function Get-PythonCommand {
  $python = Get-Command python -ErrorAction SilentlyContinue

  if ($python) {
    return $python.Source
  }

  $py = Get-Command py -ErrorAction SilentlyContinue

  if ($py) {
    return $py.Source
  }

  throw "Python was not found in PATH."
}

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$backend = Start-Process `
  -FilePath (Get-PythonCommand) `
  -ArgumentList @("-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload") `
  -WorkingDirectory $root `
  -RedirectStandardOutput (Join-Path $logDir "backend.out.log") `
  -RedirectStandardError (Join-Path $logDir "backend.err.log") `
  -PassThru

try {
  npm --prefix dashboard run dev --
} finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
  }
}
