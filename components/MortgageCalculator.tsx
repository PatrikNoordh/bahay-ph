"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/ui/AnimateIn";

// ── Philippine mortgage defaults (AC5) ────────────────────────────────────

const DEFAULTS = {
  propertyPrice: "5000000",
  downPaymentPct: "20",
  loanTermYears: "20",
  interestRatePct: "7",
};

// ── Calculation logic (AC3) ───────────────────────────────────────────────

interface CalcResults {
  monthly: number;
  loanAmount: number;
  totalInterest: number;
  totalRepayment: number;
}

function computeMortgage(
  price: number,
  downPct: number,
  termYears: number,
  annualRatePct: number
): CalcResults {
  const loanAmount = price * (1 - downPct / 100);
  const n = termYears * 12;

  let monthly: number;
  if (annualRatePct === 0) {
    // Edge case: 0% interest → flat repayment (AC edge cases)
    monthly = loanAmount / n;
  } else {
    const r = annualRatePct / 100 / 12;
    const factor = Math.pow(1 + r, n);
    monthly = (loanAmount * r * factor) / (factor - 1);
  }

  const totalRepayment = monthly * n;
  const totalInterest = totalRepayment - loanAmount;

  return { monthly, loanAmount, totalInterest, totalRepayment };
}

function formatPeso(value: number): string {
  return "₱" + Math.round(value).toLocaleString("en-PH");
}

// ── Main component ────────────────────────────────────────────────────────

export function MortgageCalculator() {
  const [price, setPrice] = useState(DEFAULTS.propertyPrice);
  const [downPct, setDownPct] = useState(DEFAULTS.downPaymentPct);
  const [termYears, setTermYears] = useState(DEFAULTS.loanTermYears);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRatePct);
  const [downPctError, setDownPctError] = useState<string | null>(null);

  const priceVal = parseFloat(price) || 0;
  const downPctVal = parseFloat(downPct);
  const termVal = parseFloat(termYears) || 0;
  const rateVal = parseFloat(interestRate);

  const isDownValid =
    !isNaN(downPctVal) && downPctVal >= 0 && downPctVal <= 100;
  const isRateValid = !isNaN(rateVal) && rateVal >= 0;
  const canCompute = priceVal > 0 && isDownValid && termVal > 0 && isRateValid;

  // AC4 — results recompute on every input change
  const results = canCompute
    ? computeMortgage(priceVal, downPctVal, termVal, rateVal)
    : null;

  function handleDownPct(v: string) {
    setDownPct(v);
    const num = parseFloat(v);
    if (!isNaN(num) && num > 100) {
      // Edge case: down payment > 100% (AC edge cases)
      setDownPctError("Cannot exceed 100%");
    } else if (!isNaN(num) && num < 0) {
      setDownPctError("Cannot be negative");
    } else {
      setDownPctError(null);
    }
  }

  return (
    <div className="px-3 mt-3 flex flex-col gap-4">
      {/* Page header */}
      <AnimateIn delay={0}>
        <div className="px-1">
          <h1 className="font-display font-bold text-2xl text-narra leading-tight">
            Mortgage Calculator
          </h1>
          <p className="text-sm text-muted mt-1">
            Estimate monthly repayments for Philippine home loans.
          </p>
        </div>
      </AnimateIn>

      {/* Input card (AC2) */}
      <AnimateIn delay={50}>
        <div className="bg-white rounded-[14px] shadow-card overflow-hidden">
          <InputRow
            label="Property Price"
            prefix="₱"
            value={price}
            onChange={setPrice}
            placeholder="5,000,000"
            inputMode="numeric"
          />
          <InputRow
            label="Down Payment"
            suffix="%"
            value={downPct}
            onChange={handleDownPct}
            placeholder="20"
            inputMode="decimal"
            error={downPctError}
          />
          <InputRow
            label="Loan Term"
            suffix="yrs"
            value={termYears}
            onChange={setTermYears}
            placeholder="20"
            inputMode="numeric"
          />
          <InputRow
            label="Interest Rate"
            suffix="% p.a."
            value={interestRate}
            onChange={setInterestRate}
            placeholder="7"
            inputMode="decimal"
          />
        </div>
      </AnimateIn>

      {/* Results card (AC3, AC4) */}
      <AnimateIn delay={100}>
        {results ? (
          <div className="bg-gradient-to-br from-primary via-primary-light to-primary/80 rounded-[14px] p-5 shadow-card">
            <p className="text-white/75 text-xs font-medium uppercase tracking-widest mb-1">
              Monthly Repayment
            </p>
            <p className="font-display font-bold text-[2.5rem] text-white leading-none mb-4">
              {formatPeso(results.monthly)}
            </p>

            <div className="h-px bg-white/20 mb-4" />

            <div className="flex flex-col gap-2.5">
              <ResultRow
                label="Loan Amount"
                value={formatPeso(results.loanAmount)}
              />
              <ResultRow
                label="Total Interest Paid"
                value={formatPeso(results.totalInterest)}
              />
              <ResultRow
                label="Total Repayment"
                value={formatPeso(results.totalRepayment)}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[14px] p-5 shadow-card flex items-center justify-center min-h-[120px]">
            <p className="text-muted text-sm text-center">
              Enter valid inputs above to see your estimate.
            </p>
          </div>
        )}
      </AnimateIn>

      {/* Disclaimer */}
      <AnimateIn delay={150}>
        <p className="text-[11px] text-muted-light text-center px-2 pb-2 leading-relaxed">
          For illustration only. Actual rates vary by lender and borrower
          profile. Consult a licensed financial advisor.
        </p>
      </AnimateIn>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface InputRowProps {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string | null;
}

function InputRow({
  label,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  inputMode,
  error,
}: InputRowProps) {
  return (
    <div className="px-4 py-3.5 border-b border-sand-dark last:border-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-narra shrink-0">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {prefix && (
            <span className="text-[13px] text-muted select-none">{prefix}</span>
          )}
          <input
            type="text"
            inputMode={inputMode}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="w-24 text-right text-[14px] font-medium text-narra bg-sand rounded-lg px-2.5 py-1.5 border border-sand-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {suffix && (
            <span className="text-[13px] text-muted select-none shrink-0 min-w-[2rem]">
              {suffix}
            </span>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 text-right">{error}</p>
      )}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/75 text-sm">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}
