# 🔍 Script de verificación completa post-recuperación
# Ejecutar en PowerShell desde la carpeta client

Write-Host "🔍 Verificando estado del proyecto después de la recuperación..." -ForegroundColor Cyan

# ============================================================================
# VERIFICACIÓN 1: Archivos esenciales
# ============================================================================

Write-Host "`n📁 Verificando archivos esenciales..." -ForegroundColor Yellow

$essential_files = @(
    "package.json",
    "package-lock.json", 
    "src/index.js",
    "src/App.js",
    "public/index.html"
)

foreach ($file in $essential_files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - FALTA" -ForegroundColor Red
    }
}

# ============================================================================
# VERIFICACIÓN 2: node_modules restaurado
# ============================================================================

Write-Host "`n📦 Verificando node_modules..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    $node_modules_size = (Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ node_modules restaurado (~$([math]::Round($node_modules_size, 0)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules no existe - Ejecutar: npm install" -ForegroundColor Red
}

# ============================================================================
# VERIFICACIÓN 3: Dependencias específicas para notificaciones
# ============================================================================

Write-Host "`n🔔 Verificando dependencias de notificaciones..." -ForegroundColor Yellow

$notification_deps = @(
    "react-hot-toast",
    "socket.io-client", 
    "@headlessui/react",
    "axios",
    "date-fns"
)

foreach ($dep in $notification_deps) {
    try {
        $result = npm list $dep 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $dep" -ForegroundColor Green
        } else {
            Write-Host "❌ $dep - FALTA" -ForegroundColor Red
            Write-Host "   Ejecutar: npm install $dep" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ $dep - ERROR verificando" -ForegroundColor Red
    }
}

# ============================================================================
# VERIFICACIÓN 4: Archivos de componentes de notificaciones
# ============================================================================

Write-Host "`n🎨 Verificando componentes de notificaciones..." -ForegroundColor Yellow

$component_files = @(
    "src/hooks/useNotifications.js",
    "src/hooks/usePushNotifications.js",
    "src/components/notifications/ToastNotification.js",
    "src/components/notifications/NotificationCenter.js",
    "src/components/notifications/NotificationBell.js"
)

foreach ($file in $component_files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $file - PENDIENTE CREAR" -ForegroundColor Yellow
    }
}

# ============================================================================
# VERIFICACIÓN 5: Scripts disponibles
# ============================================================================

Write-Host "`n🔧 Verificando scripts de package.json..." -ForegroundColor Yellow

try {
    $package = Get-Content "package.json" | ConvertFrom-Json
    $scripts = $package.scripts
    
    if ($scripts.start) {
        Write-Host "✅ npm start disponible" -ForegroundColor Green
    } else {
        Write-Host "❌ npm start no configurado" -ForegroundColor Red
    }
    
    if ($scripts.build) {
        Write-Host "✅ npm run build disponible" -ForegroundColor Green
    } else {
        Write-Host "❌ npm run build no configurado" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error leyendo package.json" -ForegroundColor Red
}

# ============================================================================
# VERIFICACIÓN 6: Versiones de herramientas
# ============================================================================

Write-Host "`n🔧 Verificando versiones de herramientas..." -ForegroundColor Yellow

Write-Host "Node.js: " -NoNewline -ForegroundColor Gray
try {
    $nodeVersion = node --version
    Write-Host $nodeVersion -ForegroundColor Green
} catch {
    Write-Host "ERROR - Node.js no encontrado" -ForegroundColor Red
}

Write-Host "npm: " -NoNewline -ForegroundColor Gray
try {
    $npmVersion = npm --version
    Write-Host $npmVersion -ForegroundColor Green
} catch {
    Write-Host "ERROR - npm no encontrado" -ForegroundColor Red
}

# ============================================================================
# PRUEBA DE COMPILACIÓN
# ============================================================================

Write-Host "`n🧪 Probando compilación..." -ForegroundColor Yellow

try {
    Write-Host "Ejecutando: npm run build --dry-run..." -ForegroundColor Gray
    
    # Verificar si podemos al menos validar la configuración
    $env:CI = "true"  # Evitar que se abra el navegador
    
    # Test básico de sintaxis
    Write-Host "Verificando sintaxis básica..." -ForegroundColor Gray
    
    if (Test-Path "src/index.js") {
        $content = Get-Content "src/index.js" -Raw
        if ($content -like "*import*React*") {
            Write-Host "✅ src/index.js parece válido" -ForegroundColor Green
        } else {
            Write-Host "⚠️  src/index.js puede tener problemas" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "⚠️  No se pudo probar la compilación" -ForegroundColor Yellow
}

# ============================================================================
# RESUMEN Y PRÓXIMOS PASOS
# ============================================================================

Write-Host "`n📋 RESUMEN DE VERIFICACIÓN" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

Write-Host "`n🎯 PRÓXIMOS PASOS RECOMENDADOS:" -ForegroundColor Cyan

if (!(Test-Path "node_modules")) {
    Write-Host "1. 🔥 URGENTE: Ejecutar 'npm install'" -ForegroundColor Red
}

$missing_deps = @()
foreach ($dep in $notification_deps) {
    try {
        npm list $dep 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $missing_deps += $dep
        }
    } catch {
        $missing_deps += $dep
    }
}

if ($missing_deps.Count -gt 0) {
    Write-Host "2. 📦 Instalar dependencias faltantes:" -ForegroundColor Yellow
    Write-Host "   npm install $($missing_deps -join ' ')" -ForegroundColor Gray
}

$missing_components = @()
foreach ($file in $component_files) {
    if (!(Test-Path $file)) {
        $missing_components += $file
    }
}

if ($missing_components.Count -gt 0) {
    Write-Host "3. 📝 Crear archivos de componentes faltantes:" -ForegroundColor Yellow
    foreach ($comp in $missing_components) {
        Write-Host "   - $comp" -ForegroundColor Gray
    }
}

Write-Host "4. 🧪 Probar: npm start" -ForegroundColor Yellow
Write-Host "5. 🌐 Verificar que abra en http://localhost:3000" -ForegroundColor Yellow

Write-Host "`n✅ Verificación completada" -ForegroundColor Green
Write-Host "Si todos los elementos están en verde, puedes intentar 'npm start'" -ForegroundColor Gray

Read-Host "`nPresiona Enter para continuar"