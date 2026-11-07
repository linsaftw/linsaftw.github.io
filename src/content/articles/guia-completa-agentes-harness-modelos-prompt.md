---
title: "Guia Completa: Agentes, Harness, Modelos, Prompt Engineering y MCPs"
description: "A summary of a Spanish-language guide to AI coding agents: skills, AGENTS.md, harnesses, subscriptions, model choice, MCP servers, RTK and closing workflow advice."
publishedAt: 2026-11-06
updatedAt: 2026-11-07
tags: ["ai", "agents", "prompting", "tooling"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/guia-completa-agentes-harness-modelos-prompt.html"
draft: false
---

This article summarizes a Spanish-language guide posted on r/devsarg on 2026-11-06 by u/LinsaFTW. The original is titled "[Guia Completa] Agentes, Harness, Modelos, Prompt Engineering y MCPs". Prices, model names and recommendations are the author's views as of that date. The interactive version is at [the guide](/guide.html).

## Skills

The author names two useful skills: ui-ux-pro-max and unslop. Three are named as useless: Caveman, Ponytail and Superpowers.

The author's method is to notice which prompts you repeat and turn them into a skill.

## AGENTS.md

The post refers to an earlier lean-agents example. The prompts from that example, and other instructions you can add to AGENTS.md, are shown as images in the original, so this summary does not reproduce them.

## Harness

The author advises against two harnesses:

- CommandCode: saturates the context and does not orchestrate subagents well, even with the same model.
- Codex: fills the context faster than other alternatives.

## Subscriptions

The post gives these prices and token amounts. The author writes "billones", which in Spanish means trillion, so check the figures on each provider's page before you rely on them.

- OpenCode GO: $10 per month, with 8 billones of DeepSeek v4.1 tokens per month. The author calls it a beast.
- OpenDesign GO: $10 per month, with 5 billones of DeepSeek v4.1 tokens per month. The author calls it good.
- CommandCode GOAT: $10 per month, with 5 billones of DeepSeek v4.1 tokens per month. The author calls it good, although the post advises against the CommandCode harness.
- Other subscriptions, such as Xiaomi, Alibaba, Minimax, GLM and Kimi: the author says they are all bad and should never be used.

## Models

The post says the right model depends on the work. Its rule of thumb:

- Claude for backend and frontend: Sonnet 5.5 low with Haiku 5.5 low.
- GPT for backend and frontend: GPT 6 Luna MAX.
- Everything else in backend and frontend: DeepSeek v4.1 Flash, which the author says lasts all day.

## MCP servers

The post names three MCP servers as the best:

- chrome-devtools: lets the agent interact with Chrome.
- exa: online search when you need it.
- mongodb: simpler interaction with real databases.

## RTK

The post has a section titled "RTK (no es lo mismo que RKT)", which means "RTK is not the same as RKT". Its body is not in the text this summary was written from, so this article does not describe RTK.

## Closing advice

The author ends with a workflow recommendation:

1. Do not be lazy. While an agent works, start on the next task and prepare it.
2. Run multiple subagents and use virtual desktops. The post's example is a two-row indicator in the KDE Plasma taskbar for switching between agents quickly.
3. Keep agents organized with two lists, "running" and "pending". Read what they write.
4. Do not accept "done" on its own. Read the pros and cons, or whether the work is partial, and check how it turned out.
5. When an agent makes a mistake, document it and improve AGENTS.md so it does not repeat the mistake.

The author calls it the first guide they have written and asks readers to add corrections, mini-guides and missed points in the comments.

Source: [original Reddit post](https://www.reddit.com/r/devsarg/comments/1xpe4kk/guia_completa_agentes_harness_modelos_prompt/).
