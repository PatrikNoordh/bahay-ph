"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormValues {
  full_name: string;
  phone: string;
  company_name: string;
  years_experience: string;
  prc_license_number: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
  prc_license_number?: string;
  years_experience?: string;
}

const EMPTY_FORM: FormValues = {
  full_name: "",
  phone: "",
  company_name: "",
  years_experience: "",
  prc_license_number: "",
};

function validate(form: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!form.full_name.trim()) errors.full_name = "Full name is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.prc_license_number.trim()) errors.prc_license_number = "PRC licence number is required.";
  if (form.years_experience !== "") {
    const y = Number(form.years_experience);
    if (isNaN(y) || y < 0 || !Number.isInteger(y)) {
      errors.years_experience = "Enter a whole number (0 or more).";
    }
  }
  return errors;
}

function isFormReady(form: FormValues, errors: FormErrors): boolean {
  return (
    !!form.full_name.trim() &&
    !!form.phone.trim() &&
    !!form.prc_license_number.trim() &&
    Object.keys(errors).length === 0
  );
}

export function OnboardingForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: string) {
    const updated = { ...form, [key]: value };
    setForm(updated);
    setFieldErrors(validate(updated));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (!isFormReady(form, errors)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          company_name: form.company_name.trim() || undefined,
          years_experience: form.years_experience || undefined,
          prc_license_number: form.prc_license_number.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setSubmitError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/agent/dashboard");
      router.refresh();
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Full name */}
      <div>
        <label className="block text-[13px] font-medium text-narra mb-1.5">
          Full name <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setField("full_name", e.target.value)}
          placeholder="e.g. Maria Reyes"
          className="w-full bg-white border border-sand-dark rounded-[12px] px-4 py-3 text-sm text-narra placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.full_name && (
          <p className="text-xs text-primary mt-1">{fieldErrors.full_name}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-[13px] font-medium text-narra mb-1.5">
          Phone (WhatsApp) <span className="text-primary">*</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="e.g. 09171234567"
          className="w-full bg-white border border-sand-dark rounded-[12px] px-4 py-3 text-sm text-narra placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.phone && (
          <p className="text-xs text-primary mt-1">{fieldErrors.phone}</p>
        )}
      </div>

      {/* Company */}
      <div>
        <label className="block text-[13px] font-medium text-narra mb-1.5">
          Company / Agency
        </label>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setField("company_name", e.target.value)}
          placeholder="e.g. Cebu Grand Realty"
          className="w-full bg-white border border-sand-dark rounded-[12px] px-4 py-3 text-sm text-narra placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Years experience */}
      <div>
        <label className="block text-[13px] font-medium text-narra mb-1.5">
          Years of experience
        </label>
        <input
          type="number"
          min={0}
          value={form.years_experience}
          onChange={(e) => setField("years_experience", e.target.value)}
          placeholder="e.g. 5"
          className="w-full bg-white border border-sand-dark rounded-[12px] px-4 py-3 text-sm text-narra placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.years_experience && (
          <p className="text-xs text-primary mt-1">{fieldErrors.years_experience}</p>
        )}
      </div>

      {/* PRC licence number */}
      <div>
        <label className="block text-[13px] font-medium text-narra mb-1.5">
          PRC Licence Number <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          value={form.prc_license_number}
          onChange={(e) => setField("prc_license_number", e.target.value)}
          placeholder="e.g. 0012345"
          className="w-full bg-white border border-sand-dark rounded-[12px] px-4 py-3 text-sm text-narra placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.prc_license_number && (
          <p className="text-xs text-primary mt-1">{fieldErrors.prc_license_number}</p>
        )}
        <p className="text-xs text-muted mt-1">
          Your PRC licence is required for verification. It will not be shown publicly.
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="bg-primary/10 text-primary text-sm rounded-[12px] px-4 py-3">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isFormReady(form, fieldErrors) || isSubmitting}
        className="w-full bg-primary text-white font-semibold rounded-[12px] py-3.5 text-sm active:scale-[0.98] transition-transform duration-100 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isSubmitting ? "Submitting…" : "Submit for verification"}
      </button>
    </form>
  );
}
