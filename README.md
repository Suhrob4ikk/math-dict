# Math Read Aloud

Словарь для студентов, которые идут в data science: **как читать вслух по-английски** формулы
математики, статистики и машинного обучения, названия библиотек (NumPy, scikit-learn, PyTorch…)
и код на Python (`__init__`, `**kwargs`, `lambda`, скобки…).

Для каждого термина есть английская фраза для чтения вслух с кнопкой озвучки, русская транскрипция
(где нужна), формула (KaTeX, если есть), перевод на русский, короткий пример на Python и ссылки на
связанные термины.

## Стек

- [Next.js](https://nextjs.org/) 15 (App Router) + TypeScript
- Данные: один файл [`data/terms.json`](data/terms.json)
- Формулы: [KaTeX](https://katex.org/), рендер на сервере
- Поиск: [Fuse.js](https://www.fusejs.io/), нечёткий, поэтому прощает опечатки (`derivitive` → derivative)
- Озвучка: браузерный `speechSynthesis` с языком `en-US`, без API-ключей
- Проверка произношения: браузерный `SpeechRecognition` (Chrome на Android, Safari на iOS 14.5+), без ключей. Распознаватель отдаёт до 10 вариантов, засчитывается лучший; сравнение нечёткое: по буквам (расстояние Левенштейна) и по звучанию для длинных слов (упрощённый Metaphone, поэтому «snake keys» = «snake case»); буквы-переменные и короткие слова (sub, bar) — только точно или по названию буквы («eye» = i). Символы из распознавателя («√x», «x²») переводятся в слова, плюс список допустимых вариантов `accept`

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
  Practice.tsx        тренировка по ступени: карточки, озвучка, проверка произношения
  SpeechCheck.tsx     запись с микрофона и вывод оценки
data/terms.json       все термины
lib/terms.ts          типы, категории, доступ к данным
lib/levels.ts         ступени: Foundations → Essentials → Practitioner → Expert
lib/recognition.ts    распознавание речи (Web Speech API) и нечёткая проверка произношения
lib/exam.ts           состав экзамена по ступени
lib/generate.ts       генератор новых формул и строк кода для экзамена
lib/progress.ts       прогресс в localStorage: выученные, ошибки, экзамены, где остановились,
                      цель на день, серия дней, интервальное повторение (1, 3, 7, 14, 30 дней)
app/manifest.ts       PWA: установка на телефон как приложение
public/sw.js          service worker: офлайн-режим (страницы, скрипты, шрифты KaTeX)
app/precache.json/    список всех страниц, которые service worker скачивает заранее
components/OfflineStatus.tsx  регистрация service worker, ход скачивания, плашка «Нет интернета»
```

### Android-приложение (APK)

`android/` — маленькое приложение: сайт в WebView плюс мост `window.AndroidSpeech` к системным
SpeechRecognizer и TextToSpeech (в WebView нет Web Speech API). Веб-часть моста — `lib/android.ts`.
Готовый файл лежит в `public/math-aloud.apk`, страница со ссылкой и инструкциями — `/install`.

Сборка (нужны JDK 17+, Android SDK 35, Gradle 8.11+):

```
cd android
echo "sdk.dir=/путь/к/android-sdk" > local.properties
MATH_ALOUD_KEYSTORE=/путь/к/keystore.properties gradle assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../public/math-aloud.apk
```

Обновления ставятся поверх только с тем же ключом подписи — его нельзя терять; в репозиторий
он не попадает. При изменении приложения увеличьте `versionCode` в `android/app/build.gradle.kts`.

### Офлайн-режим

При первом заходе service worker скачивает все страницы (~25 МБ в хранилище браузера), после
этого карточки, словарь, формулы, игры и прогресс работают без интернета. Новые страницы
попадают в офлайн автоматически: список берётся из тех же данных, что и сами страницы.
Проверка произношения в Chrome на Android требует интернета (звук распознаётся на серверах
Google); на компьютере свежий Chrome может распознавать на устройстве — тогда сайт предложит
скачать языковой пакет. Озвучка без сети использует голоса, установленные на телефоне.

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
     "level": "foundations",
     "say": "median",
     "related": ["mean"]
   }
   ```

2. Правила для полей:

   | Поле       | Что писать |
   |------------|------------|
   | `id`       | уникальный, латиница в нижнем регистре через дефис; это часть URL `/term/<id>` |
   | `english`  | название термина по-английски |
   | `russian`  | перевод на русский |
   | `spoken`   | как это читается вслух, словами (именно этот текст озвучивается). Для названий пишите так, чтобы синтезатор прочитал правильно: `"num pie"`, а не `"NumPy"` |
   | `transcription` | *необязательно.* Русская транскрипция: `"нам-пай"` |
   | `latex`    | *необязательно* (у библиотек формулы нет). Формула в LaTeX. **В JSON каждый `\` удваивается**: `\frac` → `"\\frac"` |
   | `python`   | короткий пример; перенос строки — `\n` |
   | `category` | одна из: `notation`, `statistics`, `linear algebra`, `calculus`, `ML basics`, `Python/pandas`, `Python syntax`, `libraries`, `geometry`, `complex numbers`, `series`, `differential equations` |
   | `level`    | ступень обучения: `foundations`, `essentials`, `practitioner`, `expert`. Порядок в тренировке — как в файле |
   | `say`      | что пользователь произносит в тренировке: короткое название без скобок (`"L2 norm"`, а не `"L2 norm (vector length)"`) |
   | `accept`   | *необязательно.* Как распознаватель может записать правильное произношение: `["num pie", "numb pie"]` для NumPy |
   | `unit`     | тема внутри ступени (список тем — `units` в `lib/levels.ts`). Темы есть у всех ступеней: каждая тренируется отдельным уроком `/level/<ступень>/practice/<тема>` |
   | `related`  | массив `id` других терминов (они должны существовать) |

3. Проверьте: `npm run build`. Новая страница появится по адресу `/term/<id>`.

Формулу удобно проверять в [онлайн-редакторе KaTeX](https://katex.org/#demo). Если KaTeX не
поймёт формулу, он покажет её красным текстом, а сборка не упадёт.

Чтобы добавить новую категорию, допишите её в `CATEGORIES` и `CATEGORY_LABELS` в `lib/terms.ts`.

## Идеи на будущее

- Переключатель языка интерфейса
- Больше терминов: likelihood, softmax, cross-entropy, TensorFlow, Git…

## Источники

Термины высшей математики (матрицы, векторы, аналитическая геометрия, пределы, производные, интегралы,
ряды, дифференциальные уравнения, теория поля, комплексный анализ, преобразование Лапласа) взяты по
главам «Конспекта лекций по высшей математике» Д. Т. Письменного.
