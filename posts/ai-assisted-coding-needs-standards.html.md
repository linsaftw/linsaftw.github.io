# AI-assisted coding still needs standards

> Using AI does not remove engineering responsibility. It makes specifications, tests, and review more important.

- Author: LinsaFTW / Juan Cruz Linsalata
- Published: 2026-05-27
- Tags: coding, ai, engineering
- Canonical URL: https://linsaftw.arkflame.com/posts/ai-assisted-coding-needs-standards.html

I do not think using AI tools makes someone less of a developer. Developers have been using completion, generators, templates, search, documentation, and automation for years. The tool changed. The responsibility did not.

The real issue is quality. If someone uses AI to generate bad code, ships it without understanding, and does not test it, the problem is not only AI. The problem is bad engineering discipline. The same person would probably ship bad manually written code too, just slower.

For Minecraft plugins, this matters a lot. A small mistake can become a crash, a dupe, a memory leak, a Folia thread issue, a false positive in an anticheat, or a performance problem under load. AI can speed up implementation, but it can also speed up mistakes if the specification is vague.

The workflow I prefer is strict. Define the bug. Point to files. State non-goals. Require real tests. Verify target APIs. Build. Inspect the diff. Run the server if needed. Read the logs. Then publish. The human still owns the result.

I care less about whether code was typed by hand and more about whether the plugin works, performs well, is maintainable, and solves the actual problem for server owners.
