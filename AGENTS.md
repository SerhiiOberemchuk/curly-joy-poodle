<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Обов’язкові правила проєкту

Повний стандарт: [docs/coding-standards.md](docs/coding-standards.md).
Ці правила застосовуються до всіх змін коду та рев’ю.

- Писати код на рівні senior: перед зміною визначити відповідальність функції,
  контракт, інваріанти, помилки та наслідки для користувача. Заборонені
  спекулятивні абстракції, дублювання стану та зайві обхідні рішення.
- Основою є підтримувані бібліотеки. Власна реалізація механізму бібліотеки
  допускається лише за доведеної відсутності придатного рішення; причину
  та обсяг винятку записувати в документації.
- Використовувати актуальні сумісні можливості встановленого Next.js.
  До зміни читати відповідні локальні інструкції `node_modules/next/dist/docs/`.
- Взаємодія браузера з бізнес-логікою — Server Functions / Server Actions.
  Не створювати локальні `api/route` для кошика, checkout, оплати чи довідників.
  Route Handler допустимий лише для зовнішнього протоколу, який цього вимагає.
- CRM є джерелом даних каталогу, залишків, замовлень, платежів і доставки.
  Заборонені вигадані залишки, ціни, статуси та mock-провайдери у production.
- TypeScript 7 перевіряти через `npm run typecheck`; ESLint — без помилок
  і попереджень. Не приховувати несумісність через `--force`,
  `--legacy-peer-deps`, `any`, необґрунтовані приведення чи вимкнення правил.
- Семантичний HTML, клавіатурна доступність і зрозумілі стани помилок
  є обов’язковими; декоративні елементи не повинні замінювати семантику.
- Виконувати перевірки, відповідні ризику зміни. Не стверджувати, що тести
  підтверджують браузер, банк, базу даних або production, якщо цього не перевіряли.
- Не запускати production build без прямого запиту користувача.
- Не делегувати написання коду іншим агентам без прямого доручення користувача.
