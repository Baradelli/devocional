# Templates de config (lint / format / editor)

Configs prontas para o padrão do projeto. O Claude Code deve colocá-las na raiz do monorepo no M0 (o `.vscode/settings.json` versionado garante fix-on-save para qualquer um que abra o repo).

## Princípio
- **Prettier formata, ESLint faz lint.** Sem sobreposição.
- `eslint-config-prettier` (carregado por último na flat config) desliga as regras de estilo do ESLint que conflitariam com o Prettier.
- **NÃO usar `eslint-plugin-prettier`** (rodar Prettier dentro do ESLint é desencorajado: lento e com erros confusos).
- Import sort por `eslint-plugin-simple-import-sort` — auto-fixável, roda no save.
- `source.organizeImports` fica `never` no VS Code para não brigar com o sort do ESLint.

## Instalar (devDependencies na raiz do workspace)
```
pnpm add -Dw eslint typescript-eslint @eslint/js eslint-config-prettier \
  eslint-plugin-simple-import-sort eslint-plugin-import globals \
  prettier husky lint-staged
```

## Arquivos
- `eslint.config.mjs` — flat config (ESLint 9). Ajuste os globs dos pacotes conforme a estrutura final.
- `.prettierrc.json` — config mínima do Prettier (defaults são bons; resista a configurar demais).
- `.vscode/settings.json` — fix-on-save + Prettier como formatter. Versionar no repo.

## Scripts sugeridos (package.json raiz)
```
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc -b --noEmit"
```

## pre-commit (lint-staged)
Rodar nos arquivos staged: `eslint --fix` e `prettier --write`. CI roda `typecheck`, `lint`, `format:check` e testes — e bloqueia o PR em qualquer falha (defesa contra `--no-verify`).

## Segurança da supply chain
Plugins de lint rodam no seu ambiente e no CI. Já houve pacotes maliciosos publicados nesse ecossistema. Mantenha as versões fixas no lockfile (pnpm já faz) e revise upgrades desses pacotes.
