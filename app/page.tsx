import Link from "next/link";
import Icon from "@/components/Icon";
import LevelProgress from "@/components/LevelProgress";
import { LEVELS } from "@/lib/levels";
import { termsByLevel } from "@/lib/terms";

export default function HomePage() {
  return (
    <>
      <section className="intro">
        <h1>Учитесь говорить на языке data science</h1>
        <p>
          Четыре ступени: от базовых слов до ML. Слушайте, как звучит термин, и произносите его сами — сайт
          проверит произношение.
        </p>
      </section>

      <ol className="level-list">
        {LEVELS.map((level, i) => {
          const ids = termsByLevel(level.id).map((t) => t.id);
          return (
            <li key={level.id}>
              <Link href={`/level/${level.id}`} className={`level-card level-${level.id}`}>
                <span className="level-icon">
                  <Icon name={level.id} size={26} />
                </span>
                <span className="level-body">
                  <span className="level-step">Ступень {i + 1}</span>
                  <span className="level-name" lang="en">
                    {level.name}
                  </span>
                  <span className="level-subtitle">{level.subtitle}</span>
                  <LevelProgress ids={ids} />
                </span>
                <Icon name="chevron-right" className="level-chevron" />
              </Link>
            </li>
          );
        })}
      </ol>

      <Link href="/dictionary" className="dictionary-link">
        <Icon name="search" />
        <span>
          <strong>Весь словарь</strong>
          <span className="muted">Поиск по всем терминам, формулам и библиотекам</span>
        </span>
        <Icon name="chevron-right" className="level-chevron" />
      </Link>
    </>
  );
}
