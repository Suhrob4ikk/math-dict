# Math Read Aloud

Словарь для студентов, которые идут в data science: **как читать вслух по-английски** формулы
математики, статистики и машинного обучения.

Для каждого термина есть формула (KaTeX), английская фраза для чтения вслух с кнопкой озвучки,
перевод на русский, короткий пример на Python и ссылки на связанные термины.

## Стек

- [Next.js](https://nextjs.org/) 15 (App Router) + TypeScript
- Данные: один файл [`data/terms.json`](data/terms.json)
- Формулы: [KaTeX](https://katex.org/), рендер на сервере
- Поиск: [Fuse.js](https://www.fusejs.io/), нечёткий, поэтому прощает опечатки (`derivitive` → derivative)
- Озвучка: браузерный `speechSynthesis` с языком `en-US`, без API-ключей

Все страницы генерируются статически при сборке (`generateStaticParams`).

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # продакшен-сборка (то же самое делает Vercel)
npm run typecheck  # проверка типов
```

Деплой на Vercel: импортируйте репозиторий, никаких настроек не нужно.

## Структура

```
app/
  layout.tsx          общий макет, подключение стилей KaTeX
  page.tsx            список терминов
  term/[id]/page.tsx  страница термина
  globals.css         светлая тема
components/
  Formula.tsx         рендер LaTeX через KaTeX
  SpeakButton.tsx     кнопка озвучки (speechSynthesis)
  TermList.tsx        поиск (Fuse.js) и фильтр по категориям
data/terms.json       все термины
lib/terms.ts          типы, категории, доступ к данным
```

## Как добавить новый термин

1. Откройте `data/terms.json` и добавьте в массив объект:

   ```json
   {
     "id": "median",
     "english": "median",
     "russian": "медиана",
     "spoken": "the median of x",
     "latex": "\\operatorname{median}(x)",
     "python": "import numpy as np\nnp.median([1, 3, 7])  # 3.0",
     "category": "statistics",
     "related": ["mean"]
   }
   ```

2. Правила для полей:

   | Поле       | Что писать |
   |------------|------------|
   | `id`       | уникальный, латиница в нижнем регистре через дефис; это часть URL `/term/<id>` |
   | `english`  | название термина по-английски |
   | `russian`  | перевод на русский |
   | `spoken`   | как это читается вслух, словами (именно этот текст озвучивается) |
   | `latex`    | формула в LaTeX. **В JSON каждый `\` удваивается**: `\frac` → `"\\frac"` |
   | `python`   | короткий пример; перенос строки — `\n` |
   | `category` | одна из: `statistics`, `linear algebra`, `calculus`, `ML basics`, `Python/pandas` |
   | `related`  | массив `id` других терминов (они должны существовать) |

3. Проверьте: `npm run build`. Новая страница появится по адресу `/term/<id>`.

Формулу удобно проверять в [онлайн-редакторе KaTeX](https://katex.org/#demo). Если KaTeX не
поймёт формулу, он покажет её красным текстом, а сборка не упадёт.

Чтобы добавить новую категорию, допишите её в `CATEGORIES` и `CATEGORY_LABELS` в `lib/terms.ts`.

## Идеи на будущее

- Переключатель языка интерфейса
- Больше терминов: integral, eigenvalue, likelihood, softmax, cross-entropy…
