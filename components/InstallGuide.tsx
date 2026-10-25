"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { inAndroidApp } from "@/lib/android";

export const APK_URL = "/math-aloud.apk";
const APK_SIZE = "60 КБ";

type Browser = "samsung" | "yandex" | "edge" | "firefox" | "opera" | "chrome" | "safari" | "other";

function detect(ua: string): Browser {
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/YaBrowser|YaApp/i.test(ua)) return "yandex";
  if (/EdgA|Edg\//i.test(ua)) return "edge";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  if (/OPR|Opera/i.test(ua)) return "opera";
  if (/iPhone|iPad/i.test(ua)) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
}

// Голосовую проверку браузеры поддерживают по-разному: где её нет, сайт скажет об этом у микрофона.
const BROWSERS: { id: Browser; name: string; steps: string[]; mic: string }[] = [
  {
    id: "samsung",
    name: "Samsung Internet",
    steps: ["Нажмите ≡ (меню) внизу справа.", "«Добавить страницу на» → «Главный экран».", "Подтвердите «Добавить»."],
    mic: "Проверка голосом зависит от версии браузера — попробуйте на любом термине.",
  },
  {
    id: "yandex",
    name: "Яндекс Браузер",
    steps: ["Нажмите ⋮ (меню) рядом с адресной строкой.", "«Добавить ярлык» или «На главный экран».", "Подтвердите добавление."],
    mic: "Проверка голосом зависит от версии браузера — попробуйте на любом термине.",
  },
  {
    id: "edge",
    name: "Microsoft Edge",
    steps: ["Нажмите ⋯ (меню) внизу.", "«Добавить на телефон» или «Установить приложение».", "Подтвердите установку."],
    mic: "Проверка голосом зависит от версии браузера — попробуйте на любом термине.",
  },
  {
    id: "firefox",
    name: "Firefox",
    steps: ["Нажмите ⋮ (меню).", "«Установить» или «Добавить на главный экран».", "Подтвердите добавление."],
    mic: "Firefox не умеет распознавать речь: слушать можно, а проверять произношение — нет. Лучше APK выше.",
  },
  {
    id: "opera",
    name: "Opera",
    steps: ["Нажмите ⋮ (меню).", "«Домашний экран» или «Добавить на главный экран».", "Подтвердите добавление."],
    mic: "Проверка голосом зависит от версии браузера — попробуйте на любом термине.",
  },
  {
    id: "chrome",
    name: "Chrome",
    steps: ["Нажмите ⋮ (меню) вверху справа.", "«Установить приложение» или «Добавить на главный экран».", "Подтвердите установку."],
    mic: "Проверка голосом работает, пока есть интернет.",
  },
  {
    id: "safari",
    name: "iPhone (Safari)",
    steps: ["Нажмите «Поделиться» (квадрат со стрелкой).", "«На экран „Домой“».", "Нажмите «Добавить»."],
    mic: "Проверка голосом работает в Safari, когда есть интернет.",
  },
];

export default function InstallGuide() {
  const [browser, setBrowser] = useState<Browser>("other");
  const [android, setAndroid] = useState(true);
  const [app, setApp] = useState(false);

  useEffect(() => {
    setBrowser(detect(navigator.userAgent));
    setAndroid(/Android/i.test(navigator.userAgent) || !/iPhone|iPad/i.test(navigator.userAgent));
    setApp(inAndroidApp());
  }, []);

  if (app) {
    return (
      <div className="install-done">
        <Icon name="check" size={24} />
        <span>Вы уже в приложении Math Aloud.</span>
      </div>
    );
  }

  return (
    <>
      {android && (
        <section className="install-apk">
          <div className="install-apk-head">
            <span className="install-apk-icon">
              <span className="logo-mark">∑</span>
            </span>
            <div>
              <h2>Приложение для Android</h2>
              <p className="muted">Не нужен Chrome. Проверка голосом — через распознавание речи Android.</p>
            </div>
          </div>
          <a className="btn btn-primary install-apk-button" href={APK_URL} download="math-aloud.apk">
            <Icon name="download" size={20} />
            Скачать APK ({APK_SIZE})
          </a>
          <ol className="install-steps">
            <li>Откройте скачанный файл math-aloud.apk (из шторки уведомлений или «Загрузок»).</li>
            <li>
              Если телефон спросит — разрешите браузеру «Установку неизвестных приложений» и вернитесь назад.
            </li>
            <li>Нажмите «Установить», затем «Открыть». При первой проверке голосом разрешите микрофон.</li>
            <li>Один раз откройте приложение с интернетом — оно скачает всё для работы офлайн.</li>
          </ol>
          <p className="install-note">
            Без интернета голос проверяется, только если в телефоне скачан английский офлайн-пакет: Настройки →
            Google → Голосовой ввод (или «Распознавание речи») → Офлайн-распознавание → English (US).
          </p>
        </section>
      )}

      <h2 className="section-title">Или через браузер</h2>
      <div className="install-browsers">
        {BROWSERS.map((b) => (
          <details key={b.id} open={b.id === browser}>
            <summary>
              {b.name}
              {b.id === browser && <span className="install-current">ваш браузер</span>}
            </summary>
            <ol className="install-steps">
              {b.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="install-note">{b.mic}</p>
          </details>
        ))}
      </div>
    </>
  );
}
