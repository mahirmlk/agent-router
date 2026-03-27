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

& (Get-PythonCommand) -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
