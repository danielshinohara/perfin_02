# Hook PreToolUse (Bash|PowerShell)
# Impede comandos destrutivos ou que executam código baixado da internet.
# Saída 2 bloqueia a ação e envia a mensagem de stderr ao Claude.

$ErrorActionPreference = 'Stop'

function Bloquear([string]$mensagem) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($mensagem)
    $stderr = [Console]::OpenStandardError()
    $stderr.Write($bytes, 0, $bytes.Length)
    $stderr.Flush()
    exit 2
}

$leitor = New-Object IO.StreamReader([Console]::OpenStandardInput(), [Text.Encoding]::UTF8)
$entrada = $leitor.ReadToEnd() | ConvertFrom-Json

$comando = $entrada.tool_input.command
if (-not $comando) { exit 0 }

# -match não diferencia maiúsculas de minúsculas.
$regras = @(
    @{ Motivo = 'remoção recursiva da raiz, da pasta do usuário ou de tudo'
       Padrao = '\brm\s+(-[a-z]+\s+)*-[a-z]*r[a-z]*\s+(-[a-z]+\s+)*["'']?(/|~/?|\$HOME/?|\*|\./?|\.\./?|[a-z]:[\\/]?)["'']?(\s|$|;|&|\|)' },
    @{ Motivo = 'remoção recursiva da raiz, da pasta do usuário ou de tudo'
       Padrao = '\b(Remove-Item|ri|rm|rd|rmdir|del|erase)\b(?=[^;|&\r\n]*\s-r(ecurse)?\b)[^;|&\r\n]*?\s["'']?([a-z]:\\?|\\|~[\\/]?|\$HOME[\\/]?|\$env:USERPROFILE[\\/]?|\*)["'']?(?=\s|$|;|\|)' },
    @{ Motivo = 'git push forçado'
       Padrao = '\bgit\s+push\b[^;|&\r\n]*\s(--force(?!-with-lease)\b|-f\b)' },
    @{ Motivo = 'git reset --hard (descarta alterações não salvas)'
       Padrao = '\bgit\s+reset\b[^;|&\r\n]*\s--hard\b' },
    @{ Motivo = 'git clean forçado (apaga arquivos não versionados)'
       Padrao = '\bgit\s+clean\b[^;|&\r\n]*\s-[a-z]*f' },
    @{ Motivo = 'comando SQL destrutivo'
       Padrao = '\b(drop\s+(database|schema|table)|truncate\s+table)\b' },
    @{ Motivo = 'formatação de disco'
       Padrao = '\b(Format-Volume|Clear-Disk|diskpart|mkfs(\.\w+)?)\b' },
    @{ Motivo = 'execução de script baixado da internet'
       Padrao = '\b(curl|wget|iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^;&\r\n]*\|\s*(sh|bash|zsh|iex|Invoke-Expression)\b' }
)

foreach ($regra in $regras) {
    if ($comando -match $regra.Padrao) {
        Bloquear "Bloqueado pelo hook bloquear-comandos-perigosos: $($regra.Motivo). Comando: $comando`nSe for realmente necessário, peça ao usuário para executá-lo manualmente."
    }
}

exit 0
