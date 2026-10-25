import type { Metadata } from "next";
import Link from "next/link";
import Formula from "@/components/Formula";
import FormulaProgress, { FormulaMark, GameBest } from "@/components/FormulaProgress";
import Icon from "@/components/Icon";
import { FORMULA_TOPICS, FORMULAS, formulasOf, spokenName, type FormulaTopic } from "@/lib/formulas";

export const metadata: Metadata = { title: "Формулы | Math Read Aloud" };

// Цвет темы — из палитры ступеней.
const COLORS: Record<string, string> = {
  algebra: "level-essentials",
  geometry: "level-foundations",
  trigonometry: "level-practitioner",
  calculus: "level-expert",
  integrals: "level-practitioner",
  series: "level-essentials",
};

function TopicCards({ stage }: { stage: FormulaTopic["stage"] }) {
  return (
    <ol className="level-list">
      {FORMULA_TOPICS.filter((t) => t.stage === stage).map((topic) => {
        const list = formulasOf(topic.id);
        return (
          <li key={topic.id}>
            <Link href={`/formulas/play/${topic.id}`} className={`level-card ${COLORS[topic.id] ?? ""}`}>
              <span className="level-icon">
                <Icon name={stage === "school" ? "sigma" : "expert"} size={26} />
              </span>
              <span className="level-body">
                <span className="level-step" lang="en">
                  {topic.english}
                </span>
                <span className="level-name">{topic.name}</span>
                <span className="level-subtitle">{list.length} формул</span>
                <FormulaProgress topic={topic.id} ids={list.map((f) => f.id)} />
              </span>
              <Icon name="chevron-right" className="level-chevron" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function FormulasPage() {
  return (
    <>
      <section className="intro">
        <h1>Знаменитые формулы</h1>
        <p>
          Учитесь узнавать и читать вслух главные формулы по-английски. Три игры на выбор: школьные формулы и
          университетские — пределы, интегралы, ряды.
        </p>
      </section>

      <h2 className="section-title">Игры</h2>
      <ul className="game-list">
        <li>
          <Link href="/formulas/play/all" className="game-card">
            <span className="game-card-icon">
              <Icon name="bulb" size={24} />
            </span>
            <span>
              <strong>Узнай и прочитай</strong>
              <span className="muted">Назовите формулу по картинке, затем прочитайте по частям</span>
            </span>
            <GameBest game="all" />
          </Link>
        </li>
        <li>
          <Link href="/formulas/build" className="game-card">
            <span className="game-card-icon">
              <Icon name="puzzle" size={24} />
            </span>
            <span>
              <strong>Собери формулу</strong>
              <span className="muted">Сложите формулу из частей по порядку и прочитайте её</span>
            </span>
            <GameBest game="build" />
          </Link>
        </li>
        <li>
          <Link href="/formulas/sprint" className="game-card">
            <span className="game-card-icon">
              <Icon name="timer" size={24} />
            </span>
            <span>
              <strong>Спринт 60 секунд</strong>
              <span className="muted">Сколько формул успеете прочитать целиком за минуту</span>
            </span>
            <GameBest game="sprint" unit="" />
          </Link>
        </li>
      </ul>

      <h2 className="section-title">Школа · узнай и прочитай по темам</h2>
      <TopicCards stage="school" />

      <h2 className="section-title">Университет · по конспекту лекций</h2>
      <TopicCards stage="university" />

      {FORMULA_TOPICS.map((topic) => (
        <section key={topic.id} className="unit">
          <h2 className="section-title">{topic.name}</h2>
          <ul className="term-rows">
            {formulasOf(topic.id).map((f) => (
              <li key={f.id}>
                <Link href={`/formula/${f.id}`} className="term-row">
                  <FormulaMark id={f.id} />
                  <span className="term-row-body">
                    <span className="term-ru">{f.russian}</span>
                    <span className="formula-row-tex">
                      <Formula latex={f.tex} />
                    </span>
                    <span className="term-en formula-row-name" lang="en">
                      {spokenName(f)}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} className="level-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="muted formula-count">Всего формул: {FORMULAS.length}</p>
    </>
  );
}
