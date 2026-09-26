import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="text-6xl font-bold text-[var(--terra)] mb-4">404</p>
      <h1 className="font-playfair text-2xl text-[var(--narra)] mb-2">
        Property not found
      </h1>
      <p className="text-[var(--muted)] mb-8">
        This listing may have been removed or the link is incorrect.
      </p>
      <Link
        href="/search"
        className="bg-[var(--terra)] text-white px-6 py-3 rounded-xl text-sm font-medium"
      >
        Browse listings
      </Link>
    </div>
  );
}
