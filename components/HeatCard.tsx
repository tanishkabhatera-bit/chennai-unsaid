import { HEAT_STYLES } from "@/lib/labels";
import { HEAT_LINES, heatMood, type CurrentWeather } from "@/lib/weather";
import type { HeatRating } from "@/lib/types";

export default function HeatCard({ heat, weather }: { heat: HeatRating | null; weather: CurrentWeather | null }) {
  const mood = weather ? heatMood(weather.feelsLike) : null;

  return (
    <section className="rounded-[24px] border-[4px] border-ink bg-sun p-5 shadow-[6px_6px_0_#121212]">
      <h2 className="font-display text-2xl uppercase text-ink">Heat</h2>
      {weather && (
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-display text-4xl text-ink">{Math.round(weather.feelsLike)}°</span>
          <span className="font-body text-sm text-ink/80">feels like, right now · {Math.round(weather.temperature)}° air, {weather.humidity}% humidity</span>
        </div>
      )}
      {mood && <p className="mt-2 font-marker text-lg text-rust">&ldquo;{HEAT_LINES[mood].line}&rdquo;</p>}
      {heat ? (
        <p className="mt-3 font-body text-ink">
          <span className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${HEAT_STYLES[heat.rating]}`}>{heat.rating}</span>
          {heat.reason}.
        </p>
      ) : (
        <p className="mt-3 font-body text-ink/80">Heat rating not available yet.</p>
      )}
      <p className="mt-2 font-body text-xs text-ink/60">
        Live reading from Open-Meteo. Rating is indicative, based on tree cover, coastal distance and density.
      </p>
    </section>
  );
}
