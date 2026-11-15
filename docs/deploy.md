# Деплой на Vercel

Проєкт використовує Next.js 16.4.0. Каталог і оформлення працюють з
акаунтом магазину в Obriym CRM.

## Змінні оточення

| Змінна | Призначення |
| --- | --- |
| `SITE_URL` | Канонічна HTTPS-адреса сайту, наприклад `https://curly-joy.com`. З неї будується URL повернення після банку. Без неї production використовує `site.url` (`https://curly-joy.com`); для preview-деплою з власним доменом задайте явно. |
| `OBRIYM_CRM_API_KEY` | Токен акаунта магазину: `products:read`, `orders:read/write`, `payments:read/write`, `shipments:read`, `leads:write` (запит B2B), `reviews:read`, `reviews:write`. Для відгуків потрібне джерело інтеграції CRM. |
| `OBRIYM_CRM_API_URL` | Необов’язково. За замовчуванням `https://obriym-crm.com/api/v1`. |
| `CHECKOUT_SESSION_PASSWORD` | Необов’язковий стабільний секрет сесії, щонайменше 32 символи. Без нього використовується серверний ключ CRM. |
| `PARTNER_PORTAL_URL` | Необов’язково. Кабінет партнера (B2B) у CRM, за замовчуванням `https://obriym-crm.com/portal`. |

Ключі банку й Нової пошти зберігаються тільки в CRM. Локального журналу
замовлень і платіжних mock/sandbox режимів немає.

Після зміни змінних у Vercel → Settings → Environment Variables потрібен Redeploy.

## Runtime

Використовуйте Node.js 24.15+ або 22.22.2+ у межах `engines` package.json.
Після оновлення native-залежностей перезапустіть локальний dev-сервер;
production отримує нові пакети тільки після розгортання.

## Перед запуском

- У CRM активні Monobank і Нова пошта.
- Токен сайту має перелічені scopes та прив’язаний integration source.
- Для ТТН у CRM збережені контакт, місто та пункт відправлення відправника.
- Для автоматичних ТТН увімкнена відповідна автоматизація CRM.
- CRM приймає поле `source` у `POST /leads` (з 2026-10-10). До цього CRM
  відхиляє запит B2B з джерелом `partner` (400).
- Іконка «Особистий кабінет» з’являється сама, коли CRM віддає
  `customerAccount.url` у `/capabilities`: потрібні деплой CRM, адреса
  магазину й увімкнений кабінет у налаштуваннях CRM. Змінна сайту для цього
  не потрібна.
- Microsoft Clarity вмикається сам у Production-деплої Vercel
  (`VERCEL_ENV`, системна змінна; у Settings → Environment Variables має бути
  увімкнено «Automatically expose System Environment Variables»). Окремої
  змінної не потрібно. У налаштуваннях проєкту Clarity маскування — Balanced
  або Strict.
- `npm run lint`, `npm test`, `npm run typecheck` проходять.

## Після деплою

Перевірте каталог, вибір міста, пункту отримання та кур’єрської адреси.
Оформіть погоджене тестове замовлення: його номер має з’явитися в CRM,
банк має повернути на `/checkout/success`, а оплачений статус — надійти з CRM.
Повторна оплата має відкривати те саме замовлення, а зміна кошика під час
оплати не повинна втрачати нові товари.

Заміна API-токена або секрету сесії завершує попередні checkout-сесії.
Для замовлень, створених старим платіжним потоком, звірте платежі окремо
перед розгортанням міграції.

## Bing IndexNow після production-деплою

Workflow `.github/workflows/bing-indexnow.yml` реагує на `deployment_status`
зі станом `success`, середовищем `Production` і автором `vercel[bot]`.
Він читає актуальний `https://curly-joy.com/sitemap.xml` і надсилає всі його
унікальні URL у `https://www.bing.com/indexnow`, пакетами до 10 000 URL.
Адреси товарів, колекцій і категорій беруться з опублікованого sitemap,
який використовує каталог CRM.

Файл `public/8fe6cf496c114862978765ba251b72f7.txt` має містити тільки ключ
IndexNow та бути доступним за однойменною адресою в корені production-домену.
Це публічний TXT-файл підтвердження домену. Додатковий Bing API token,
GitHub secret або змінна Vercel для нього не потрібні.

Для активації workflow, скрипт і файл ключа мають потрапити до `main`,
а файл ключа — у production-деплой. У Vercel → Settings → Git залиште
увімкненими `deployment_status` Events; GitHub Actions також мають бути
дозволені в репозиторії. Перевірений для цього проєкту Vercel payload має
`environment: Production`; на прапорець `production_environment` workflow
не спирається. Workflow бере скрипт із default branch, тому він доступний
і після повернення до старішої версії сайту.

Перед надсиланням скрипт перевіряє публічний файл ключа й sitemap.
Невідповідний ключ, порожній або невалідний XML, URL іншого origin,
редирект чи HTTP-помилка зупиняють операцію. Для мережевих помилок і 5xx
є до трьох спроб; 429 та інші відмови Bing завершують job із помилкою.
Невдала індексація видима в GitHub Actions і не змінює стан успішного деплою.
Якщо збій стався після прийняття попередніх пакетів, повторний запуск
надсилає весь поточний sitemap ще раз.

У GitHub → Actions → **Bing IndexNow after production deployment** →
**Run workflow** можна виконати перевірку (`dry_run` увімкнено за
замовчуванням) або повторне надсилання (`dry_run` вимкнено).
Локальна перевірка без POST у Bing:

```sh
npm run indexnow:submit -- --site=https://curly-joy.com --dry-run
```

Для ручного надсилання приберіть `--dry-run`. Обидва режими перевіряють
ключ саме на опублікованому сайті. Скрипт використовує Node.js і вже
встановлений `jsdom` для XML; workflow встановлює devDependencies без
build hooks і не запускає production build. При зміні домену оновіть
`--site` у workflow разом із канонічним `site.url`.

HTTP 200 означає прийняття URL, HTTP 202 — очікування перевірки ключа.
Це сповіщення пошуковику; рішення й час індексації визначає Bing.
Зміни каталогу в CRM без нового деплою самі цей workflow не запускають.

Протокол: [IndexNow](https://www.indexnow.org/documentation).
Тригер: [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github#silence-deployment-notifications-on-pull-requests).

## Домен

Vercel → Settings → Domains: додайте `curly-joy.com` і `www.curly-joy.com`.
Міняйте лише DNS-записи сайту; MX і TXT пошти залиште без змін.
