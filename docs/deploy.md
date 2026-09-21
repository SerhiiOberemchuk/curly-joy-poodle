# Деплой на HostiQ

Магазин — це Node.js-сервер Next.js, а не статичні файли. Для нього потрібен
постійно запущений процес `node`, а не лише вебсервер з PHP.

## Який тариф

| Тариф HostiQ                        | Чи підходить                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| **VPS kVPS50** (2 CPU, 4 GB, root)  | **Ціль.** Ubuntu без панелі, nginx + systemd, постійний диск для журналу замовлень.              |
| Віртуальний хостинг HQ10 (cPanel)   | Лише якщо в cPanel є «Setup Node.js App» з Node.js ≥ 20.9. У документації HostiQ це не описано. |

HQ10 — спільний хостинг під PHP-сайти, куплений помилково замість kVPS50.
Розділ про cPanel нижче лишається на випадок, якщо доведеться працювати на ньому.

Замовляючи kVPS50, оберіть Ubuntu 24.04 без панелі керування: cPanel для VPS
ліцензується окремо, а для Node.js-сервера він не потрібен.

## Як збирається застосунок

`next.config.ts` містить `output: "standalone"`. Після `npm run build`:

- `.next/standalone/server.js` — самодостатній сервер. Поруч лежать лише ті
  `node_modules`, які він справді використовує, тож `npm install` на сервері не потрібен.
- `postbuild` (`scripts/copy-standalone-assets.mjs`) копіює поруч `public/` і
  `.next/static/`, бо без CDN їх роздає сам `server.js`.
- `npm start` запускає `node .next/standalone/server.js`. Порт і адреса задаються
  через `PORT` і `HOSTNAME`.

### Збирати лише на Linux

Не збирайте пакет для сервера на Windows:

1. `sharp` (оптимізація зображень `next/image`) ставить бінарник під платформу
   збірки. Збірка з Windows містить лише `sharp-win32-x64`, тож на Linux-сервері
   зображення не оптимізуватимуться.
2. Next копіює `.env` і `.env.production` у `.next/standalone/`. Локальний `.env`
   містить `SITE_URL=http://localhost:3000`, `CRM_MODE=mock` і sandbox-ключі LiqPay —
   вони поїхали б на сервер разом із пакетом.

Збирайте на самому сервері (VPS), у WSL або через GitHub Actions: workflow
`.github/workflows/build-hostiq.yml` (див. нижче).

## VPS: перше налаштування

Приклад для Ubuntu. Шляхи довільні, головне — щоб журнал замовлень лежав **поза**
каталогом застосунку, інакше його зітре наступний деплой.

```
/srv/curly-joy/
  src/            git-клон репозиторію, тут відбувається збірка
  app/            копія .next/standalone, звідси працює сервер
  data/orders/    журнал замовлень (ORDER_STORE_DIR)
/etc/curly-joy.env
```

0. Домен обслуговують DNS-сервери HostiQ (`dns1/dns2.hostiq.ua`), і зараз A-запис
   `curly-joy.com` вказує на сервер HQ10. Змініть A-записи `curly-joy.com` і
   `www.curly-joy.com` на IP нового VPS. Без цього `certbot` не випустить сертифікат.
1. Встановіть Node.js 22 LTS (мінімум 20.9), `git`, `nginx`, `certbot`.
2. Створіть `/etc/curly-joy.env` (права `600`, власник — користувач сервісу):

   ```dotenv
   NODE_ENV=production
   HOSTNAME=127.0.0.1
   PORT=3000
   SITE_URL=https://curly-joy.com
   LIQPAY_MODE=live
   LIQPAY_PUBLIC_KEY=...
   LIQPAY_PRIVATE_KEY=...
   ORDER_STORE_DIR=/srv/curly-joy/data/orders
   CRM_MODE=off
   ```

   Змінні читаються під час роботи сервера, тож під час збірки вони не потрібні.

3. systemd-сервіс `/etc/systemd/system/curly-joy.service`:

   ```ini
   [Unit]
   Description=Curly Joy store
   After=network.target

   [Service]
   User=curlyjoy
   WorkingDirectory=/srv/curly-joy/app
   EnvironmentFile=/etc/curly-joy.env
   ExecStart=/usr/bin/node server.js
   Restart=always
   # Next.js дочекається запитів, що виконуються, і відкладених after()
   TimeoutStopSec=30

   [Install]
   WantedBy=multi-user.target
   ```

4. nginx як reverse proxy, HTTPS через `certbot --nginx`:

   ```nginx
   server {
     server_name curly-joy.com www.curly-joy.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   Буферизацію для потокових відповідей вимикає сам застосунок заголовком
   `X-Accel-Buffering: no` (див. `next.config.ts`). Без нього сторінки з
   `◐ Partial Prerender` чекали б повного рендеру замість того, щоб одразу віддати
   статичну оболонку.

## VPS: кожен деплой

```bash
cd /srv/curly-joy/src
git pull
npm ci
npm run build
rsync -a --delete .next/standalone/ /srv/curly-joy/app/
sudo systemctl restart curly-joy
```

Перезапуск займає кілька секунд, і в цей час сайт недоступний. Для магазину такого
розміру це прийнятно.

## Віртуальний хостинг з cPanel (HQ10)

На HQ10 стоять cPanel і сервер LiteSpeed. Перед усім іншим перевірте, що в
cPanel у блоці «Програмне забезпечення» є **Setup Node.js App**, а у списку версій
є Node.js 20.9 або новіша. Якщо чогось із цього немає, цей шлях не підходить.

`npm run build` на віртуальному хостингу зазвичай не вміщається в ліміт пам'яті,
тому пакет збирає GitHub Actions.

### Збірка

GitHub → Actions → **Build for HostiQ** → Run workflow. Через 2–3 хвилини в
результатах запуску з'явиться артефакт `curly-joy-standalone`. Це zip з
`server.js`, `.next/`, `public/` і `node_modules/`, зібраний на Linux і без `.env`.

### Перше розміщення

1. cPanel → Диспетчер файлів: створіть `~/curly-joy`, завантажте туди zip і
   розпакуйте. `server.js` має лежати прямо в `~/curly-joy`, а не в підтеці.
2. cPanel → Setup Node.js App → Create Application:
   - Node.js version — 22 (мінімум 20.9);
   - Application mode — Production;
   - Application root — `curly-joy`;
   - Application URL — `curly-joy.com`;
   - Application startup file — `server.js`.
3. У тому ж вікні додайте змінні оточення (Environment variables):

   ```dotenv
   SITE_URL=https://curly-joy.com
   LIQPAY_MODE=sandbox
   LIQPAY_PUBLIC_KEY=...
   LIQPAY_PRIVATE_KEY=...
   ORDER_STORE_DIR=/home/<користувач-cpanel>/curly-joy-data/orders
   CRM_MODE=off
   ```

   `PORT` і `HOSTNAME` не задавайте, порт призначає хостинг. `ORDER_STORE_DIR`
   має вказувати поза `~/curly-joy`, інакше наступне розміщення зітре замовлення.
4. Натисніть Restart і відкрийте сайт.
5. cPanel → SSL/TLS → Let's Encrypt: випустіть безкоштовний сертифікат для домену.
   Він продовжується автоматично.

Якщо Setup Node.js App не дає створити застосунок через теку `node_modules`
(CloudLinux хоче керувати нею сам), видаліть `~/curly-joy/node_modules`, натисніть
**Run NPM Install** і потім Restart. Хостинг сам поставить залежності під Linux.

### Оновлення

Запустіть Build for HostiQ, завантажте новий zip у `~/curly-joy`, розпакуйте з
заміною файлів і натисніть Restart у Setup Node.js App. Змінні оточення й журнал
замовлень при цьому не змінюються.

## Перевірка після деплою

- Головна, каталог і картка товару відкриваються, фото завантажуються.
- `https://curly-joy.com/api/payments/liqpay/callback` доступний з інтернету: на `GET`
  застосунок відповідає `405`. Якщо приходить `502`/`504` від nginx, сервер не запущено.
- Sandbox-платіж доходить до `paid`, а файл замовлення з'являється в `ORDER_STORE_DIR`.
- Після `systemctl restart` оплачене замовлення все ще знаходиться — отже, журнал
  лежить на постійному диску.

Налаштування LiqPay і вимоги до production описані в [liqpay.md](./liqpay.md).
