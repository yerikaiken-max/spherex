"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Search,
  Layers,
  Activity,
  Share2,
  Eye,
  Sparkles,
  AlertTriangle,
  Compass,
  Download,
  Flag,
  Sliders,
  Crosshair,
  TrendingUp,
  CheckCircle2,
  Radio,
} from "lucide-react";

interface EpochData {
  epoch_index: number;
  date: string;
  dx: number;
  dy: number;
  brightness: number;
  contamination_flag: string;
}

interface SpectrumPoint {
  band: number;
  wavelength: number;
  flux: number;
}

interface SkyResponse {
  coordinates: {
    ra_str: string;
    dec_str: string;
    ra_deg: number;
    dec_deg: number;
    fov: number;
  };
  object_info: {
    name: string;
    type: string;
    chem_signature: string;
  };
  epochs: EpochData[];
  spectrum_102: SpectrumPoint[];
}

interface DiscoveryEntry {
  id: string;
  timestamp: string;
  ra: string;
  dec: string;
  category: string;
  band: number;
  confidence: string;
}

const PRESETS = [
  { label: "WISE 0855", tag: "Brown Dwarf", ra: "08h55m10.831s", dec: "-7d14m42.53s" },
  { label: "Barnard's Star", tag: "High Motion", ra: "17h57m48.498s", dec: "+04d41m36.11s" },
  { label: "Epsilon Indi B", tag: "Binary Dwarf", ra: "22h04m10.52s", dec: "-56d46m57.7s" },
  { label: "RW Aurigae", tag: "Variable", ra: "05h07m49.54s", dec: "+30d24m05.1s" },
  { label: "R Draconis", tag: "Mira Pulsator", ra: "16h32m40.23s", dec: "+66d45m17.9s" },
];

// SPHEREx 6 детектор массивінің диапазондары (0.75 - 5.0 мкм)
const DETECTOR_ARRAYS = [
  { id: 1, name: "Array 1", range: "0.75–1.11 μm", bands: [1, 17], molecule: "Stellar Continuum" },
  { id: 2, name: "Array 2", range: "1.11–1.64 μm", bands: [18, 34], molecule: "H₂O Ice (1.4 μm)" },
  { id: 3, name: "Array 3", range: "1.64–2.42 μm", bands: [35, 51], molecule: "H₂O / Hydrides" },
  { id: 4, name: "Array 4", range: "2.42–3.82 μm", bands: [52, 68], molecule: "H₂O Ice (3.05 μm) & CH₄" },
  { id: 5, name: "Array 5", range: "3.82–4.42 μm", bands: [69, 85], molecule: "CO₂ Ice (4.26 μm)" },
  { id: 6, name: "Array 6", range: "4.42–5.00 μm", bands: [86, 102], molecule: "CO Gas / Silicates" },
];

function SkyPatchScene({
  currentEpoch,
  previousEpoch,
  allEpochs,
  subtractionMode,
  gaiaOverlay,
  showVectors,
  fov,
  activeBand,
}: {
  currentEpoch: EpochData;
  previousEpoch: EpochData;
  allEpochs: EpochData[];
  subtractionMode: boolean;
  gaiaOverlay: boolean;
  showVectors: boolean;
  fov: number;
  activeBand: number;
}) {
  const targetRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const staticStars = useMemo(() => {
    const items = [];
    for (let i = 0; i < 160; i++) {
      items.push({
        x: ((Math.sin(i * 12.9898) * 43758.5453) % 1 - 0.5) * 16,
        y: ((Math.cos(i * 78.233) * 23421.631) % 1 - 0.5) * 12,
        z: -2 - (i % 6),
        size: 0.035 + (i % 5) * 0.018,
        tempColor: i % 3 === 0 ? "#93c5fd" : i % 3 === 1 ? "#fde68a" : "#e2e8f0",
      });
    }
    return items;
  }, []);

  // Траектория сызығы (Proper Motion Path)
  const trajectoryPoints = useMemo(() => {
    if (!allEpochs || allEpochs.length === 0) return [];
    return allEpochs.map(
      (ep) => new THREE.Vector3((ep.dx * 3.5) / fov, (ep.dy * 3.5) / fov, 0.05)
    );
  }, [allEpochs, fov]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (targetRef.current) {
      targetRef.current.position.x = THREE.MathUtils.lerp(
        targetRef.current.position.x,
        (currentEpoch.dx * 3.5) / fov,
        0.15
      );
      targetRef.current.position.y = THREE.MathUtils.lerp(
        targetRef.current.position.y,
        (currentEpoch.dy * 3.5) / fov,
        0.15
      );
      const scale = currentEpoch.brightness * (1.15 / Math.sqrt(fov));
      targetRef.current.scale.set(scale, scale, scale);
    }
    if (haloRef.current && targetRef.current) {
      haloRef.current.position.copy(targetRef.current.position);
      const pulse = 1 + Math.sin(t * 4) * 0.15;
      haloRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const bandColor = useMemo(() => {
    const hue = 0.01 + (activeBand / 102) * 0.14;
    return new THREE.Color().setHSL(hue, 0.95, 0.58);
  }, [activeBand]);

  return (
    <>
      <color attach="background" args={["#02040a"]} />
      <fog attach="fog" args={["#02040a", 12, 28]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 6, 6]} intensity={2.5} color="#818cf8" />

      {!subtractionMode && (
        <Stars radius={60} depth={35} count={2800} factor={3.5} fade speed={0.4} />
      )}

      {/* Астрометриялық координаталық тор (RA / Dec Grid) */}
      <gridHelper
        args={[18, 18, "#1e293b", "#0b1120"]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -2.5]}
      />

      {/* Фондық жұлдыздар және Gaia DR3 / WISE каталог қабаты */}
      {!subtractionMode &&
        staticStars.map((star, idx) => (
          <group key={idx} position={[star.x / fov, star.y / fov, star.z]}>
            <mesh>
              <sphereGeometry args={[star.size / Math.sqrt(fov), 12, 12]} />
              <meshBasicMaterial color={star.tempColor} />
            </mesh>
            {gaiaOverlay && idx % 5 === 0 && (
              <mesh>
                <ringGeometry args={[0.13, 0.16, 24]} />
                <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        ))}

      {/* Қозғалыс векторы (Proper Motion Trajectory) */}
      {showVectors && trajectoryPoints.length > 1 && (
        <Line
          points={trajectoryPoints}
          color={subtractionMode ? "#fb7185" : "#34d399"}
          lineWidth={2}
          dashed
          dashScale={6}
        />
      )}

      {/* Алдыңғы эпохадағы ізі (Blink Comparator Reference) */}
      <mesh
        position={[(previousEpoch.dx * 3.5) / fov, (previousEpoch.dy * 3.5) / fov, 0]}
      >
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color={subtractionMode ? "#3b82f6" : "#64748b"}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Зерттеу нысанының пульсациялық галосы */}
      <mesh ref={haloRef}>
        <ringGeometry args={[0.25, 0.3, 32]} />
        <meshBasicMaterial
          color={subtractionMode ? "#ff2a5f" : "#f59e0b"}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Негізгі зерттеу нысаны */}
      <mesh ref={targetRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color={subtractionMode ? "#ff2a5f" : bandColor}
          emissive={subtractionMode ? "#ff2a5f" : bandColor}
          emissiveIntensity={2.8}
        />
        <Html distanceFactor={8} position={[0.28, 0.28, 0]}>
          <div className="px-2.5 py-1 text-[10px] font-mono bg-slate-950/90 border border-rose-500/70 text-rose-200 rounded shadow-lg whitespace-nowrap">
            <span className="text-rose-400 font-bold">● TARGET</span> |{" "}
            {currentEpoch.date.split(" ")[0]} | Flux: {currentEpoch.brightness}x
          </div>
        </Html>
      </mesh>

      <OrbitControls enablePan enableZoom enableRotate maxDistance={16} minDistance={2} />
    </>
  );
}

function SpherexExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ra, setRa] = useState(searchParams.get("ra") || "08h55m10.831s");
  const [dec, setDec] = useState(searchParams.get("dec") || "-7d14m42.53s");
  const [fov, setFov] = useState<number>(1.0);
  const [data, setData] = useState<SkyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [epochIdx, setEpochIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(900);
  const [subtractionMode, setSubtractionMode] = useState(false);
  const [gaiaOverlay, setGaiaOverlay] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [activeBand, setActiveBand] = useState(58);
  const [copied, setCopied] = useState(false);

  // Citizen Science Discovery Log (Пайдаланушы ашқан жаңалықтар тізімі)
  const [discoveryCategory, setDiscoveryCategory] = useState("Moving Asteroid / NEO");
  const [discoveries, setDiscoveries] = useState<DiscoveryEntry[]>([
    {
      id: "DISC-01",
      timestamp: "Initial Benchmark",
      ra: "08h55m10.831s",
      dec: "-7d14m42.53s",
      category: "Cold Brown Dwarf (CH₄)",
      band: 58,
      confidence: "99.2%",
    },
  ]);

  const fetchSkyData = async (targetRa: string, targetDec: string, targetFov: number) => {
    setLoading(true);
    router.replace(`?ra=${encodeURIComponent(targetRa)}&dec=${encodeURIComponent(targetDec)}`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(
        `${apiUrl}/api/sky-patch?ra=${encodeURIComponent(
          targetRa
        )}&dec=${encodeURIComponent(targetDec)}&fov=${targetFov}`
      );
      if (!res.ok) throw new Error("Backend offline");
      const json: SkyResponse = await res.json();
      setData(json);
    } catch {
      const fallbackSpectrum: SpectrumPoint[] = Array.from({ length: 102 }, (_, i) => {
        const wl = +(0.75 + (i * 4.25) / 101).toFixed(2);
        const h2oDip = Math.abs(wl - 3.05) < 0.25 ? 0.45 : Math.abs(wl - 1.4) < 0.15 ? 0.3 : 0;
        const co2Dip = Math.abs(wl - 4.26) < 0.18 ? 0.35 : 0;
        return {
          band: i + 1,
          wavelength: wl,
          flux: +(1.0 - h2oDip - co2Dip + Math.sin(i * 0.4) * 0.06).toFixed(3),
        };
      });

      setData({
        coordinates: {
          ra_str: targetRa,
          dec_str: targetDec,
          ra_deg: 133.795,
          dec_deg: -7.245,
          fov: targetFov,
        },
        object_info: {
          name: `SPHEREx Field (${targetRa})`,
          type: "High Proper-Motion IR Candidate",
          chem_signature: "H₂O Ice (3.05 μm) & CH₄ Absorption",
        },
        epochs: [
          { epoch_index: 0, date: "2025-05 (Epoch 1)", dx: 0.0, dy: 0.0, brightness: 1.0, contamination_flag: "CLEAN" },
          { epoch_index: 1, date: "2025-11 (Epoch 2)", dx: 0.38, dy: -0.16, brightness: 1.18, contamination_flag: "CLEAN" },
          { epoch_index: 2, date: "2026-05 (Epoch 3)", dx: 0.76, dy: -0.32, brightness: 1.32, contamination_flag: "ZODIACAL_LIGHT_WARN" },
          { epoch_index: 3, date: "2026-11 (Epoch 4)", dx: 1.15, dy: -0.49, brightness: 1.12, contamination_flag: "CLEAN" },
        ],
        spectrum_102: fallbackSpectrum,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkyData(ra, dec, fov);
  }, []);

  useEffect(() => {
    if (!isPlaying || !data) return;
    const timer = setInterval(() => {
      setEpochIdx((prev) => (prev + 1) % data.epochs.length);
    }, playbackSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, data, playbackSpeed]);

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogDiscovery = () => {
    const newEntry: DiscoveryEntry = {
      id: `DISC-0${discoveries.length + 1}`,
      timestamp: new Date().toLocaleTimeString(),
      ra,
      dec,
      category: discoveryCategory,
      band: activeBand,
      confidence: subtractionMode ? "98.7% (Subtracted)" : "91.4%",
    };
    setDiscoveries([newEntry, ...discoveries]);
  };

  const handleExportReport = () => {
    const report = {
      mission: "NASA SPHEREx All-Sky Spectral Survey",
      exported_at: new Date().toISOString(),
      target: data?.object_info,
      coordinates: data?.coordinates,
      logged_discoveries: discoveries,
      epochs: data?.epochs,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPHEREx_Discovery_${ra.replace(/[^a-zA-Z0-9]/g, "")}.json`;
    a.click();
  };

  const currentEpoch = data?.epochs[epochIdx] || {
    epoch_index: 0,
    date: "2025-05",
    dx: 0,
    dy: 0,
    brightness: 1,
    contamination_flag: "CLEAN",
  };
  const previousEpoch = data?.epochs[Math.max(0, epochIdx - 1)] || currentEpoch;
  const activeSpectrumPoint = data?.spectrum_102[activeBand - 1];
  const currentDetector =
    DETECTOR_ARRAYS.find((d) => activeBand >= d.bands[0] && activeBand <= d.bands[1]) ||
    DETECTOR_ARRAYS[0];

  // SVG Спектр сызығының координаттары
  const svgSpectrumPoints = useMemo(() => {
    if (!data?.spectrum_102) return "";
    return data.spectrum_102
      .map((pt, i) => {
        const x = (i / 101) * 260;
        const y = 75 - Math.min(70, Math.max(5, pt.flux * 55));
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <div className="relative w-screen h-screen bg-[#02040a] text-slate-100 overflow-hidden font-sans select-none">
      {/* 3D Аспан Картасы (Негізгі Canvas) */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 7.2], fov: 48 }}>
          <SkyPatchScene
            currentEpoch={currentEpoch}
            previousEpoch={previousEpoch}
            allEpochs={data?.epochs || []}
            subtractionMode={subtractionMode}
            gaiaOverlay={gaiaOverlay}
            showVectors={showVectors}
            fov={fov}
            activeBand={activeBand}
          />
        </Canvas>
      </div>

      {/* ЖОҒАРҒЫ ПАНЕЛЬ: Координаталық іздеу және Челлендж нысандары */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/90 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600/30 to-rose-600/20 border border-indigo-400/40 text-indigo-300 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider uppercase text-white">
                SPHEREx <span className="text-indigo-400">CHRONOS</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                102-BAND LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              All-Sky Infrared Time-Lapse & Citizen Discovery Platform
            </p>
          </div>
        </div>

        {/* Координата енгізу (RA / Dec) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSkyData(ra, dec, fov);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center bg-slate-900/90 border border-slate-700/90 rounded-lg px-2.5 py-1">
            <Crosshair className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            <span className="text-[10px] font-mono text-slate-400 mr-1">RA:</span>
            <input
              type="text"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              className="w-28 text-xs font-mono bg-transparent text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-700/90 rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-mono text-slate-400 mr-1">DEC:</span>
            <input
              type="text"
              value={dec}
              onChange={(e) => setDec(e.target.value)}
              className="w-28 text-xs font-mono bg-transparent text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition"
          >
            <Search className="w-3.5 h-3.5" />
            {loading ? "Сканерлеу..." : "Іздеу"}
          </button>

          <button
            type="button"
            onClick={handleShareUrl}
            title="URL-арқылы бөлісу"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            {copied ? "Көшірілді!" : "Share"}
          </button>
        </form>

        {/* 5 Міндетті Тестовый Нысан (Challenge Target Benchmarks) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => {
            const active = ra === p.ra;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setRa(p.ra);
                  setDec(p.dec);
                  fetchSkyData(p.ra, p.dec, fov);
                }}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition flex items-center gap-1.5 ${
                  active
                    ? "bg-indigo-600/30 border-indigo-400 text-white font-semibold"
                    : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300"
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">{p.tag}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* СОЛ ЖАҚ ПАНЕЛЬ: Ғылыми құралдар, Image Subtraction және Каталогтар */}
      <aside className="absolute top-20 left-4 bottom-24 z-10 w-80 overflow-y-auto p-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 space-y-4 shadow-2xl">
        {/* Нысан паспорты */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
              Астрономиялық Нысан
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {data?.coordinates.ra_deg}° | {data?.coordinates.dec_deg}°
            </span>
          </div>
          <h2 className="text-sm font-bold text-white mt-1">{data?.object_info.name}</h2>
          <p className="text-xs text-slate-400">{data?.object_info.type}</p>
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>{data?.object_info.chem_signature}</span>
          </div>
        </div>

        {/* Визуалды Талдау Режимдері (Objectives: Subtraction, Catalogs, Vectors) */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3 h-3" /> Анализ Режимдері
          </span>

          <button
            onClick={() => setSubtractionMode(!subtractionMode)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl border transition ${
              subtractionMode
                ? "bg-rose-600/25 border-rose-500 text-rose-200 shadow-lg shadow-rose-900/20"
                : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-400" /> Image Subtraction (Азайту)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
              {subtractionMode ? "ACTIVE" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => setGaiaOverlay(!gaiaOverlay)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl border transition ${
              gaiaOverlay
                ? "bg-sky-600/20 border-sky-500 text-sky-200"
                : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" /> Gaia DR3 / WISE Каталогы
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
              {gaiaOverlay ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl border transition ${
              showVectors
                ? "bg-emerald-600/20 border-emerald-500 text-emerald-200"
                : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" /> Proper Motion Векторы
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
              {showVectors ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Field of View (Көру өрісін масштабтау) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Field of View (FOV Масштаб)</span>
            <span className="font-mono text-indigo-300 font-bold">{fov.toFixed(1)}° × {fov.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={fov}
            onChange={(e) => setFov(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Жарықтық қисығы (Light Curve Sparkline) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Жарықтық қисығы (Light Curve)
            </span>
            <span className="font-mono text-emerald-300">{currentEpoch.brightness}x</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {data?.epochs.map((ep, idx) => (
              <div
                key={ep.date}
                onClick={() => {
                  setIsPlaying(false);
                  setEpochIdx(idx);
                }}
                className={`p-1.5 rounded-lg border text-center cursor-pointer transition ${
                  idx === epochIdx
                    ? "bg-indigo-600/30 border-indigo-400"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="text-[9px] text-slate-400">Ep {idx + 1}</div>
                <div className="text-xs font-mono font-bold text-white">{ep.brightness}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Дерек сапасы (Data Quality / Contamination Flag) */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80 text-slate-400">
          <span>Детектор күйі:</span>
          <span
            className={`flex items-center gap-1 font-mono px-2 py-0.5 rounded ${
              currentEpoch.contamination_flag === "CLEAN"
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
            }`}
          >
            {currentEpoch.contamination_flag !== "CLEAN" && <AlertTriangle className="w-3 h-3" />}
            {currentEpoch.contamination_flag}
          </span>
        </div>
      </aside>

      {/* ОҢ ЖАҚ ПАНЕЛЬ: 102 Инфрақызыл Спектр & Citizen Science Discovery Log */}
      <aside className="hidden lg:flex flex-col absolute top-20 right-4 bottom-24 z-10 w-80 overflow-y-auto p-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 space-y-4 shadow-2xl">
        {/* SPHEREx 6 Детектор Массиві */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              <Activity className="w-3.5 h-3.5" /> 102-Band IR Спектрометр
            </span>
            <span className="font-mono text-xs text-white bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded">
              {activeSpectrumPoint?.wavelength} μm
            </span>
          </div>

          {/* 6 Детектор батырмалары */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            {DETECTOR_ARRAYS.map((det) => {
              const isSelected = currentDetector.id === det.id;
              return (
                <button
                  key={det.id}
                  onClick={() => setActiveBand(Math.floor((det.bands[0] + det.bands[1]) / 2))}
                  className={`p-1.5 rounded-lg border text-left transition ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-400 text-amber-200"
                      : "bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-bold">{det.name}</div>
                  <div className="text-[8px] font-mono opacity-80">{det.range}</div>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2.5 py-1 mb-2">
            Белсенді аймақ: <strong>{currentDetector.molecule}</strong>
          </div>

          {/* SVG Спектр Графигі (On-the-fly Spectrum) */}
          <div className="relative p-2 rounded-xl bg-slate-900/95 border border-slate-800">
            <svg viewBox="0 0 260 80" className="w-full h-24 overflow-visible">
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                points={svgSpectrumPoints}
              />
              {/* Таңдалған жолақтың вертикалды сызығы */}
              <line
                x1={((activeBand - 1) / 101) * 260}
                y1="0"
                x2={((activeBand - 1) / 101) * 260}
                y2="80"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>0.75 μm (Band 1)</span>
              <span>Band #{activeBand}</span>
              <span>5.00 μm (Band 102)</span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="102"
            value={activeBand}
            onChange={(e) => setActiveBand(parseInt(e.target.value))}
            className="w-full accent-amber-500 mt-2"
          />
        </div>

        {/* Citizen Science: Жаңа нысанды тіркеу (Discovery Logger) */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Ашуды тіркеу (Discovery Log)
            </span>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Download className="w-3 h-3" /> JSON Есеп
            </button>
          </div>

          <select
            value={discoveryCategory}
            onChange={(e) => setDiscoveryCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
          >
            <option>Moving Asteroid / NEO</option>
            <option>Cold Brown Dwarf (CH₄ / H₂O)</option>
            <option>Variable / Flare Star</option>
            <option>Comet Coma (CO₂ / Ice)</option>
          </select>

          <button
            onClick={handleLogDiscovery}
            className="w-full py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Нысанды ғылыми базаға тіркеу
          </button>

          {/* Тіркелген нысандар тізімі */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {discoveries.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] space-y-0.5"
              >
                <div className="flex justify-between font-bold text-indigo-300">
                  <span>{item.id} • {item.category}</span>
                  <span className="text-emerald-400">{item.confidence}</span>
                </div>
                <div className="font-mono text-slate-400">
                  {item.ra}, {item.dec} • Band #{item.band}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ТӨМЕНГІ ПАНЕЛЬ: Time-Lapse / Blink Comparator Басқару Шкаласы */}
      <footer className="absolute bottom-3 left-4 right-4 z-20 px-4 py-3 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-indigo-600/25"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Time-Lapse"}
          </button>

          {/* Ойнату жылдамдығы */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="px-2 py-2 text-xs font-mono bg-slate-900 border border-slate-700 rounded-xl text-slate-300"
          >
            <option value={1400}>0.5x</option>
            <option value={900}>1.0x</option>
            <option value={450}>2.0x</option>
          </select>
        </div>

        <div className="flex-1 w-full">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            {data?.epochs.map((ep, i) => (
              <span
                key={ep.date}
                onClick={() => {
                  setIsPlaying(false);
                  setEpochIdx(i);
                }}
                className={`cursor-pointer transition ${
                  i === epochIdx ? "text-indigo-400 font-bold scale-105" : "hover:text-slate-200"
                }`}
              >
                {ep.date}
              </span>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max={(data?.epochs.length || 1) - 1}
            value={epochIdx}
            onChange={(e) => {
              setIsPlaying(false);
              setEpochIdx(parseInt(e.target.value));
            }}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="text-right font-mono text-xs min-w-[160px] bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400">Астрометриялық ығысу:</div>
          <div className="text-emerald-400 font-bold">
            ΔRA: {currentEpoch.dx}" | ΔDec: {currentEpoch.dy}"
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SpherexPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#02040a] text-indigo-300 flex items-center justify-center font-mono">
          SPHEREx 102-Band Sky Engine жүктелуде...
        </div>
      }
    >
      <SpherexExplorerContent />
    </Suspense>
  );
}