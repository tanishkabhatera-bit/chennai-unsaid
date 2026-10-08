import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { getLocalities } from "@/lib/data";

const EXAMPLES = [
  { slug: "velachery", name: "Velachery" },
  { slug: "t-nagar", name: "T Nagar" },
  { slug: "adyar", name: "Adyar" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center py-16 text-center sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Know the area before you sign.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        Flood history, heat, and what residents say. The things listings leave out.
      </p>

      <div className="mt-8 w-full max-w-xl">
        <SearchBox localities={getLocalities()} />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((e) => (
          <Link
            key={e.slug}
            href={`/area/${e.slug}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-600 hover:text-teal-800"
          >
            {e.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
