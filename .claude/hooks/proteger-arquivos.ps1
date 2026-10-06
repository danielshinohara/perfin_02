# Hook PreToolUse (Edit|Write|MultiEdit|NotebookEdit)
# Impede a edição de arquivos de segredo, de arquivos internos do Git e de lockfiles.
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

$caminho = $entrada.tool_input.file_path
if (-not $caminho) { $caminho = $entrada.tool_input.notebook_path }
if (-not $caminho) { exit 0 }

$normalizado = $caminho -replace '\\', '/'
$nome = [IO.Path]::GetFileName($normalizado).ToLowerInvariant()

$exemplosEnv = @('.env.example', '.env.sample', '.env.template')
$ehEnv = ($nome -eq '.env' -or $nome -like '.env.*') -and ($exemplosEnv -notcontains $nome)
$ehChave = $nome -match '\.(pem|key|pfx|p12|jks|keystore)$' -or $nome -match '^id_(rsa|dsa|ecdsa|ed25519)'
if ($ehEnv -or $ehChave) {
    Bloquear "Bloqueado pelo hook proteger-arquivos: '$caminho' pode conter segredos e não pode ser editado pelo Claude. Peça ao usuário para fazer a alteração; para documentar variáveis, use um .env.example sem valores reais."
}

if ($normalizado -match '(^|/)\.git/') {
    Bloquear "Bloqueado pelo hook proteger-arquivos: '$caminho' é um arquivo interno do Git. Use comandos git em vez de editá-lo."
}

$lockfiles = @('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock', 'poetry.lock', 'composer.lock', 'gemfile.lock', 'cargo.lock')
if ($lockfiles -contains $nome) {
    Bloquear "Bloqueado pelo hook proteger-arquivos: '$caminho' é gerado pelo gerenciador de pacotes. Altere o manifesto (ex.: package.json) e rode o comando de instalação."
}

exit 0
