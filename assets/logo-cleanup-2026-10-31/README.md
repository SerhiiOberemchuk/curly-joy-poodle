# Очищення фону логотипа — 31.10.2026

Власник дозволив прибрати жовтувату паперову підкладку, зі збереженням
зареєстрованого знака. Новий дизайн, нові шрифти, переколір пуделя й додавання
позначень до логотипа не входили в завдання.

## Фінальний файл

- Джерело: `public/logo_brand.jpg`, оригінал збережений без змін.
- Результат: `public/images/brand/logo-brand-clean.png`, RGBA 1024 × 1024.
- Обробка: `remove-paper.mjs`, наявна в проєкті бібліотека Sharp.
- Перевірка: `verification.json`.
- `comparison.png`: оригінал ліворуч, очищена версія праворуч на тлі хедера.
- `preview-cream.png`: очищена версія на тлі `#fcf8f4` для огляду.

Фінальний файл отримано з вихідних пікселів JPEG, без масштабування,
перемальовування чи трасування. Фон перетворено на прозорість, на його межі
прибрано домішку паперового кольору з напівпрозорих країв. 361 807 захищених
темних і кольорових пікселів звірено з оригіналом: RGB та координати збережені,
прозорість цих пікселів дорівнює 255. Для країв виконується локальний alpha
matting; це очищення растра, а не юридична експертиза знака.

Зображення підключене в хедері, футері та `OnlineStore` JSON-LD. Вихідний
JPEG залишається доступним за старою адресою.

## Пробне редагування вбудованим image_gen

Спочатку виконано built-in image_gen background-extraction з прозорим фоном.
CLI/API fallback не використовувався. Власнику сподобався вигляд прозорого PNG.
Однак порівняння виявило зміну деяких форм і відтінків, тому згенерований растр
не підключено до сайту. Фінальне очищення зберігає вихідні елементи логотипа.

Промпт пробного редагування:

> Use case: background-extraction. Input Image 1 is the exact EDIT TARGET: the existing registered Curly Joy trademark, a 1024x1024 square JPG. This is conservative background cleanup only, NOT logo generation or redesign. Remove ONLY the pale yellow/ivory paper background and paper texture everywhere, both outside and inside the circular black outline, including spaces and counters around the existing letters and dog, replacing that pale paper with genuine fully transparent alpha. Preserve ALL existing foreground artwork in its EXACT original position, dimensions, shape, proportions, colors and lettering. Keep the complete black circular ring at its exact thickness and original bounds; keep the original black word CURLY on the upper arc and JOY on the lower arc, original glyphs, spacing and curvature; keep the exact original orange poodle face, eyes, hair, ears, black nose/mouth and red tongue pixel-faithfully. Do not redraw, vectorize, straighten, simplify, smooth, sharpen, recolor, retypeset, crop, rotate, shift, upscale or add anything. Preserve the original square 1024x1024 canvas and original transparent margins around the ring. Preserve the original slightly hand-drawn irregularities. Preserve original foreground RGB pixels wherever possible; only change the alpha of the paper background and clean edge contamination. No new ® symbol, no watermark, no new text, no shadow, no glow, no paper left. Return a transparent PNG of the SAME mark with only its yellow paper backing removed.
