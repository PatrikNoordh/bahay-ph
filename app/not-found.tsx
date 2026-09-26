import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--sand)] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-bold text-[var(--terra)] mb-4">404</p>
      <h1 className="font-playfair text-2xl text-[var(--narra)] mb-2">
        Page not found
      </h1>
      <p className="text-[var(--muted)] mb-8 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-[var(--terra)] text-white px-6 py-3 rounded-xl text-sm font-medium"
      >
        Back to home
      </Link>
    </div>
  );
}
