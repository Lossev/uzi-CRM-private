# УЗИ-CRM - Система записи для кабинета УЗИ

Веб-приложение для автоматизации записи клиентов в кабинет УЗИ.

## Возможности

### Для клиентов:
- Онлайн-запись на приём через публичный сайт
- Выбор услуги и свободного времени
- Защита от двойных бронирований

### Для персонала:
- **Администратор** - полный доступ ко всем функциям
- **Ассистент** - работа с записями без изменения финансов

### Функции админ-панели:
- Дашборд со статистикой
- Управление записями (создание, редактирование, отмена)
- База клиентов с историей визитов
- Учёт выручки по периодам
- Управление услугами
- Настройки рабочего расписания

---

## Технологии

**Frontend:**
- React 18 + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- TanStack Query
- Zustand
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT аутентификация

---

## Установка и запуск

### Требования:
- Node.js 18+
- PostgreSQL 14+

### 1. Клонировать проект

```bash
cd uzi-CRM
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить базу данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE uzi_crm;
```

Настройте подключение в файле `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uzi_crm?schema=public"
JWT_SECRET="ваш-секретный-ключ-минимум-32-символа"
JWT_REFRESH_SECRET="другой-секретный-ключ-минимум-32-символа"
PORT=3001
```

### 4. Инициализировать базу данных

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Запустить приложение

**В режиме разработки (два терминала):**

Терминал 1 (backend):
```bash
cd backend
npm run dev
```

Терминал 2 (frontend):
```bash
cd frontend
npm run dev
```

Или одной командой из корневой папки:
```bash
npm run dev
```

**Production сборка:**
```bash
npm run build
```

---

## Доступ к приложению

После запуска:

- **Публичный сайт записи:** http://localhost:5174
- **Админ-панель:** http://localhost:5174/admin

### Тестовые аккаунты:

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@uzi.com | admin123 |
| Ассистент | assistant1@uzi.com | assistant123 |
| Ассистент | assistant2@uzi.com | assistant123 |

---

## Структура проекта

```
uzi-CRM/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma     # Схема базы данных
│   ├── src/
│   │   ├── controllers/      # Контроллеры API
│   │   ├── middleware/       # Middleware (auth, validation)
│   │   ├── routes/           # Роуты API
│   │   ├── types/            # TypeScript типы и Zod схемы
│   │   ├── utils/            # Утилиты
│   │   └── index.ts          # Точка входа
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   │   └── ui/           # shadcn/ui компоненты
│   │   ├── pages/
│   │   │   ├── admin/        # Страницы админ-панели
│   │   │   └── public/       # Публичные страницы
│   │   ├── hooks/            # React хуки
│   │   ├── lib/              # Утилиты (api, utils)
│   │   ├── store/            # Zustand store
│   │   ├── types/            # TypeScript типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── package.json              # Root package.json для workspaces
```

---

## API Endpoints

### Публичные:
- `GET /api/public/services` - список услуг
- `GET /api/public/slots?date=YYYY-MM-DD&serviceId=X` - свободные слоты
- `POST /api/public/book` - создать запись

### Аутентификация:
- `POST /api/auth/login` - вход
- `POST /api/auth/register` - регистрация
- `POST /api/auth/refresh` - обновить токен
- `GET /api/auth/me` - текущий пользователь

### Админ-панель (требуется авторизация):
- `GET/POST/PUT/DELETE /api/appointments` - записи
- `GET/POST/PUT/DELETE /api/clients` - клиенты
- `GET/POST/PUT/DELETE /api/services` - услуги
- `GET /api/stats/dashboard` - статистика дашборда
- `GET /api/stats/revenue` - статистика выручки
- `GET/PUT /api/stats/schedule` - настройки расписания

---

## Лицензия

MIT
