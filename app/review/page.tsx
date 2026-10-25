import type { Metadata } from "next";
import Formula from "@/components/Formula";
import Review from "@/components/Review";
import { terms } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Повторение | Math Read Aloud",
};

export default function ReviewPage() {
  const formulas = Object.fromEntries(
    terms.filter((t) => t.latex).map((t) => [t.id, <Formula key={t.id} latex={t.latex!} display />]),
  );
  return <Review terms={terms} formulas={formulas} />;
}
