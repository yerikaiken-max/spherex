"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TargetInfo, Measured } from "./targetInfo";

const row = (label: string, m: Measured) => (
  <div className="flex justify-between text-xs py-1">
    <span className="text-slate-400">{label}</span>
    <span className="font-mono text-slate-200">
      {m.value === null ? "Not loaded yet" : `${m.value} ${m.unit}`}
    </span>
  </div>
);

export default function InfoMenu({
  name, info, wavelength, detector,
}: { name: string; info: TargetInfo | null; wavelength?: number; detector: string }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const toggle = (s: string) => setSection(section === s ? null : s);
  const head = (id: string, title: string) => (
    <button onClick={() => toggle(id)} className="w-full flex justify-between items-center py-2 text-sm text-slate-200">
      {title}
      <ChevronDown className={`w-4 h-4 transition ${section === id ? "rotate-180" : ""}`} />
    </button>
  );
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg">
        Object details <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-40 w-72 p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl divide-y divide-slate-800">
          <div className="pb-2 text-xs text-indigo-300 font-semibold">{name}</div>
          <div>
            {head("phys", "Physical parameters")}
            {section === "phys" && info && (
              <div className="pb-2">
                {row("Radius", info.radius)}
                {row("Rotation period", info.rotationPeriod)}
                {row("Motion across sky", info.properMotion)}
              </div>
            )}
            {section === "phys" && !info && <p className="pb-2 text-xs text-slate-500">Pick one of the five targets to see data.</p>}
          </div>
          <div>
            {head("atm", "Atmosphere")}
            {section === "atm" && (
              <p className="pb-2 text-xs text-slate-300">{info?.atmosphere || "Not loaded yet"}</p>
            )}
          </div>
          <div>
            {head("spec", "Spectrometry")}
            {section === "spec" && (
              <p className="pb-2 text-xs text-slate-300">
                Selected band: {wavelength ?? "-"} μm. Detector: {detector}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
