# Using Skills in Spylitic

Skills are specialized sets of instructions and tools that extend my capabilities for specific tasks. They are like "expert modules" that I can load to handle complex workflows better.

## Where Skills are Located

Your skills are installed globally at:
`~/.gemini/antigravity/skills/skills/`

Each skill directory contains a `SKILL.md` file which defines when and how I should use it.

## How I Use Skills

1.  **Automatic Discovery**: When you ask me to do something (e.g., "Refactor this Ruby code"), I check my installed skills. If a skill like `ruby-pro` or `rails-best-practices` matches your request, I will read its instructions and apply them.
2.  **Explicit Request**: You can explicitly ask me to use a specific skill by name. For example:
    - *"Use the `postgresql` skill to optimize this query."*
    - *"Check my security using the `sast-configuration` skill."*
3.  **Task-Driven**: I proactively look for skills when I enter a `PLANNING` or `EXECUTION` phase if the task seems to fall within a specialized domain.

## Relevant Skills for Spylitic

Since this is a Rails project, the following skills are particularly useful:

| Skill Name | Purpose |
| :--- | :--- |
| `ruby-pro` | Advanced Ruby patterns, metaprogramming, and performance. |
| `rails-best-practices` | Ensuring idiomatic Rails code and architectural consistency. |
| `postgresql` | Database schema design, query optimization, and migrations. |
| `security-auditor` | Identifying vulnerabilities and checking best practices. |
| `docker-automation` | Managing the Docker environment for the project. |
| `tdd-workflow` | Assisting with Test-Driven Development cycles. |
| `github-actions` | Configuring CI/CD pipelines. |

## How to Explore Available Skills

You can see the full list of installed skills by running:
```bash
ls ~/.gemini/antigravity/skills/skills
```

If you see a skill that looks interesting, you can ask me: *"What does the [skill-name] skill do?"* and I will explain its purpose and workflow.
