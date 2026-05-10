# ============================================================
# setup.ps1 — OncoCollab (Windows PowerShell)
# Copie tous les fichiers .example en fichiers .env
# Usage : .\setup.ps1
# ============================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   OncoCollab — Setup de configuration        ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

function Copy-IfMissing($src, $dst) {
    if (Test-Path $dst) {
        Write-Host "  ⏭️  Déjà présent : $dst (ignoré)"
    } else {
        Copy-Item $src $dst
        Write-Host "  ✅ Créé         : $dst"
    }
}

Write-Host "📋 Copie des fichiers de configuration..."
Write-Host ""

Copy-IfMissing ".env.example"          ".env"
Copy-IfMissing ".env.backend.example"  ".env.backend"
Copy-IfMissing ".env.postgres.example" ".env.postgres"
Copy-IfMissing ".env.mongo.example"    ".env.mongo"

Copy-IfMissing "olga-designer\.env.back.example"           "olga-designer\.env.back"
Copy-IfMissing "olga-designer\.env.mysql.example"          "olga-designer\.env.mysql"
Copy-IfMissing "olga-designer\config\config.json.example"  "olga-designer\config\config.json"
Copy-IfMissing "olga-designer\config\apiKey.json.example"  "olga-designer\config\apiKey.json"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║  ✅ Fichiers créés !                          ║"
Write-Host "╠══════════════════════════════════════════════╣"
Write-Host "║  👉 Remplis maintenant les fichiers .env      ║"
Write-Host "║     avec les valeurs fournies.                ║"
Write-Host "║                                               ║"
Write-Host "║  Puis lance :                                 ║"
Write-Host "║     docker compose up -d                      ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
