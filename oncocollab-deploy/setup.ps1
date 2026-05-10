# ============================================================
# setup.ps1 — OncoCollab (Windows PowerShell)
# Initialise les fichiers de configuration à partir des exemples
# Usage : .\setup.ps1
# ============================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   OncoCollab — Configuration initiale         ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

function Copy-IfMissing {
    param($src, $dst)
    if (Test-Path $dst) {
        Write-Host "  ⏭  Déjà présent : $dst"
    } else {
        Copy-Item $src $dst
        Write-Host "  ✅ Créé         : $dst"
    }
}

Write-Host "📋 Création des fichiers de configuration..."
Write-Host ""

Copy-IfMissing ".env.example"                              ".env"
Copy-IfMissing ".env.backend.example"                      ".env.backend"
Copy-IfMissing ".env.postgres.example"                     ".env.postgres"
Copy-IfMissing ".env.mongo.example"                        ".env.mongo"
Copy-IfMissing "olga-designer\.env.back.example"           "olga-designer\.env.back"
Copy-IfMissing "olga-designer\.env.mysql.example"          "olga-designer\.env.mysql"
Copy-IfMissing "olga-designer\config\config.json.example"  "olga-designer\config\config.json"
Copy-IfMissing "olga-designer\config\apiKey.json.example"  "olga-designer\config\apiKey.json"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║  ✅ Fichiers créés avec succès !              ║"
Write-Host "╠══════════════════════════════════════════════╣"
Write-Host "║  👉 Remplis les fichiers .env créés           ║"
Write-Host "║     puis lance : docker compose up -d         ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
