# Building Smart Contracts

Create modern Algorand smart contracts in Algorand TypeScript (PuyaTs) or Algorand Python (PuyaPy) -- statically-typed subsets compiled to TEAL bytecode by the Puya compiler.

## Core Workflow

1. **Search documentation** for concepts and best practices
2. **Retrieve canonical examples** from priority repositories
3. **Generate code** adapting examples to requirements
4. **Include integration tests** using generated clients
5. **Build and test** with AlgoKit commands

## How to Proceed

1. **Search documentation first:**
   - Use `get_knowledge_doc` or `list_knowledge_docs` from the Algorand MCP server (Remote Full or Local) for conceptual guidance
   - Categories: `arcs`, `sdks`, `algokit`, `algokit-utils`, `tealscript`, `puya`, `developers`, `clis`, `nodes`
   - If MCP unavailable, use web search: `site:dev.algorand.co {concept}`

2. **Retrieve canonical examples:**
   - Use WebFetch with raw GitHub URLs from priority repositories:
   - Priority 1: `https://raw.githubusercontent.com/algorandfoundation/devportal-code-examples/main/`
   - Priority 2: `https://raw.githubusercontent.com/algorandfoundation/puya-ts/main/examples/` (TypeScript) or `https://raw.githubusercontent.com/algorandfoundation/puya/main/examples/` (Python)
   - Priority 3: `https://raw.githubusercontent.com/algorandfoundation/algokit-typescript-template/main/` or `https://raw.githubusercontent.com/algorandfoundation/algokit-python-template/main/`
   - Always include corresponding test files

3. **Generate code:**
   - Choose TypeScript or Python based on user preference
   - Adapt examples carefully, preserving safety checks
   - Follow syntax rules from the language-specific skill (`algorand-typescript` or `algorand-python`)

4. **Include tests:**
   - Always include or suggest integration tests
   - Use generated clients for testing contracts

5. **Build and test:**
   ```bash
   algokit project run build   # Compile contracts
   algokit project run test    # Run tests
   ```

## Important Rules

- **NEVER use PyTEAL or Beaker** -- these are legacy, superseded by Puya
- **NEVER write raw TEAL** -- always use Algorand TypeScript or Algorand Python
- **NEVER import external libraries** into contract code
- **Always search docs first** before writing code
- **Always retrieve examples** from priority repositories

## References

- [Detailed Workflow](./build-smart-contracts-reference.md)
