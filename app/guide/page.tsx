import type { Metadata } from "next";
import { Topbar } from "@/components/Topbar";
import { BuyingGuide } from "@/components/BuyingGuide";

export const metadata: Metadata = {
  title: "Buying Guide — Bahay.ph",
  description:
    "Step-by-step guide to buying property in the Philippines — title checks, taxes, BIR, and Registry of Deeds explained.",
};

export default function GuidePage() {
  return (
    <div className="pb-16">
      <Topbar />
      <BuyingGuide />
    </div>
  );
}
