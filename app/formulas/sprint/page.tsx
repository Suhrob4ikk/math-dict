import type { Metadata } from "next";
import FormulaSprint from "@/components/FormulaSprint";
import { FORMULAS } from "@/lib/formulas";

export const metadata: Metadata = { title: "Спринт | Math Read Aloud" };

export default function SprintPage() {
  return <FormulaSprint formulas={FORMULAS} seconds={60} />;
}
