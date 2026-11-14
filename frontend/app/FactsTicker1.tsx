"use client";
const FACTS = [
  "SPHEREx sees the sky in 102 infrared colors, from 0.75 to 5.0 micrometers.",
  "SPHEREx plans to map the entire sky four times during its two-year main mission.",
  "Barnard's Star is about 6 light-years away and has the largest proper motion of any known star.",
  "WISE 0855 is only about 7 light-years away, yet it is far too cold and faint to see with visible light.",
  "One SPHEREx pixel covers about 6 arcseconds of sky.",
];
export default function FactsTicker() {
  const items = [...FACTS, ...FACTS]; // doubled so the loop has no gap
  return (
    <div className="relative z-30 h-8 overflow-hidden bg-slate-950 border-b border-slate-800 flex items-center">
      <span className="shrink-0 px-3 text-[10px] uppercase tracking-widest text-indigo-300">Did you know</span>
      <div className="overflow-hidden flex-1">
        <div className="ticker-track text-xs text-slate-300">
          {items.map((f, i) => (
            <span key={i} className="px-8 whitespace-nowrap">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
