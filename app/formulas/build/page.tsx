import type { Metadata } from "next";
import FormulaBuild from "@/components/FormulaBuild";
import { FORMULAS } from "@/lib/formulas";

export const metadata: Metadata = { title: "Собери формулу | Math Read Aloud" };

export default function BuildPage() {
  return <FormulaBuild formulas={FORMULAS} rounds={6} />;
}
