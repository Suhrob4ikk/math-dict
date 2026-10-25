import type { Metadata } from "next";
import Link from "next/link";
import Formula from "@/components/Formula";
import FormulaProgress, { FormulaMark } from "@/components/FormulaProgress";
import Icon from "@/components/Icon";
import { FORMULA_TOPICS, FORMULAS, formulasOf, spokenName } from "@/lib/formulas";

export const metadata: Metadata = { title: "Формулы | Math Read Aloud" };

// Цвет темы — из палитры ступеней.
const COLORS: Record<string, string> = {
  algebra: "level-essentials",
  geometry: "level-foundations",
  trigonometry: "level-practitioner",
};

export default function FormulasPage() {
  return (
    <>
      <section className="intro">
        <h1>Знаменитые формулы</h1>
        <p>
          Игра в два шага: узнайте формулу по картинке и назовите её по-английски, затем прочитайте вслух по частям.
          Начинаем со школы, дальше — университет.
        </p>
      </section>

      <Link href="/formulas/play/all" className="btn btn-primary btn-block">
        <Icon name="mic" size={20} /> Играть: все темы
      </Link>

      <h2 className="section-title">Школа</h2>
      <ol className="level-list">
        {FORMULA_TOPICS.filter((t) => t.stage === "school").map((topic) => {
          const list = formulasOf(topic.id);
          return (
            <li key={topic.id}>
              <Link href={`/formulas/play/${topic.id}`} className={`level-card ${COLORS[topic.id] ?? ""}`}>
                <span className="level-icon">
                  <Icon name="sigma" size={26} />
                </span>
                <span className="level-body">
                  <span className="level-step" lang="en">
                    {topic.english}
                  </span>
                  <span className="level-name">{topic.name}</span>
                  <span className="level-subtitle">{list.length} формул · играть</span>
                  <FormulaProgress topic={topic.id} ids={list.map((f) => f.id)} />
                </span>
                <Icon name="chevron-right" className="level-chevron" />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="soon-card">
        <Icon name="expert" size={22} />
        <span>
          <strong>Университет — скоро</strong>
          <span className="muted">Пределы, производные, интегралы, ряды и формулы из конспекта лекций.</span>
        </span>
      </div>

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
