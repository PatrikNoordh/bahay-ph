"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { ImageUploader } from "@/components/ImageUploader";
import { useToast } from "@/components/ui/Toast";
import type { Property, PropertyImage, PropertyStatus, PriceType, PropertyType } from "@/lib/types";

// BH-30 — Leaflet picker is client-only (accesses window)
const DynamicLocationPicker = dynamic(
  () => import("@/components/LocationPickerMap").then((m) => ({ default: m.LocationPickerMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] rounded-[14px] bg-sand-dark animate-pulse" />
    ),
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentDashboardProps {
  agentId: string;
  initialListings: Property[];
  /** Primary image URL keyed by property_id — for thumbnail display */
  initialPrimaryImages: Record<string, string>;
}

interface FormValues {
  title: string;
  description: string;
  price: string;
  price_type: PriceType;
  property_type: PropertyType;
  bedrooms: string;
  bathrooms: string;
  floor_area: string;
  lot_size: string;
  address: string;
  city: string;
  barangay: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: FormValues = {
  title: "",
  description: "",
  price: "",
  price_type: "sale",
  property_type: "house",
  bedrooms: "",
  bathrooms: "",
  floor_area: "",
  lot_size: "",
  address: "",
  city: "",
  barangay: "",
  latitude: "",
  longitude: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, price_type: PriceType) {
  const formatted = price.toLocaleString("en-PH");
  return price_type === "rent" ? `₱${formatted}/mo` : `₱${formatted}`;
}

function statusBadgeClass(status: PropertyStatus) {
  switch (status) {
    case "active":   return "bg-green/20 text-green";
    case "sold":     return "bg-primary/20 text-primary";
    case "rented":   return "bg-ocean/20 text-ocean";
    case "inactive": return "bg-sand-dark text-muted";
  }
}

function listingFromForm(form: FormValues, agentId: string): Omit<Property, "id" | "created_at"> {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    price_type: form.price_type,
    price_period: form.price_type === "rent" ? "monthly" : "total",
    property_type: form.property_type,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
    floor_area: form.floor_area ? Number(form.floor_area) : null,
    lot_size: form.lot_size ? Number(form.lot_size) : null,
    address: form.address.trim() || null,
    city: form.city.trim(),
    barangay: form.barangay.trim() || null,
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    status: "active",
    is_featured: false,
    agent_id: agentId,
  };
}

function formFromListing(l: Property): FormValues {
  return {
    title: l.title,
    description: l.description ?? "",
    price: String(l.price),
    price_type: l.price_type,
    property_type: l.property_type,
    bedrooms: l.bedrooms !== null ? String(l.bedrooms) : "",
    bathrooms: l.bathrooms !== null ? String(l.bathrooms) : "",
    floor_area: l.floor_area !== null ? String(l.floor_area) : "",
    lot_size: l.lot_size !== null ? String(l.lot_size) : "",
    address: l.address ?? "",
    city: l.city,
    barangay: l.barangay ?? "",
    latitude: l.latitude !== null ? String(l.latitude) : "",
    longitude: l.longitude !== null ? String(l.longitude) : "",
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function AgentDashboard({ agentId, initialListings, initialPrimaryImages }: AgentDashboardProps) {
  const [listings, setListings] = useState<Property[]>(initialListings);
  const [primaryImages, setPrimaryImages] = useState<Record<string, string>>(initialPrimaryImages);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Property | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // AC5 — per-row loading state for status change and delete
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  // ── Image state ───────────────────────────────────────────────────────────
  /** Existing images from DB (edit mode) */
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  /** Images marked for deletion (their IDs) */
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  /** New local files chosen but not yet uploaded */
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // ── Form open/close ───────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingListing(null);
    setFormError(null);
    setExistingImages([]);
    setRemovedImageIds([]);
    setPendingFiles([]);
    setShowForm(true);
  }

  async function openEdit(listing: Property) {
    setForm(formFromListing(listing));
    setEditingListing(listing);
    setFormError(null);
    setRemovedImageIds([]);
    setPendingFiles([]);
    setShowForm(true);

    // Fetch existing images for this listing
    setIsLoadingImages(true);
    try {
      const res = await fetch(`/api/images?property_id=${listing.id}`);
      if (res.ok) {
        const images = (await res.json()) as PropertyImage[];
        setExistingImages(images);
      } else {
        setExistingImages([]);
      }
    } catch {
      setExistingImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingListing(null);
    setFormError(null);
    setExistingImages([]);
    setRemovedImageIds([]);
    setPendingFiles([]);
  }

  // ── Field helper ─────────────────────────────────────────────────────────

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Image helpers ─────────────────────────────────────────────────────────

  function handleAddFiles(files: File[]) {
    setPendingFiles((prev) => [...prev, ...files]);
  }

  function handleRemoveExisting(imageId: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  }

  function handleRemovePending(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Upload pending files to Supabase Storage and save records to DB.
   * Returns the public URL of the first uploaded image (for thumbnail update).
   */
  const uploadPendingFiles = useCallback(
    async (propertyId: string, currentImageCount: number): Promise<string | null> => {
      if (pendingFiles.length === 0) return null;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      let firstUrl: string | null = null;

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          console.warn("[ImageUpload] Storage upload failed:", uploadError.message);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(path);

        const isPrimary = currentImageCount === 0 && i === 0;

        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: propertyId,
            image_url: publicUrl,
            is_primary: isPrimary,
            sort_order: currentImageCount + i,
          }),
        });

        if (res.ok && isPrimary) {
          firstUrl = publicUrl;
        }
      }

      return firstUrl;
    },
    [pendingFiles]
  );

  /**
   * Delete images marked for removal from DB (and Storage via the API).
   */
  const deleteRemovedImages = useCallback(async () => {
    await Promise.all(
      removedImageIds.map((id) =>
        fetch(`/api/images/${id}`, { method: "DELETE" }).catch(() => {
          // Best-effort — log but don't block the save
          console.warn("[ImageUpload] Failed to delete image", id);
        })
      )
    );
  }, [removedImageIds]);

  // ── Save (add or edit) ────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.price || !form.city.trim()) {
      setFormError("Title, price and city are required.");
      return;
    }

    const lat = form.latitude ? Number(form.latitude) : null;
    const lng = form.longitude ? Number(form.longitude) : null;
    if ((lat !== null) !== (lng !== null)) {
      setFormError("Both latitude and longitude must be set together.");
      return;
    }
    if (lat !== null && (lat < -90 || lat > 90)) {
      setFormError("Latitude must be between -90 and 90.");
      return;
    }
    if (lng !== null && (lng < -180 || lng > 180)) {
      setFormError("Longitude must be between -180 and 180.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = listingFromForm(form, agentId);

    if (editingListing) {
      // Optimistic edit
      const previous = listings;
      setListings((prev) =>
        prev.map((l) => (l.id === editingListing.id ? { ...l, ...payload } : l))
      );
      closeForm();

      const res = await fetch(`/api/listings/${editingListing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setListings(previous); // revert
        const { error } = (await res.json()) as { error: string };
        setFormError(error ?? "Failed to save. Please try again.");
        showToast(error ?? "Failed to save listing.", "error");
        void openEdit(editingListing);
      } else {
        const updated = (await res.json()) as Property;
        showToast("Listing updated successfully.", "success");
        setListings((prev) =>
          prev.map((l) => (l.id === updated.id ? updated : l))
        );

        // Handle image changes in parallel
        const remainingCount = existingImages.length; // after UI removals
        await Promise.all([
          deleteRemovedImages(),
          uploadPendingFiles(editingListing.id, remainingCount).then((newPrimaryUrl) => {
            if (newPrimaryUrl) {
              setPrimaryImages((prev) => ({ ...prev, [editingListing.id]: newPrimaryUrl }));
            }
            // If we removed the primary image, update thumbnail with new first existing image
            const hadPrimary = primaryImages[editingListing.id];
            if (hadPrimary && removedImageIds.some((id) =>
              existingImages.find((img) => img.id === id && img.is_primary)
            )) {
              const nextPrimary = existingImages.find(
                (img) => !removedImageIds.includes(img.id)
              );
              if (nextPrimary) {
                setPrimaryImages((prev) => ({ ...prev, [editingListing.id]: nextPrimary.image_url }));
              } else if (!newPrimaryUrl) {
                setPrimaryImages((prev) => {
                  const next = { ...prev };
                  delete next[editingListing.id];
                  return next;
                });
              }
            }
          }),
        ]);
      }
    } else {
      // Optimistic add with temp id
      const tempId = `temp-${Date.now()}`;
      const optimistic: Property = { id: tempId, created_at: new Date().toISOString(), ...payload };
      setListings((prev) => [optimistic, ...prev]);
      closeForm();

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== tempId)); // revert
        const { error } = (await res.json()) as { error: string };
        setFormError(error ?? "Failed to create listing.");
        showToast(error ?? "Failed to create listing.", "error");
        openAdd();
      } else {
        const created = (await res.json()) as Property;
        showToast("Listing created successfully.", "success");
        setListings((prev) => prev.map((l) => (l.id === tempId ? created : l)));

        // Upload images now that we have a real property_id
        const primaryUrl = await uploadPendingFiles(created.id, 0);
        if (primaryUrl) {
          setPrimaryImages((prev) => ({ ...prev, [created.id]: primaryUrl }));
        }
      }
    }

    setIsSaving(false);
  }, [form, agentId, editingListing, listings, existingImages, removedImageIds, deleteRemovedImages, uploadPendingFiles, primaryImages, showToast]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: string) => {
      const previous = listings;
      setDeletingId(id);
      setListings((prev) => prev.filter((l) => l.id !== id)); // optimistic
      setConfirmDeleteId(null);

      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setListings(previous); // revert
        showToast("Failed to delete listing.", "error");
      } else {
        showToast("Listing deleted.", "success");
        // Remove thumbnail entry
        setPrimaryImages((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      setDeletingId(null);
    },
    [listings, showToast]
  );

  // ── Status change ─────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(
    async (id: string, status: PropertyStatus) => {
      const previous = listings;
      setStatusChangingId(id);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))); // optimistic

      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setListings(previous); // revert
        showToast("Failed to update status.", "error");
      }
      setStatusChangingId(null);
    },
    [listings, showToast]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="font-display font-bold text-lg text-narra leading-tight">
            My Listings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
        </div>
        {/* AC4 — Add listing button */}
        <button
          type="button"
          onClick={openAdd}
          className="bg-primary text-white text-sm font-medium rounded-[12px] px-4 py-2.5 active:scale-[0.97] transition-transform duration-100"
        >
          + Add listing
        </button>
      </div>

      {/* AC — empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">🏠</p>
          <p className="font-semibold text-narra mb-1">No listings yet</p>
          <p className="text-sm text-muted mb-4">Add your first listing to get started.</p>
          <button
            type="button"
            onClick={openAdd}
            className="bg-primary text-white text-sm font-medium rounded-[12px] px-5 py-2.5 active:scale-[0.97] transition-transform duration-100"
          >
            Add listing
          </button>
        </div>
      ) : (
        // AC3 — Listing rows
        <div className="px-4 flex flex-col gap-3">
          {listings.map((listing) => {
            const thumbUrl = primaryImages[listing.id] ?? null;
            return (
              <div
                key={listing.id}
                className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-3 flex gap-3"
              >
                {/* AC1 (BH-40) — primary image thumbnail */}
                <div className="w-16 h-16 rounded-[10px] bg-sand-dark flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={listing.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">🏠</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-narra truncate">{listing.title}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {formatPrice(listing.price, listing.price_type)}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{listing.city}</p>

                  {/* AC8 — Status selector; AC5 — spinner while saving */}
                  <div className="relative mt-1.5 inline-flex items-center">
                    <select
                      value={listing.status}
                      disabled={statusChangingId === listing.id}
                      onChange={(e) => handleStatusChange(listing.id, e.target.value as PropertyStatus)}
                      className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 border-0 outline-none cursor-pointer transition-opacity ${statusBadgeClass(listing.status)} ${statusChangingId === listing.id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {(["active", "sold", "rented", "inactive"] as PropertyStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    {statusChangingId === listing.id && (
                      <span className="ml-1 w-2.5 h-2.5 border border-muted border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => void openEdit(listing)}
                    className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-sm active:scale-[0.92] transition-transform duration-100"
                    aria-label={`Edit ${listing.title}`}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(listing.id)}
                    disabled={deletingId === listing.id}
                    className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-sm active:scale-[0.92] transition-transform duration-100 disabled:opacity-50"
                    aria-label={`Delete ${listing.title}`}
                  >
                    {deletingId === listing.id ? (
                      <span className="w-3.5 h-3.5 border border-muted border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      "🗑️"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AC7 — Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-narra/40 backdrop-blur-sm">
          <div className="w-full max-w-[420px] bg-white rounded-t-[20px] p-5 pb-8">
            <p className="font-display font-semibold text-base text-narra mb-1">
              Delete listing?
            </p>
            <p className="text-sm text-muted mb-5">
              This action cannot be undone. All photos will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-sand-dark text-narra text-sm font-medium rounded-[12px] py-3 active:scale-[0.97] transition-transform duration-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteId)}
                className="flex-1 bg-primary text-white text-sm font-medium rounded-[12px] py-3 active:scale-[0.97] transition-transform duration-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AC5, AC6 — Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-narra/40 backdrop-blur-sm">
          <div className="w-full max-w-[420px] bg-white rounded-t-[20px] max-h-[90dvh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sand-dark flex-shrink-0">
              <p className="font-display font-semibold text-base text-narra">
                {editingListing ? "Edit listing" : "New listing"}
              </p>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted text-xl leading-none active:scale-[0.92] transition-transform"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {formError && (
                <div role="alert" className="bg-primary/10 text-primary text-sm rounded-[12px] px-3 py-2.5">
                  {formError}
                </div>
              )}

              {/* AC1 — Photo upload (AC2: first photo is primary) */}
              <Field label="Photos (up to 10)">
                {isLoadingImages ? (
                  <div className="w-full h-20 rounded-[12px] bg-sand-dark animate-pulse" />
                ) : (
                  <ImageUploader
                    existingImages={existingImages}
                    pendingFiles={pendingFiles}
                    onAddFiles={handleAddFiles}
                    onRemoveExisting={handleRemoveExisting}
                    onRemovePending={handleRemovePending}
                  />
                )}
              </Field>

              <Field label="Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. 3BR House in Cebu City"
                  className={inputClass}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Property details..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₱) *">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Type *">
                  <select
                    value={form.price_type}
                    onChange={(e) => setField("price_type", e.target.value as PriceType)}
                    className={inputClass}
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </Field>
              </div>

              <Field label="Property type *">
                <select
                  value={form.property_type}
                  onChange={(e) => setField("property_type", e.target.value as PropertyType)}
                  className={inputClass}
                >
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="lot">Lot</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="commercial">Commercial</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bedrooms">
                  <input
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => setField("bedrooms", e.target.value)}
                    placeholder="—"
                    min="0"
                    className={inputClass}
                  />
                </Field>
                <Field label="Bathrooms">
                  <input
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => setField("bathrooms", e.target.value)}
                    placeholder="—"
                    min="0"
                    className={inputClass}
                  />
                </Field>
                <Field label="Floor area (m²)">
                  <input
                    type="number"
                    value={form.floor_area}
                    onChange={(e) => setField("floor_area", e.target.value)}
                    placeholder="—"
                    min="0"
                    className={inputClass}
                  />
                </Field>
                <Field label="Lot size (m²)">
                  <input
                    type="number"
                    value={form.lot_size}
                    onChange={(e) => setField("lot_size", e.target.value)}
                    placeholder="—"
                    min="0"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="City *">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="e.g. Cebu City"
                  className={inputClass}
                />
              </Field>

              <Field label="Barangay">
                <input
                  type="text"
                  value={form.barangay}
                  onChange={(e) => setField("barangay", e.target.value)}
                  placeholder="e.g. Lahug"
                  className={inputClass}
                />
              </Field>

              <Field label="Address">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Street address"
                  className={inputClass}
                />
              </Field>

              {/* BH-30 — Map location picker */}
              <Field label="Pin on map (optional)">
                <DynamicLocationPicker
                  lat={form.latitude ? Number(form.latitude) : null}
                  lng={form.longitude ? Number(form.longitude) : null}
                  onPick={(pickedLat, pickedLng) => {
                    setField("latitude", String(pickedLat));
                    setField("longitude", String(pickedLng));
                  }}
                  onClear={() => {
                    setField("latitude", "");
                    setField("longitude", "");
                  }}
                />
              </Field>
            </div>

            {/* Save button — outside scroll area */}
            <div className="px-5 py-4 border-t border-sand-dark flex-shrink-0">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="w-full bg-primary text-white font-medium text-sm rounded-[12px] py-3.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-60"
              >
                {isSaving ? "Saving…" : editingListing ? "Save changes" : "Create listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helper component for form fields ───────────────────────────────────

const inputClass =
  "w-full bg-sand rounded-[12px] px-3 py-2.5 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      {children}
    </div>
  );
}
