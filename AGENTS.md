<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- ZadkAI data (profile, meals, weight, frequent meals) lives in browser localStorage via src/lib/zadk-store.ts; src/lib/trpc.ts mimics the original tRPC hooks so the ported Home.tsx stays verbatim. Why: user chose local storage over a backend.
- AI meal analysis and calorie suggestions run in server functions (src/lib/zadk-ai.functions.ts) via Lovable AI Gateway. Why: keys stay server-side.
