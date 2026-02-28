# Algorand Examples — WebFetch Reference

Quick reference for fetching Algorand code examples using WebFetch with raw GitHub URLs.

## Methods

| Method | URL Pattern | Purpose |
|--------|-------------|---------|
| File contents | `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` | Read file contents (plain text) |
| Directory listing | `https://api.github.com/repos/{owner}/{repo}/contents/{path}` | List directory entries (JSON) |
| Knowledge docs | `get_knowledge_doc` (Algorand MCP) | Algorand developer documentation |

## Fetching File Contents

Use `raw.githubusercontent.com` to get file contents directly as plain text.

**URL Format:**
```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
```

**Examples:**

```
# Get a specific contract
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/puya-ts/main/examples/voting/contract.algo.ts

# Get a test file
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/puya-ts/main/examples/voting/contract.spec.ts

# Get devportal example
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/devportal-code-examples/main/projects/typescript-examples/contracts/HelloWorld/contract.algo.ts

# Get a Python example
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/puya/main/examples/voting/contract.py

# Get README or docs
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/algokit-utils-ts/main/README.md
WebFetch url:https://raw.githubusercontent.com/algorandfoundation/algokit-utils-ts/main/CHANGELOG.md
```

## Listing Directory Contents

Use `api.github.com` to list files in a directory.

**URL Format:**
```
https://api.github.com/repos/{owner}/{repo}/contents/{path}
```

**Examples:**

```
# List examples directory
WebFetch url:https://api.github.com/repos/algorandfoundation/puya-ts/contents/examples

# List repo root
WebFetch url:https://api.github.com/repos/algorandfoundation/devportal-code-examples/contents

# List TypeScript contracts
WebFetch url:https://api.github.com/repos/algorandfoundation/devportal-code-examples/contents/projects/typescript-examples/contracts

# List Python contracts
WebFetch url:https://api.github.com/repos/algorandfoundation/devportal-code-examples/contents/projects/python-examples/contracts

# List specific branch
WebFetch url:https://api.github.com/repos/algorandfoundation/puya-ts/contents/examples?ref=main
```

## Searching for Code Patterns

For searching code across repositories, use web search:

```
# Search for BoxMap usage in TypeScript
Web search: "BoxMap site:github.com/algorandfoundation language:typescript"

# Search for inner transactions
Web search: "itxn site:github.com/algorandfoundation"

# Search for ARC-4 implementations
Web search: "arc4 abimethod site:github.com/algorandfoundation"
```

## Using Knowledge Base (Algorand MCP)

For Algorand developer documentation, use `get_knowledge_doc` or `list_knowledge_docs` from the Algorand MCP server (Remote Full or Local):

```
# List available documents in a category
list_knowledge_docs { "prefix": "arcs" }

# Get specific documentation
get_knowledge_doc { "documents": ["arcs:specs:arc-0003.md"] }
get_knowledge_doc { "documents": ["algokit:docs:get-started.md"] }
```

**Knowledge categories:** `arcs`, `sdks`, `algokit`, `algokit-utils`, `tealscript`, `puya`, `liquid-auth`, `python`, `developers`, `clis`, `nodes`, `details`

## Priority Repositories

| Repository | Path | Content |
|------------|------|---------|
| `devportal-code-examples` | `projects/typescript-examples/contracts/` | Beginner TypeScript |
| `devportal-code-examples` | `projects/python-examples/contracts/` | Beginner Python |
| `puya-ts` | `examples/` | Advanced TypeScript (voting, amm, auction) |
| `puya` | `examples/` | Advanced Python |
| `algokit-typescript-template` | `/` | Project template |
| `algokit-utils-ts` | `src/` | Utility library |

## Common Patterns Location

| Pattern | Repository | Path |
|---------|------------|------|
| Box storage | devportal-code-examples | `contracts/BoxStorage/` |
| BoxMap | puya-ts | `examples/voting/`, `examples/amm/` |
| Inner transactions | devportal-code-examples | `contracts/` |
| ARC-4 methods | puya-ts | `examples/hello_world_arc4/` |
| State management | devportal-code-examples | `contracts/` |
