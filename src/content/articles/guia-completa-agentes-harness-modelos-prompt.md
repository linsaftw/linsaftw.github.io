---
title: "Guía completa: agentes, harness, modelos, prompt engineering y MCPs"
description: "A summary of a Spanish-language AI coding guide: write prompts yourself, keep operating rules in AGENTS.md, delegate to subagents, pick the harness and model by task, and keep context small."
publishedAt: 2026-11-06
updatedAt: 2026-11-06
tags: ["ai", "agents", "prompting", "tooling"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/guia-completa-agentes-harness-modelos-prompt.html"
draft: false
---

This article summarizes a Spanish-language guide posted on r/devsarg on 2026-11-06 by u/LinsaFTW. The original is titled "[Guia Completa] Agentes, Harness, Modelos, Prompt Engineering y MCPs". The author writes from about 13 years of programming and about 3 years of intensive AI-assisted coding. Those are the author's own claims. The full interactive version is at [the guide](/guide.html).

The guide makes one main argument: the quality of an AI coding session depends less on the model name and more on what you give the agent before it starts. That means a precise prompt, a short set of operating rules, delegated subagents that keep the main context clean, and a harness and model picked for the job.

## Prompt engineering

Write the prompt yourself. The author says models are trained on internet text and code, not on prompting, so a model-written prompt is usually weaker than one a person writes from a clear understanding of the problem.

A good prompt is detailed rather than perfect. It states the symptom, the steps that lead to it, the suspected area, the goal, and how to verify the result. Spelling mistakes are acceptable. The author recommends English, and allows Spanish only when English is a real barrier, because models are not fully trained on Spanish and the cost in tokens can be higher.

## Skills

Install few skills, and only ones with a specific behavior. The author names two that fit this rule: ui-ux-pro-max for structuring web pages, and unslop for removing generic AI phrasing from text. The author warns against large bundles such as Superpowers, which fill the context with material most tasks never need.

The author's method is to notice which prompts you repeat and turn those into a skill.

## AGENTS.md

AGENTS.md (or CLAUDE.md in Claude Code) is the file the agent reads before starting. The author calls it the most important piece of the setup. Their example defines a primary role, a delegated role, a no-recursive-delegation rule, and a tool routing table.

Three rules from the guide:

- Do not run the harness raw. Tell the agent to use subagents, so the main thread stays small.
- Run independent tasks in parallel with subagents, then have the orchestrator fix and merge the results.
- Set a goal at the start of long work. For tasks longer than about three hours, a stated goal survives compaction better than the conversation does.

The author also keeps output rules in AGENTS.md, such as short answers, one action per step, and no repeated recaps. Those rules are compressed into a few lines so they cost little context.

## Harness

The author uses two harnesses:

- Claude Code for Claude models, because the author says Claude models cost extra through other harnesses.
- OpenCode for the other subscriptions, mainly DeepSeek and GPT models, which the author describes as efficient in tokens.

The author advises against Pi, CommandCode, and Codex. The stated reasons are that Pi needs heavy customization to get the lightness it promises, that CommandCode saturates context and orchestrates subagents poorly, and that Codex fills context faster than the alternatives.

## Models

The author's rule of thumb is to match the model to the work:

- Claude for backend and frontend: Sonnet 5.5 low with Haiku 5.5 low.
- GPT for backend and frontend: GPT 6 Luna MAX.
- Everything else in backend and frontend: DeepSeek v4.1 Flash.
- 3D modeling, games, and complex animation or design: Opus, per the author. For ordinary work the author calls Opus overkill.

The author does not trust benchmark scores and prefers personal experience. Artificial Analysis is mentioned as a reference, with the same caveat. Model names and rankings change fast, so treat this list as dated to the post.

## MCP servers

The guide lists the MCP servers the author uses most:

- Serena: gives the agent a project view, so it navigates code without repeated grep.
- Context7: current library documentation, to reduce syntax mistakes.
- chrome-devtools: drives Chrome.
- exa: web search when needed.
- mongodb: direct access to real databases.
- context-mode: keeps large tool output in a sandbox and returns only the relevant part.

## RTK

RTK is a local proxy that intercepts command output and removes the parts the agent does not need. The author calls it fundamental and notes that it needs to be installed, its proxy started, and its plugins added where required.

## Takeaways

1. Write the prompt yourself, with the goal, the symptom, and a way to verify the result.
2. Put operating rules in AGENTS.md, and delegate parallel work to subagents to keep the main context clean.
3. Install few skills. Turn the prompts you repeat into skills.
4. Pick the harness by model family and token efficiency.
5. Pick the model by task, and check results on your own work instead of trusting benchmarks.

Source: [original Reddit post](https://www.reddit.com/r/devsarg/comments/1xpe4kk/guia_completa_agentes_harness_modelos_prompt/). The author's example repository, [lean-agents](https://github.com/Lean-LLM/lean-agents), is linked in the original post.
