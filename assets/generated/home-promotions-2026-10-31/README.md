# Промобанери Curly Joy — 31.10.2026

Створені вбудованим `image_gen` за композицією трьох нижніх промобанерів
`public/images/home/client-reference.jpg`. Усі три PNG мають **1774 × 887 px**.
Це згенеровані промоілюстрації, а не фотографії конкретних товарів каталогу.

| Банер | Незмінений PNG-оригінал | Версія для сайту |
| --- | --- | --- |
| Новинки | [promo-new-v2.png](promo-new-v2.png) | [WebP](../../../public/images/home/promo-new-v2.webp), 148 670 байтів |
| Сезонні добірки | [promo-season-v2.png](promo-season-v2.png) | [WebP](../../../public/images/home/promo-season-v2.webp), 180 726 байтів |
| Одягаємось разом | [promo-together-v2.png](promo-together-v2.png) | [WebP](../../../public/images/home/promo-together-v2.webp), 184 572 байти |

Повний набір промптів: [prompts.json](prompts.json). Текст і кнопки відсутні
у зображеннях та накладаються як HTML. WebP створено з PNG через встановлений
`sharp`, quality 90, без зміни розміру.

Підключення: `src/features/home/components/home-sections.tsx` (`next/image`,
`fill`, адаптивні `sizes`, звичайне lazy loading). Старий атлас фотографій
більше не використовується цими банерами. Логотип, основний hero та фотографії
реальних товарів збережено.

Перевірки: TypeScript 7, ESLint без попереджень, `git diff --check`, браузерний
огляд при 1440 і 390 px. У перевіреній вкладці немає нових console errors/warnings.
Production build і deployment не виконувалися.

Браузерні знімки:
[desktop](../../../docs/design-qa-2026-10-31/promos-generated-desktop.jpg),
[mobile](../../../docs/design-qa-2026-10-31/promos-generated-mobile.jpg).
