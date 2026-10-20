/**
 * ============================================================================
 * ARCHUNIT / ARCH-CONTRACT — VALIDADOR DE FRONTEIRAS ARQUITETURAIS DO CINEBG
 * ============================================================================
 * Regras verificadas:
 * 1. src/types/** não deve importar de pages, components, services, store ou hooks.
 * 2. src/utils/** não deve importar de pages ou components.
 * 3. src/components/ui/** não deve importar de pages.
 * 4. src/services/** não deve importar de pages ou components.
 * 5. Observabilidade, Motion Principles e Skeletons devem estar presentes.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')

function walkFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

function extractImports(content) {
  const imports = []
  const regex = /from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1])
  }
  return imports
}

const files = walkFiles(SRC_DIR)
const violations = []

for (const file of files) {
  const rel = path.relative(SRC_DIR, file).replace(/\\/g, '/')
  const content = fs.readFileSync(file, 'utf8')
  const imports = extractImports(content)

  // Rule 1: src/types/** is pure
  if (rel.startsWith('types/')) {
    for (const imp of imports) {
      if (/^@\/(pages|components|services|store|hooks)/.test(imp) || /\.\.\//.test(imp)) {
        violations.push(`[Regra 1 - Pure Types] ${rel} importa camada superior proibida: "${imp}"`)
      }
    }
  }

  // Rule 2: src/utils/** cannot import pages or components
  if (rel.startsWith('utils/')) {
    for (const imp of imports) {
      if (/^@\/(pages|components)/.test(imp)) {
        violations.push(`[Regra 2 - Utils Boundary] ${rel} importa camada de UI proibida: "${imp}"`)
      }
    }
  }

  // Rule 3: src/components/ui/** cannot import pages
  if (rel.startsWith('components/ui/')) {
    for (const imp of imports) {
      if (/^@\/pages/.test(imp)) {
        violations.push(`[Regra 3 - UI Component Isolation] ${rel} importa página proibida: "${imp}"`)
      }
    }
  }

  // Rule 4: src/services/** cannot import pages or components
  if (rel.startsWith('services/')) {
    for (const imp of imports) {
      if (/^@\/(pages|components)/.test(imp)) {
        violations.push(`[Regra 4 - Services Layer Boundary] ${rel} importa camada de apresentação proibida: "${imp}"`)
      }
    }
  }
}

// Rule 5: Verify core integrity artifacts exist
const requiredFiles = [
  'src/utils/motion.ts',
  'src/components/ui/SkeletonCard.tsx',
  'src/components/ui/LazyImage.tsx',
  'src/components/ui/ProgressBar.tsx',
  'src/services/observability.ts',
  'AGENTS.md',
  'biome.json',
  'commitlint.config.js',
  'knip.json',
  'stryker.config.json',
  'codecov.yml',
]

for (const reqFile of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, reqFile))) {
    violations.push(`[Regra 5 - Core Artifacts] Arquivo obrigatório ausente: ${reqFile}`)
  }
}

if (violations.length > 0) {
  console.error('❌ [Arch-Contract] Violações arquiteturais encontradas:')
  for (const v of violations) {
    console.error(`  - ${v}`)
  }
  process.exit(1)
} else {
  console.log(`✅ [Arch-Contract] ${files.length} módulos validados com 0 violações de fronteira arquitetural.`)
}
