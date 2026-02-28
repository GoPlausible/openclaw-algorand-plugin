
# Searching Algorand Examples

Find working contract examples and code patterns from Algorand Foundation repositories using WebFetch with raw GitHub URLs.

## Overview / Core Workflow

1. Identify what pattern or example the user needs
2. Use WebFetch to fetch raw file contents from priority GitHub repositories
3. Search priority repositories first (devportal-code-examples, puya-ts)
4. Retrieve the relevant file(s)
5. Also fetch corresponding test files when applicable

## How to proceed

1. **Determine what you need:**
   - Looking for a specific file → use WebFetch with the raw GitHub URL
   - Need to browse a directory → use WebFetch with the GitHub API: `https://api.github.com/repos/{owner}/{repo}/contents/{path}`
   - Looking for documentation → use `get_knowledge_doc` from Algorand MCP (Remote Full or Local)

2. **Search priority repositories first:**

   | Priority | Repository | Best For |
   |----------|------------|----------|
   | 1 | `algorandfoundation/devportal-code-examples` | Beginner-friendly patterns |
   | 2 | `algorandfoundation/puya-ts` | Advanced TypeScript examples |
   | 3 | `algorandfoundation/puya` | Python examples |
   | 4 | `algorandfoundation/algokit-*` | Templates and utilities |

3. **Fetch files with WebFetch:**

   ```
   # Get a specific file
   WebFetch url:https://raw.githubusercontent.com/algorandfoundation/puya-ts/main/examples/voting/contract.algo.ts

   # List directory contents (via GitHub API)
   WebFetch url:https://api.github.com/repos/algorandfoundation/puya-ts/contents/examples

   # Get a README or changelog
   WebFetch url:https://raw.githubusercontent.com/algorandfoundation/algokit-utils-ts/main/CHANGELOG.md

   # Get devportal examples
   WebFetch url:https://raw.githubusercontent.com/algorandfoundation/devportal-code-examples/main/projects/typescript-examples/contracts/HelloWorld/contract.algo.ts
   ```

4. **Always fetch test files:**
   - For any contract file, check for corresponding `*.spec.ts` or `*_test.py`
   - Tests show how to call methods and verify behavior

## Important Rules / Guidelines

- **Search algorandfoundation first** — Official repos have vetted, up-to-date examples
- **Always include test files** — They demonstrate correct usage patterns
- **Use raw.githubusercontent.com** for file contents — faster and returns plain text
- **Use api.github.com** for directory listings — returns JSON with file names and paths
- **Check file paths in devportal-code-examples:**
  - TypeScript: `projects/typescript-examples/contracts/`
  - Python: `projects/python-examples/contracts/`
- **Prefer puya-ts/examples for complex patterns** — Voting, AMM, auction examples are comprehensive

## Raw GitHub URL Patterns

```
# File contents (plain text)
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}

# Directory listing (JSON)
https://api.github.com/repos/{owner}/{repo}/contents/{path}

# Search code (JSON) - use web search as alternative
https://api.github.com/search/code?q={query}+org:algorandfoundation+language:typescript
```

## Common Variations / Edge Cases

| Scenario | Approach |
|----------|----------|
| Pattern not found in algorandfoundation | Use web search for broader GitHub results |
| Need Python instead of TypeScript | Use `algorandfoundation/puya` instead of `puya-ts` |
| Looking for deployment patterns | Check `algokit-*-template` repos |
| Need ARC standard implementation | Use `get_knowledge_doc` with `arcs` category |
| Need documentation | Use `get_knowledge_doc` or `list_knowledge_docs` from Algorand MCP |

## References / Further Reading

- [Tool Reference](./search-algorand-examples-reference.md)
- [DevPortal Code Examples](https://github.com/algorandfoundation/devportal-code-examples)
- [Puya TypeScript Examples](https://github.com/algorandfoundation/puya-ts/tree/main/examples)
- [Algorand Developer Portal](https://dev.algorand.co/)
