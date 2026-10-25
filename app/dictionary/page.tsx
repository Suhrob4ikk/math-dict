import type { Metadata } from "next";
import Formula from "@/components/Formula";
import TermList from "@/components/TermList";
import { terms } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Словарь | Math Read Aloud",
};

export default function DictionaryPage() {
  const formulas = Object.fromEntries(
    terms
      .filter((t) => t.latex)
      .map((t) => [t.id, <Formula key={t.id} latex={t.latex!} />]),
  );

  return (
    <>
      <section className="intro">
        <h1>Словарь</h1>
        <p>Термины, формулы, библиотеки и конструкции Python. Нажмите на любое английское слово, чтобы услышать его.</p>
      </section>
      <TermList terms={terms} formulas={formulas} />
    </>
  );
}
