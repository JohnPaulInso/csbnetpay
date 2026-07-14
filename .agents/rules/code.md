---
trigger: manual
---

- Think deeply before coding, but keep thoughts strictly brief and technical.
- Only change exactly what you were asked to. Do not refactor unrelated code.
- **CRITICAL:** DO NOT output any code blocks directly in the chat response. All code modifications must be applied exclusively to the file editor/index files. The chat response must contain absolutely zero code snippets, zero code summaries, and zero markdown code blocks.
- For requested fixes: Add a single-line comment above the change with the date (2026-07-13), the fix summary, and previous state. Keep it brief.
- Only label/name unlabeled classes, IDs, or divs IF they are directly inside the component or block you are currently fixing. Do not scan the whole file.
- Class/ID names must be highly descriptive based on function. Add a 3-5 word comment max for its purpose.
