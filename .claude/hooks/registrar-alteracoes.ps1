# Hook PostToolUse (Edit|Write|MultiEdit|NotebookEdit)
# Registra cada arquivo alterado em .claude/logs/alteracoes.log, para revisão e auditoria.

$ErrorActionPreference = 'Stop'

$leitor = New-Object IO.StreamReader([Console]::OpenStandardInput(), [Text.Encoding]::UTF8)
$entrada = $leitor.ReadToEnd() | ConvertFrom-Json

$caminho = $entrada.tool_input.file_path
if (-not $caminho) { $caminho = $entrada.tool_input.notebook_path }
if (-not $caminho) { exit 0 }

$projeto = $env:CLAUDE_PROJECT_DIR
if (-not $projeto) { $projeto = $entrada.cwd }

$relativo = $caminho -replace '\\', '/'
$raiz = ($projeto -replace '\\', '/').TrimEnd('/') + '/'
if ($relativo.StartsWith($raiz, [StringComparison]::OrdinalIgnoreCase)) {
    $relativo = $relativo.Substring($raiz.Length)
}

$pasta = Join-Path $projeto '.claude\logs'
New-Item -ItemType Directory -Force -Path $pasta | Out-Null

$quando = (Get-Date).ToString('dd/MM/yyyy HH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
$sessao = "$($entrada.session_id)"
if ($sessao.Length -gt 8) { $sessao = $sessao.Substring(0, 8) }
$linha = "$quando | sessão $sessao | $($entrada.tool_name) | $relativo" + [Environment]::NewLine

[IO.File]::AppendAllText((Join-Path $pasta 'alteracoes.log'), $linha, (New-Object Text.UTF8Encoding $false))
exit 0
