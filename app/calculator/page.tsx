import type { Metadata } from "next";
import { Topbar } from "@/components/Topbar";
import { MortgageCalculator } from "@/components/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator — Bahay.ph",
  description:
    "Estimate your monthly home loan repayments for Philippine properties.",
};

export default function CalculatorPage() {
  return (
    <div className="pb-16">
      <Topbar />
      <MortgageCalculator />
    </div>
  );
}
