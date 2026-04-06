# Информация о развертывании проекта QSEN.RU

## Текущая конфигурация

### Домен
- **Домен:** qsen.ru
- **Регистратор:** reg.ru
- **DNS:** Cloudflare (бесплатный план)
- **NS-серверы:** 
  - brit.ns.cloudflare.com
  - kayden.ns.cloudflare.com

### Хостинг
- **Платформа:** Vercel
- **Аккаунт:** arsenytroitsky01-8691
- **Project ID:** prj_LKTlPULEInvS0zrzvycgGWxz8E6G
- **Название проекта:** utility-tools-site
- **Production URL:** https://qsen.ru
- **Vercel URL:** https://utility-tools-site-pi.vercel.app

### GitHub
- **Репозиторий:** https://github.com/qtenwten/qsen.git
- **Ветка:** main
- **Последний коммит:** a2f95eb - "Добавлены SEO-теги в index.html для улучшения индексации"

### Cloudflare DNS записи
```
Type: CNAME, Name: qsen.ru (@), Target: cname.vercel-dns.com, Proxy: Enabled
Type: CNAME, Name: www, Target: cname.vercel-dns.com, Proxy: Enabled
Type: CNAME, Name: _domainconnect, Target: _domainconnect.vercel-dns.com, Proxy: Enabled
Type: CAA, Name: qsen.ru, Value: 0 issue sectigo.com
Type: CAA, Name: qsen.ru, Value: 0 issue pki.goog
Type: CAA, Name: qsen.ru, Value: 0 issue letsencrypt.org
Type: TXT, Name: qsen.ru, Value: "yandex-verification: 5edd40b97e956d2c"
```

## Технологии

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Router:** React Router DOM 6.22.0
- **Charts:** Recharts 3.8.1
- **SEO:** React Helmet Async 2.0.4

### Зависимости
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-helmet-async": "^2.0.4",
  "react-router-dom": "^6.22.0",
  "recharts": "^3.8.1",
  "node-fetch": "^3.3.2"
}
```

## Перенос на другой хостинг

### Вариант 1: Netlify
1. Зарегистрироваться на netlify.com
2. Подключить GitHub репозиторий
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. В Cloudflare изменить CNAME:
   - `qsen.ru` → `[your-site].netlify.app`
   - `www` → `[your-site].netlify.app`

### Вариант 2: Cloudflare Pages
1. В Cloudflare: Workers & Pages → Create application → Pages
2. Подключить GitHub репозиторий
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Домен подключится автоматически

### Вариант 3: Российские хостинги (Timeweb, Beget)
1. Собрать проект локально: `npm run build`
2. Загрузить содержимое папки `dist/` на хостинг
3. Настроить веб-сервер (nginx/apache) на папку с файлами
4. В Cloudflare изменить CNAME на IP или домен хостинга

### Вариант 4: VPS (собственный сервер)
1. Установить Node.js и nginx
2. Клонировать репозиторий: `git clone https://github.com/qtenwten/qsen.git`
3. Установить зависимости: `npm install`
4. Собрать проект: `npm run build`
5. Настроить nginx для раздачи статики из `dist/`
6. В Cloudflare указать IP сервера

## Команды для работы

### Локальная разработка
```bash
npm install          # Установка зависимостей
npm run dev          # Запуск dev-сервера (http://localhost:5173)
npm run build        # Сборка для production
npm run preview      # Предпросмотр production сборки
```

### Git
```bash
git status           # Проверить изменения
git add .            # Добавить все файлы
git commit -m "..."  # Создать коммит
git push origin main # Отправить на GitHub
git pull origin main # Получить изменения с GitHub
```

### Vercel CLI
```bash
vercel               # Деплой на Vercel
vercel --prod        # Деплой в production
vercel domains ls    # Список доменов
vercel logs          # Логи деплоя
```

## Важные файлы

- `index.html` - Главный HTML с SEO-тегами
- `src/App.jsx` - Главный компонент приложения
- `src/components/SEO.jsx` - Компонент для динамических SEO-тегов
- `src/pages/` - Страницы инструментов
- `vercel.json` - Конфигурация Vercel
- `package.json` - Зависимости проекта

## SEO настройки

### Мета-теги (в index.html)
- Title, Description, Keywords
- Open Graph (og:title, og:description, og:image)
- JSON-LD структурированные данные Schema.org
- Yandex verification: 5edd40b97e956d2c

### Аналитика
- Yandex.Metrika ID: 108416207

## Контакты и доступы

### Email
- qten@mail.ru

### Git config
- User: "Ваше Имя"
- Email: qten@mail.ru

## Резервное копирование

### Что нужно сохранить
1. ✅ Код на GitHub (https://github.com/qtenwten/qsen.git)
2. ✅ Локальная копия в `C:\Users\Админ\Utility Tools Site`
3. ✅ Настройки Cloudflare DNS (описаны выше)
4. ✅ Vercel Project ID: prj_LKTlPULEInvS0zrzvycgGWxz8E6G

### Для полного переноса понадобится
- Доступ к reg.ru (для управления доменом)
- Доступ к Cloudflare (для DNS)
- Доступ к GitHub (код проекта)
- Этот файл DEPLOYMENT.md

---

**Дата создания:** 2026-04-07
**Последнее обновление:** 2026-04-07
