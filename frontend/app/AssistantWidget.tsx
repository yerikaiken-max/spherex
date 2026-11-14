"use client";
import { useState } from "react";
import { Bot, X, Send } from "lucide-react";

export default function AssistantWidget({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hi! I'm the Sky Assistant, an AI helper. Ask me anything about what you see here." },
  ]);
  const [busy, setBusy] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const send = async () => {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const res = await fetch(`${api}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMsgs((m) => [...m, { role: "bot", text: json.answer }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "The assistant is offline right now. Please try again later." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-28 right-6 z-40">
      {open && (
        <div className="mb-3 w-80 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <div>
              <div className="text-sm font-semibold text-white">Sky Assistant</div>
              <div className="text-[10px] text-slate-400">AI helper · may make mistakes</div>
            </div>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`text-xs p-2 rounded-lg ${m.role === "bot" ? "bg-slate-900 text-slate-200" : "bg-indigo-600/30 text-white ml-8"}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500">Thinking...</div>}
          </div>
          <div className="flex gap-2 p-2 border-t border-slate-800">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question..."
              className="flex-1 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none" />
            <button onClick={send} className="px-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-xl text-xs font-semibold">
        <Bot className="w-4 h-4" /> Ask the assistant
      </button>
    </div>
  );
}
