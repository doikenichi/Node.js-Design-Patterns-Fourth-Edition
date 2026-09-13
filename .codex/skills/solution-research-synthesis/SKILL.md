---
name: solution-research-synthesis
description: Research, compare, and synthesize multiple realistic solution options when the user asks for a solution, recommendation, strategy, or implementation approach.
metadata:
  short-description: Compare realistic solution options before choosing one
---

# Solution Research Synthesis

Use this skill when the user asks for a solution, recommendation, strategy, implementation approach, architecture choice, design direction, or other goal-directed answer where multiple plausible approaches may exist.

Do not use it for tiny factual answers, commands with an obvious single action, or narrowly specified edits where the user has already chosen the solution.

## Research Budget

Spend up to 15 minutes gathering evidence, exploring alternatives, and stress-testing options. Stop earlier when additional research is unlikely to change the recommendation. If current facts, products, standards, APIs, laws, pricing, schedules, or benchmarks could materially affect the answer, verify them with authoritative and current sources before comparing options.

When external research is unavailable or unnecessary, do the same comparison using repository context, first principles, domain knowledge, and local evidence. State the evidence basis clearly.

## Workflow

1. Restate the goal and success criteria in practical terms.
2. Identify as many effective and realistic solution options as the time budget permits. Prefer options that a competent practitioner would actually consider, not decorative variants.
3. Evaluate each option against the same criteria: effectiveness, feasibility, complexity, cost, risk, maintainability, reversibility, time to value, and fit for the user's context.
4. Criticize the options against one another. Look for failure modes, hidden assumptions, operational burden, edge cases, adoption friction, and cases where an option is commonly overused.
5. Choose the best option, or synthesize a better hybrid when the strongest answer combines parts of multiple options. Be explicit about why the selected answer wins.
6. Provide concrete next steps or implementation guidance sized to the user's request.

## Mandatory Sections

Include these sections for each major solution option unless the user explicitly asks for a shorter answer:

- **Patterns:** Relevant design, architectural, and industry patterns. Name patterns only when they genuinely explain the option or its tradeoffs.
- **Conceptual Approach:** The high-level idea, mental model, and boundaries of the solution.
- **Technical Approach:** Concrete implementation details, components, algorithms, tools, integrations, data flow, or operational mechanics.
- **Pros:** Specific advantages in this context.
- **Cons:** Specific drawbacks, risks, and failure modes in this context.
- **Usually Intended For:** The original or typical intent behind this kind of solution.
- **Most Common Applications:** Where this solution is commonly used in practice.

After the option-by-option analysis, include:

- **Comparative Critique:** Directly compare the options and explain which tradeoffs dominate.
- **Recommended Solution:** Pick one option or a synthesized combination, with rationale and caveats.

## Output Style

Be rigorous but practical. Avoid filling the answer with generic theory when a decision needs to be made. If the answer depends on uncertain assumptions, name them and explain how they would change the recommendation. When the user needs implementation help, translate the recommendation into actionable steps rather than ending at analysis.
