# Projects & Tasks (Vue 3)

**Author:** Valeriia Kozhevnikova

SPA для керування проєктами та завданнями: таблиці з сортуванням і зміною ширини колонок, Kanban, drag-and-drop, Pinia, Axios (або in-browser mock для статичного хостингу), збереження UI у `localStorage`.

**Жива демо (після налаштування GitHub Pages):** `https://<user>.github.io/<repo>/` — див. [розгортання](#github-pages).

---

## Відповідність технічному завданню

| Вимога                                                                                         | Статус                                    |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Vue 3, Composition API                                                                         | Так                                       |
| Pinia (окремі модулі projects / tasks)                                                         | Так                                       |
| TypeScript, строга типізація сутностей                                                         | Так                                       |
| Axios + REST; json-server локально                                                             | Так                                       |
| Альтернатива: **mock API в браузері** (`VITE_MOCK_API=true`) + `localStorage` для GitHub Pages | Так                                       |
| SCSS                                                                                           | Так                                       |
| VueDraggable (таблиця задач + Kanban)                                                          | Так                                       |
| Таблиця проєктів: колонки ID, назва, кількість задач, статус, дата створення                   | Так                                       |
| Сортування, фільтрація (назва + статус), resize колонок                                        | Так                                       |
| Модалка «Додати проєкт» (назва обов’язкова, опис)                                              | Так                                       |
| Перехід у проєкт по кліку на рядок                                                             | Так                                       |
| Режими Таблиця / Канбан, спільні дані, збереження режиму                                       | Так                                       |
| Таблиця задач: колонки ID, назва, виконавець, статус, термін                                   | Так                                       |
| Сортування (у т.ч. статус, дата), фільтри (пошук + панель фільтрів), resize, DnD рядків        | Так                                       |
| Канбан: To do / In progress / Done, DnD всередині та між колонками                             | Так                                       |
| Модалка «Додати завдання», валідація (довжина назви, дата ≥ сьогодні)                          | Так                                       |
| Тости (опційно)                                                                                | Так                                       |
| Діаграма розподілу за статусами                                                                | Так, маршрут **Dashboard** (`/dashboard`) |
| Збереження сорту/ширин таблиць, фільтрів UI, режиму перегляду                                  | Так                                       |
| Реактивне оновлення з Pinia                                                                    | Так                                       |

**Уточнення / обмеження:**

- Форми **редагування** проєкту/задачі в UI не винесені окремими екранами (є **створення**; API `update`/`delete` доступні з коду).
- Діаграма на окремій сторінці **Dashboard**, не на корені `/` (корінь — таблиця проєктів).
- Для **GitHub Pages** використовується **in-memory REST mock** з персистом у `localStorage`, без Node/json-server на сервері.

---

## Технології

- Vue 3, TypeScript, Vite, Pinia, Vue Router
- Axios, SCSS
- TanStack Table, Vue Draggable
- json-server (`server.cjs`, `db.json`) — локальний бекенд
- **Axios** — усі запити до API йдуть через один екземпляр `api` (`src/shared/api/client.ts`). У режимі `VITE_MOCK_API=true` підключено **кастомний Axios adapter** (`mock-axios-adapter.ts`), який обробляє ті самі URL, що й json-server, а дані бере з `mock-backend` (памʼять + `localStorage`). Без mock використовується стандартний транспорт Axios (HTTP до json-server).

---

## Локальний запуск (з json-server)

**Термінал 1 — API:**

```bash
npm install
npm run server
```

**Термінал 2 — фронт:**

```bash
npm run dev
```

За замовчуванням клієнт ходить на `http://localhost:3000`. Якщо порт зайнятий: `PORT=3001 npm run server` і файл `.env.local`:

```bash
VITE_API_URL=http://localhost:3001
```

---

## Змінні середовища

| Змінна               | Опис                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `VITE_API_URL`       | База REST (локальний json-server). Ігнорується, якщо увімкнено mock.    |
| `VITE_MOCK_API=true` | Усі запити йдуть у браузерний mock + `localStorage` (`ptm-mock-db-v1`). |
| `VITE_BASE`          | Базовий шлях для Vite, наприклад `/repo-name/` для GitHub Pages.        |

Приклад для ручної збірки під Pages: `.env.production.example`.

---

## Збірка

```bash
npm run build
```

Перегляд `dist`:

```bash
npm run preview
```

Збірка **лише з mock** (без бекенду):

```bash
npm run build:mock
```

### Перевірки коду (ESLint, Prettier, TypeScript)

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint з автофіксом
npm run format        # Prettier — записати форматування
npm run format:check  # Prettier — лише перевірка
npm run typecheck     # перевірка типів (vue-tsc)
npm run check         # typecheck + lint + format:check
```

---

## Git і GitHub

### Ініціалізація та перший push

```bash
git init
git add .
git commit -m "Initial commit: projects & tasks SPA"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

Далі workflow `.github/workflows/gh-pages.yml` на кожен push у `main` / `master` збирає проєкт з `VITE_MOCK_API=true` і `VITE_BASE=/<REPO>/` та публікує гілку **`gh-pages`**.

### Увімкнути GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** гілка **`gh-pages`**, папка **`/` (root)**.
2. Через хвилину сайт буде доступний за адресою:  
   `https://<USER>.github.io/<REPO>/`

Якщо репозиторій не в корені акаунта, шлях залишається `/REPO/`, він уже підставляється в workflow через `github.event.repository.name`.

### Локальна перевірка збірки «як на Pages»

```bash
VITE_MOCK_API=true VITE_BASE=/<REPO>/ npm run build
npx vite preview --base /$REPO/
```

(підставте назву репозиторію замість `<REPO>`).

---

## Інші хостинги (Vercel тощо)

- **Output:** `dist`
- Для повноцінного json-server на проді потрібен окремий бекенд або serverless; для статичного деплою використовуйте **`VITE_MOCK_API=true`** у змінних збірки.

---

## Структура репозиторію

- `src/app` — роутер
- `src/shared` — axios, mock-backend, UI, утиліти
- `src/entities` — типи, Pinia, API
- `src/features` — модалки створення
- `src/pages`, `src/widgets` — сторінки та великі блоки UI
- `server.cjs`, `db.json` — локальний json-server
- `src/data/db-seed.json` — початкові дані для браузерного mock

---

## Поведінка

- DnD у таблиці задач вимкнено, якщо активні фільтри/пошук або сортування колонок.
- Kanban і таблиця використовують один store задач; порядок зберігається batch-оновленням (і rollback при помилці в режимі Axios).
- У режимі **mock** дані зберігаються в `localStorage` клієнта.
