---
name: docs-gaps
description: Identify gaps in documentation by ensuring only necessary types are exported and that exported types have valid JSDocs comments. This skill helps maintain accurate and concise API documentation by checking for unreferenced exports and adjusting them accordingly.
---

# Documentation Gaps

## Overview

Use this skill to identify gaps in documentation by ensuring only necessary types are exported and that exported types have valid JSDocs comments.

## Workflow

This workflow applies for a single package. If operating on multiple packages, repeat for each package and commit individually. All work should be done from the `docs/` directory for proper execution of scripts.

### Phase 1 - Make sure only necessary types are exported

First, remove ALL exported **types** from `index.ts` and any other `package.json` `exports` files for the package. Do not remove runtime API exports. Commit these changes.

Second, generate documentation `pnpm run docs` from the `docs/` directory and look for any comments of the format `[warning] {API}, defined in {FILE}, is referenced by {API} but not included in the documentation` that are referring to APIs within the package

Third, adjust the source code to export those APIs so the warnings go away. You might need to export the API from it's source file to make it available for re-export through the top-level export file. Commit these changes.

### Phase 2 - Make sure all exported types have valid JSDocs comments

Generate docs via `pnpm run docs` and look for warnings of the format `WARN: missing comment for API: {API}` for APIs in the current package. For each of these, review the source code and add a JSDoc comment at the definition-site of that API.

Repeat until all warnings for the current package are gone.
