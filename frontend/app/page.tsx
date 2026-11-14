"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Search,
  Sparkles,
  HelpCircle,
  Globe,
  Bot,
  Info,
  BookOpen,
  X,
  Compass,
} from "lucide-react";

// --- ТІЛДЕРГЕ АРНАЛҒАН МӘТІНДЕР (Localization) ---
const TRANSLATIONS = {
  kk: {
    title: "SPHEREx Аспан Әлемі",
    subtitle: "Бастауыш астрономдарға арналған интерактивті карта",
    searchPlaceholder: "Мысалы: Barnard's Star",
    searchBtn: "Зерттеу",
    timeLapse: "Уақыт бойынша жылжу",
    pause: "Кідірту",
    play: "Қозғалысты көру",
    aiPrompt: "Түсініксіз элементті екі рет басыңыз (Double-click) немесе мұнда сұраңыз!",
    assistantTitle: "Ғарыштық Жаршы (ИИ)",
    earthCompareSize: "Жермен салыстырғандағы көлемі:",
    atmosphereTrace: "Атмосфера құрамы (Спектр арқылы):",
    spectrometerTip: "Спектрометр дегеніміз не?",
    spectrometerDesc: "Бұл жұлдыздың шамын 102 түрлі түске бөліп, ішінде қандай газдар немесе мұз бар екенін «иісінен» танитын сиқырлы спектрлік көзілдірік сияқты!",
    movementTime: "Қозғалыс уақыты:",
    days: "күн бұрын",
    years: "жыл",
  },
  ru: {
    title: "SPHEREx Космос для Всех",
    subtitle: "Интерактивный путеводитель по звездам для начинающих",
    searchPlaceholder: "Например: Barnard's Star",
    searchBtn: "Изучить",
    timeLapse: "Хронология движения",
    pause: "Пауза",
    play: "Запустить время",
    aiPrompt: "Дважды кликните на любой элемент интерфейса для подсказки ИИ!",
    assistantTitle: "Космический Помощник (ИИ)",
    earthCompareSize: "Сравнение с Землей:",
    atmosphereTrace: "Состав атмосферы (по спектру):",
    spectrometerTip: "Что такое спектрометр?",
    spectrometerDesc: "Это прибор, который раскладывает свет звезды на 102 оттенка и находит внутри воду, метан или углекизлый газ, как отпечатки пальцев!",
    movementTime: "Время в пути/движения:",
    days: "дней",
    years: "лет",
  },
  en: {
    title: "SPHEREx Cosmos Explorer",
    subtitle: "An easy and engaging space guide for beginners",
    searchPlaceholder: "E.g., Barnard's Star",
    searchBtn: "Explore",
    timeLapse: "Time-Lapse Movement",
    pause: "Pause",
    play: "Play Time",
    aiPrompt: "Double-click any element on the screen to ask the AI assistant!",
    assistantTitle: "Cosmic AI Guide",
    earthCompareSize: "Compared to Earth:",
    atmosphereTrace: "Atmosphere & Spectrum:",
    spectrometerTip: "What is a Spectrometer?",
    spectrometerDesc: "It splits starlight into 102 colors to detect water ice or gases, acting like a chemical fingerprint reader!",
    movementTime: "Movement Duration:",
    days: "days",
    years: "years",
  },
};

// --- 20 ҚЫЗЫҚТЫ ФАКТІЛЕР (Әр 20 секунд сайын ауысады) ---
const FUN_FACTS = [
  "⭐ Барнард жұлдызы аспанда ең жылдам қозғалатын жұлдыздардың бірі!",
  "🪐 Қоңыр ергежейлілер (Brown Dwarfs) — жұлдыз бен планетаның ортасындағы жұмбақ объектілер.",
  "🔭 SPHEREx телескопы барлық аспанды инфрақызыл сәуледе 4 рет суретке түсіреді.",
  "💧 Ғарышта Жердегі барлық мұхиттан да көп су мұзы бар бұлттар кездеседі!",
  "✨ Жұлдыздардың түсі олардың температурасына байланысты: қызықтары салқын, көктері өте ыстық.",
  "🧊 3.05 микрон толқынында су мұзының «ізі» анық көрінеді.",
  "🚀 Жарық жылдамдығымен ұшсаңыз, Айға 1 секундта жетесіз!",
  "🌌 Біздің Құс жолы галактикамызда жүздеген миллиард жұлдыз бар.",
  "🛰️ Инфрақызыл телескоптар қараңғы тозаң бұлттарының ар жағын көре алады.",
  "🌍 Жер планетасы — Күн жүйесіндегі тіршілік бар жалғыз белгілі орын.",
  "☄️ Кометалар — Күн жүйесінің ерте заманнан қалған мұзды қонақтары.",
  "☀️ Күннің ішіне 1 миллионнан астам Жер сыйып кетеді!",
  "🌠 Ақ ергежейлілер — өлген жұлдыздардың тығыз қалдықтары.",
  "🔭 Телескоптар көмегімен біз өткен шаққа қараймыз, өйткені жарықтың келуіне уақыт керек.",
  "🪐 Юпитер — Күн жүйесіндегі ең үлкен планета.",
  "🧊 Мұзды планеталарда температура өте төмен болады.",
  "✨ Жұлдыздардың жарығы миллиондаған жылдар бұрын шыққан болуы мүмкін.",
  "🚀 SPHEREx жобасы ғарыштың химиялық құрамын картаға түсіреді.",
  "🌌 Әлемдегі галактикалар саны құм түйіршіктерінен де көп.",
  "🔭 Астрономия — адамзаттың ең көне әрі қызықты ғылымы!",
];

const PRESETS = [
  { label: "WISE 0855", sizeText: "Меньше Земли в 1.2 раза (размером с крупную планету)", atmosphere: "Метан (CH₄) и водяной лед", daysPassed: "730 дней (2 года)", ra: "08h55m10.831s", dec: "-7d14m42.53s" },
  { label: "Barnard's Star", sizeText: "Больше Земли в 5 раз (Красный карлик)", atmosphere: "Водород и гидриды металлов", daysPassed: "365 дней (1 год)", ra: "17h57m48.498s", dec: "+04d41m36.11s" },
  { label: "Epsilon Indi B", sizeText: "Больше Земли в 8 раз (Коричневый карлик)", atmosphere: "Аммиак и угарный газ (CO)", daysPassed: "1095 дней (3 года)", ra: "22h04m10.52s", dec: "-56d46m57.7s" },
  { label: "RW Aurigae", sizeText: "Больше Земли в 15 раз (Молодая звезда)", atmosphere: "Силикатная пыль и водяной пар", daysPassed: "180 дней (около 6 месяцев)", ra: "05h07m49.54s", dec: "+30d24m05.1s" },
  { label: "R Draconis", sizeText: "Больше Земли в 30 раз (Гигантская пульсирующая звезда)", atmosphere: "Углекислый газ и водяной лед", daysPassed: "1460 дней (4 года)", ra: "16h32m40.23s", dec: "+66d45m17.9s" },
];

function SkyPatchScene({ currentEpoch, fov, activeBand }: { currentEpoch: any; fov: number; activeBand: number }) {
  const targetRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (targetRef.current) {
      targetRef.current.position.x = THREE.MathUtils.lerp(targetRef.current.position.x, currentEpoch.dx * 3.5, 0.15);
      targetRef.current.position.y = THREE.MathUtils.lerp(targetRef.current.position.y, currentEpoch.dy * 3.5, 0.15);
    }
  });

  const bandColor = useMemo(() => {
    const hue = 0.05 + (activeBand / 102) * 0.15;
    return new THREE.Color().setHSL(hue, 0.9, 0.6);
  }, [activeBand]);

  return (
    <>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.5} />
      <Stars radius={50} depth={25} count={1500} factor={3} fade speed={0.3} />
      <mesh ref={targetRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={bandColor} emissive={bandColor} emissiveIntensity={2.5} />
        <Html distanceFactor={8} position={[0.3, 0.3, 0]}>
          <div className="px-2 py-1 text-[11px] font-sans bg-black/85 border border-indigo-500/50 text-indigo-200 rounded-lg shadow-xl whitespace-nowrap">
            ⭐ Нысан / Звезда • {currentEpoch.date}
          </div>
        </Html>
      </mesh>
      <OrbitControls enablePan enableZoom enableRotate maxDistance={14} minDistance={2} />
    </>
  );
}

function SpherexExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [lang, setLang] = useState<"kk" | "ru" | "en">("ru");
  const t = TRANSLATIONS[lang];

  const [ra, setRa] = useState(searchParams.get("ra") || "08h55m10.831s");
  const [dec, setDec] = useState(searchParams.get("dec") || "-7d14m42.53s");
  const [fov, setFov] = useState<number>(1.0);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [epochIdx, setEpochIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeBand, setActiveBand] = useState(42);

  // Фактілерді әр 20 секунд сайын ауыстыру
  const [factIndex, setFactIndex] = useState(0);
  useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 20000);
    return () => clearInterval(factTimer);
  }, []);

  // ИИ Ассистент модалы (Double click кезінде немесе батырма арқылы ашылады)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("Сәлем! Мен сіздің ғарыштық көмекшіңізбін. Экрандағы кез келген нәрсені түсіндіруге дайынмын!");

  const handleDoubleClick = (elementName: string) => {
    setAiOpen(true);
    setAiQuestion(`Что такое "${elementName}"?`);
    setAiAnswer(`Бұл элемент («${elementName}») астрономияда өте маңызды рөл атқарады. Ол арқылы біз жұлдыздың қозғалысын немесе оның құрамындағы газдарды оңай түсіне аламыз! Новичоктар үшін бұл ешқандай қиындық тудырмайды.`);
  };

  const currentPreset = PRESETS.find((p) => p.ra === ra) || PRESETS[0];

  const fetchSkyData = async (targetRa: string, targetDec: string, targetFov: number) => {
    setLoading(true);
    router.replace(`?ra=${encodeURIComponent(targetRa)}&dec=${encodeURIComponent(targetDec)}`);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/sky-patch?ra=${encodeURIComponent(targetRa)}&dec=${encodeURIComponent(targetDec)}&fov=${targetFov}`);
      if (!res.ok) throw new Error("Backend offline");
      const json = await res.json();
      setData(json);
    } catch {
      setData({
        coordinates: { ra_str: targetRa, dec_str: targetDec, fov: targetFov },
        object_info: { name: `Звезда / Объект (${targetRa})`, type: "Инфрақызыл нысан / IR Object", chem_signature: "Водяной лед & Метан" },
        epochs: [
          { epoch_index: 0, date: "2025 (Старт)", dx: 0.0, dy: 0.0, brightness: 1.0 },
          { epoch_index: 1, date: "Қозғалыс кезеңі 1", dx: 0.35, dy: -0.15, brightness: 1.15 },
          { epoch_index: 2, date: "Қозғалыс кезеңі 2", dx: 0.72, dy: -0.31, brightness: 1.25 },
          { epoch_index: 3, date: "Ақырғы нүкте", dx: 1.10, dy: -0.48, brightness: 1.10 },
        ],
        spectrum_102: Array.from({ length: 102 }, (_, i) => ({ band: i + 1, wavelength: +(0.75 + i * 0.04).toFixed(2), flux: +(1.0 + Math.sin(i * 0.3) * 0.1).toFixed(3) })),
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
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying, data]);

  const currentEpoch = data?.epochs[epochIdx] || { epoch_index: 0, date: "Старт", dx: 0, dy: 0, brightness: 1.0 };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 3D АСПАН */}
      <div className="absolute inset-0 z-0" onDoubleClick={() => handleDoubleClick("3D Карта Космоса / Звездное небо")}>
        <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
          <SkyPatchScene currentEpoch={currentEpoch} fov={fov} activeBand={activeBand} />
        </Canvas>
      </div>

      {/* ЖОҒАРҒЫ ПАНЕЛЬ: Тіл таңдау, Тақырып, 20 секундтық фактілер */}
      <header className="relative z-20 flex flex-col gap-2 p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3" onDoubleClick={() => handleDoubleClick("Логотип и Название SPHEREx")}>
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400 text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-white">{t.title}</h1>
              <p className="text-[11px] text-slate-400">{t.subtitle}</p>
            </div>
          </div>

          {/* 3 Тілді ауыстыру батырмалары */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-indigo-400 ml-1.5 mr-1" />
            {(["kk", "ru", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase transition ${
                  lang === l ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Пресеттер (Жұлдыздар тізімі новичоктар үшін) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setRa(p.ra);
                  setDec(p.dec);
                  fetchSkyData(p.ra, p.dec, fov);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-xl border transition ${
                  ra === p.ra ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Қызықты фактілер лентасы (Әр 20 секунд сайын ауысады) */}
        <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-indigo-200" onDoubleClick={() => handleDoubleClick("Интересный факт о космосе")}>
          <span className="flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            {FUN_FACTS[factIndex]}
          </span>
          <span className="text-[10px] text-indigo-400 font-mono">✦ Авто-факт (20s)</span>
        </div>
      </header>

      {/* СОЛ ЖАҚ ПАНЕЛЬ: Новичоктарға арналған түсініктемелер мен өлшемдер */}
      <aside className="absolute top-36 left-4 bottom-24 z-10 w-80 overflow-y-auto p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 space-y-4 shadow-xl" onDoubleClick={() => handleDoubleClick("Паспорт Объекта и Сравнение с Землей")}>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Паспорт объекта</span>
          <h2 className="text-sm font-bold text-white mt-0.5">{data?.object_info.name}</h2>
          <p className="text-xs text-slate-400">{data?.object_info.type}</p>
        </div>

        {/* Жермен салыстыру (Новичоктарға түсінікті етіп) */}
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
          <div className="text-[11px] font-bold text-indigo-300">{t.earthCompareSize}</div>
          <div className="text-xs text-white font-medium">{currentPreset.sizeText}</div>
        </div>

        {/* Атмосфера құрамы */}
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
          <div className="text-[11px] font-bold text-emerald-300">{t.atmosphereTrace}</div>
          <div className="text-xs text-white font-medium">{currentPreset.atmosphere}</div>
        </div>

        {/* Қозғалыс уақыты (Күндермен немесе жылдармен) */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400">{t.movementTime}</div>
          <div className="text-xs font-mono text-emerald-400 font-bold">🚀 {currentPreset.daysPassed}</div>
        </div>
      </aside>

      {/* ОҢ ЖАҚ ПАНЕЛЬ: 102-банд спектрометр түсіндірмесі */}
      <aside className="hidden lg:flex flex-col absolute top-36 right-4 bottom-24 z-10 w-80 overflow-y-auto p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 space-y-4 shadow-xl" onDoubleClick={() => handleDoubleClick("102-банд Спектрометр")}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> {t.spectrometerTip}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl">
            {t.spectrometerDesc}
          </p>
        </div>

        {/* 102 Спектр жолағының қарапайым визуализациясы */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Спектр диапазона:</span>
            <span className="font-mono text-amber-300">Банка #{activeBand} (0.75 - 5.0 μm)</span>
          </div>
          <input
            type="range"
            min="1"
            max="102"
            value={activeBand}
            onChange={(e) => setActiveBand(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="h-16 flex items-end gap-[1px] bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {data?.spectrum_102.map((pt: any) => (
              <div
                key={pt.band}
                onClick={() => setActiveBand(pt.band)}
                style={{ height: `${Math.min(100, pt.flux * 60)}%` }}
                className={`flex-1 cursor-pointer transition-all ${pt.band === activeBand ? "bg-amber-400" : "bg-indigo-500/50 hover:bg-indigo-400"}`}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ТӨМЕНГІ ПАНЕЛЬ: Time-Lapse басқару */}
      <footer className="absolute bottom-3 left-4 right-4 z-20 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 flex flex-col sm:flex-row items-center gap-4 shadow-xl" onDoubleClick={() => handleDoubleClick("Панель Времени и Анимации")}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-wider transition shadow-lg"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? t.pause : t.play}
        </button>

        <div className="flex-1 w-full">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            {data?.epochs.map((ep: any, i: number) => (
              <span
                key={ep.date}
                onClick={() => {
                  setIsPlaying(false);
                  setEpochIdx(i);
                }}
                className={`cursor-pointer ${i === epochIdx ? "text-indigo-400 font-bold" : "hover:text-slate-200"}`}
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

        {/* Дефолт ИИ көмекші батырмасы */}
        <button
          onClick={() => {
            setAiOpen(true);
            setAiQuestion("Что мне здесь делать?");
            setAiAnswer("Добро пожаловать! Вы можете нажимать на любые кнопки, менять язык вверху, исследовать жмите двойной клик на любой элемент или выбрать звездные пресеты.");
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
        >
          <Bot className="w-4 h-4" />
          <span>Спросить ИИ</span>
        </button>
      </footer>

      {/* ИИ АССИСТЕНТ МОДАЛЫ (DOUBLE CLICK КЕЗІНДЕ АШЫЛАТЫН) */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Bot className="w-5 h-5" />
                <span>{t.assistantTitle}</span>
              </div>
              <button onClick={() => setAiOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 font-mono">Сұрақ / Вопрос: <span className="text-white font-bold">{aiQuestion}</span></div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed">
                {aiAnswer}
              </div>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
            >
              Түсінікті / Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpherexPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-slate-950 text-indigo-300 flex items-center justify-center font-mono">Жүктелуде...</div>}>
      <SpherexExplorerContent />
    </Suspense>
  );
}
