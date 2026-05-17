# Article editorial standard

This is the quality bar for automated and agent-authored Qsen articles.

Articles are published only when they are useful, specific, and tied to a real
tool. Do not publish text that feels like a mass AI article.

## Core standard

Each article must:

- answer one narrow search intent;
- solve a practical problem;
- lead naturally to one Qsen tool;
- include concrete details, examples, mistakes, checks, or scenarios;
- sound natural in its language;
- avoid filler and generic blog phrasing;
- have a clear CTA near the top and near the end;
- use correct language-specific tool links.

## Avoid

Do not use empty phrases like:

- "in today's fast-paced world"
- "in the modern world"
- "it is important to note"
- "this article will help you"
- "is an important tool"
- "in conclusion"
- "данная статья"
- "важно отметить"
- "в современном мире"
- "является важным инструментом"
- "в заключение"

Do not publish:

- keyword stuffing;
- generic summaries;
- weak intros;
- repeated paragraphs;
- placeholder examples;
- text that could apply to any tool;
- a direct RU-to-EN literal translation.

## Required structure

A strong article normally has:

1. CTA to the tool in the first 1-2 paragraphs.
2. H1.
3. A short intro that names the real problem.
4. Practical explanation with concrete scenarios.
5. Common mistakes, checklist, or decision criteria.
6. FAQ with 2-4 questions.
7. Final CTA to the same tool.

## SEO rules

- `title` and H1 must match the search intent naturally.
- `seo_title` should usually be 45-70 characters.
- `seo_description` should usually be 130-170 characters.
- Use natural related wording in subheadings.
- Do not repeat the same keyword unnaturally.
- Slugs must be readable, lowercase, and stable.

## Language rules

RU:

- natural Russian;
- no English calques;
- practical phrasing for Russian-speaking users;
- only `/ru/...` internal tool links.

EN:

- natural English;
- not a literal translation of the Russian article;
- only `/en/...` internal tool links.

## Self-review before publishing

Before an article is saved as `published`, verify:

- search intent is specific;
- text is useful without the tool, and stronger with the tool;
- CTA links are correct;
- no AI filler phrases;
- no broken UTF-8;
- no `???`;
- no duplicate topic/slug/translation key;
- RU and EN versions share one `translation_key`;
- both versions cover the same intent.
