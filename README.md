# Utility Tools Site

Набор онлайн-инструментов на `React` и `Vite` с двуязычным роутингом (`/ru`, `/en`), SEO-метаданными и генерацией статических HTML-страниц после сборки.

## Стек

- `React 18`
- `React Router 6`
- `Vite 5`
- `react-helmet-async`
- `chart.js` + `react-chartjs-2`
- `mathjs`
- `qrcode`

## Инструменты

- Число прописью
- НДС калькулятор
- Генератор случайных чисел
- Графический калькулятор
- Калькулятор даты и времени
- Калькулятор сложных процентов
- SEO Audit
- SEO Audit Pro
- Генератор meta tags
- Генератор QR-кодов
- Сокращатель ссылок
- Генератор паролей
- Обратная связь

## Команды

```bash
npm install
npm run dev
npm run build
npm run preview
```

Dev-сервер по умолчанию стартует на `http://localhost:3001`.

## Структура

```text
src/
  components/   # layout, SEO, breadcrumbs, shared UI
  contexts/     # language context
  locales/      # ru/en translations
  pages/        # tool pages
  styles/       # global styles
  utils/        # pure helpers and browser utilities
api/            # serverless handlers
scripts/        # build-time helpers
public/         # static assets
```

## SEO

- динамические meta-теги через `src/components/SEO.jsx`
- `hreflang` и canonical URLs
- JSON-LD для сайта и breadcrumbs
- постобработка `dist/index.html` в `scripts/generate-pages.js`

## Serverless env

Для формы обратной связи нужны переменные окружения:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Без них `/api/telegram` вернёт ошибку конфигурации.

## Добавление нового инструмента

1. Создать страницу в `src/pages/`.
2. Добавить логику в `src/utils/`, если нужна.
3. Подключить маршрут в `src/App.jsx`.
4. Добавить карточку на `src/pages/Home.jsx`.
5. Добавить SEO-метаданные и переводы.

## Примечания

- В проекте есть старые статические/служебные файлы в `public/`.
- Для serverless-обработчиков нужен хостинг с поддержкой функций. Чистый статический хостинг для `api/` не подойдёт.
