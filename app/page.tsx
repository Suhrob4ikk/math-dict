import Formula from "@/components/Formula";
import TermList from "@/components/TermList";
import { terms } from "@/lib/terms";

export default function HomePage() {
  const formulas = Object.fromEntries(
    terms.map((t) => [t.id, <Formula key={t.id} latex={t.latex} />]),
  );

  return (
    <>
      <section className="intro">
        <h1>Словарь математики и ML для data science</h1>
        <p>
          Найдите термин, посмотрите формулу и узнайте, как она звучит по-английски —
          на лекции, собеседовании или в видео на YouTube.
        </p>
      </section>
      <TermList terms={terms} formulas={formulas} />
    </>
  );
}
