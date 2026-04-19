"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Paciente = { id: number; nombre: string; apellido: string };

export default function PatientCombobox({
  pacientes,
  value,
  onChange,
  placeholder = "Buscar paciente…",
  className = "",
}: {
  pacientes: Paciente[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = pacientes.find((p) => p.id === value) ?? null;

  function normalize(s: string) {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const filtered =
    query.trim() === ""
      ? pacientes.slice(0, 10)
      : pacientes
          .filter((p) => {
            const q = normalize(query);
            return (
              normalize(p.apellido).includes(q) ||
              normalize(p.nombre).includes(q)
            );
          })
          .slice(0, 10);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(p: Paciente) {
    onChange(p.id);
    setOpen(false);
    setQuery("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  }

  const displayValue =
    !open && selected
      ? `${selected.apellido}, ${selected.nombre}`
      : query;

  return (
    <div ref={containerRef} className={"relative " + className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="input pl-9 pr-8"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (selected) setQuery("");
          }}
          autoComplete="off"
        />
        {(selected || query) && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-ink-200 rounded-xl shadow-pop overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-400 text-center">
              Sin resultados
            </li>
          ) : (
            filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={
                    "w-full text-left px-3 py-2 text-sm transition " +
                    (p.id === value
                      ? "bg-brand-50 text-brand-800 font-medium"
                      : "hover:bg-ink-50 text-ink-800")
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(p)}
                >
                  <span className="font-medium">{p.apellido}</span>
                  {", "}
                  {p.nombre}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
