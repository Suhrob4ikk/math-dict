import Link from "next/link";
import HomeGuide from "@/components/HomeGuide";
import Icon from "@/components/Icon";
import LevelProgress from "@/components/LevelProgress";
import ResetProgress from "@/components/ResetProgress";
import { LEVELS } from "@/lib/levels";
import { termsByLevel } from "@/lib/terms";

export default function HomePage() {
  return (
    <>
      <section className="intro">
        <h1>Учитесь говорить на языке data science</h1>
        <p>
          Четыре ступени: от чтения формул до машинного обучения. Слушайте, как звучит термин, и произносите его сами — сайт
          проверит произношение.
        </p>
      </section>

      <HomeGuide
        levels={LEVELS.map((l) => {
          const terms = termsByLevel(l.id);
          return {
            id: l.id,
            name: l.name,
            ids: terms.map((t) => t.id),
            units: l.units?.map((u) => ({ ...u, ids: terms.filter((t) => t.unit === u.id).map((t) => t.id) })),
          };
        })}
      />

      <h2 className="section-title">Ступени</h2>
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
                  <LevelProgress ids={ids} levelId={level.id} />
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

      <ResetProgress />
    </>
  );
}
