import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">We don&apos;t cover that area yet</h1>
      <p className="mt-2 text-slate-600">Try searching for a nearby Chennai locality.</p>
      <Link href="/" className="mt-6 inline-block font-medium text-teal-800 hover:underline">
        ← Back to search
      </Link>
    </div>
  );
}
