# Pre-rendering для SEO

## Что было сделано

Добавлен pre-rendering (статическая генерация) для всех 26 страниц сайта для улучшения SEO и скорости загрузки.

## Изменения

### Новые файлы
- `scripts/generate-pages.js` - скрипт для генерации pre-rendered HTML страниц
- `public/.nojekyll` - отключает Jekyll обработку на GitHub Pages

### Измененные файлы
- `package.json` - обновлен build скрипт для запуска pre-rendering
- Добавлена зависимость `jsdom` для pre-rendering

## Как это работает

1. **Build процесс**: `npm run build`
   - Vite собирает React приложение как обычно
   - После сборки запускается `scripts/generate-pages.js`
   - Скрипт создает отдельный HTML файл для каждого маршрута

2. **Pre-rendered страницы**:
   - Каждая страница имеет уникальные meta-теги (title, description, keywords)
   - В `<div id="root">` добавлен скрытый контент (h1 + description) для SEO
   - Поисковые системы видят полный HTML без выполнения JavaScript

3. **SPA функциональность**:
   - После загрузки React гидрирует приложение
   - Навигация работает как SPA (без перезагрузки страниц)
   - Пользователи получают быстрый первый рендер + SPA опыт

## Структура dist/

```
dist/
├── index.html (корневая страница)
├── ru/
│   ├── index.html (главная RU)
│   ├── calculator/
│   │   └── index.html
│   ├── number-to-words/
│   │   └── index.html
│   └── ... (все остальные страницы)
├── en/
│   ├── index.html (главная EN)
│   └── ... (все страницы на английском)
└── assets/ (JS, CSS файлы)
```

## Преимущества

✅ **Лучшее SEO** - поисковики видят полный HTML  
✅ **Быстрая загрузка** - контент виден до выполнения JS  
✅ **Работает без JS** - базовый контент доступен всегда  
✅ **SPA навигация** - после загрузки работает как SPA  
✅ **Минимальные изменения** - не требует переписывания кода  

## Команды

```bash
# Разработка (без pre-rendering)
npm run dev

# Production build с pre-rendering
npm run build

# Предпросмотр production build
npm run preview

# Деплой на GitHub Pages
npm run deploy
```

## Проверка результата

1. **Локально**:
   ```bash
   npm run build
   npm run preview
   ```
   Откройте http://localhost:4173/ru/calculator

2. **View Source**:
   - Правый клик → "Просмотр кода страницы"
   - Должны быть видны meta-теги и контент в `<div id="root">`

3. **SEO тесты**:
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Яндекс Вебмастер](https://webmaster.yandex.ru/)

## Обслуживание

При добавлении новых страниц:
1. Добавьте маршрут в `src/App.jsx`
2. Добавьте метаданные в `scripts/generate-pages.js` (объект `pages`)
3. Запустите `npm run build` для генерации

## Статьи (Article pre-rendering)

Исходники статей хранятся в Cloudflare D1 (база данных). При build скрипт `generate-pages.js` загружает опубликованные статьи и генерирует статический HTML.

### Pipeline

1. **D1** → источник данных (published статьи)
2. **generate-pages.js** → генерирует `/ru/articles/[slug]/index.html` и `/en/articles/[slug]/index.html`
3. **build output** → 70 HTML файлов статей (35 RU + 35 EN)
4. **GitHub Pages** → хостинг сгенерированного контента

### Проверки

```bash
npm run verify:ru-language   # проверяет язык контента
npm run build                # генерирует HTML
npm run verify:articles-html # валидирует сгенерированный HTML
npm run verify:production-articles # проверяет production (опционально)
```

### Важно

- После изменения контента в D1 нужен rebuild и redeploy
- Статьи берутся из D1, а не из файлов в BD/content-staging/
- BD/content-staging/ — локальная копия для редактирования, не часть CI/CD

## Технические детали

- **Зависимости**: jsdom для манипуляции HTML
- **Build время**: +2-3 секунды на генерацию 26 страниц
- **Размер dist/**: незначительное увеличение (~26 дополнительных HTML файлов)
- **Совместимость**: работает на GitHub Pages без изменений конфигурации
