import type { CSSProperties } from "react";
import type { AnswerValue, Question } from "@/features/experience/types/question";

interface DockScaleProps {
  question: Extract<Question, { type: "scale" }>;
  value: AnswerValue | undefined;
  onChange: (value: number) => void;
  refinedScale?: boolean;
}

export function DockScale({ question, value, onChange, refinedScale = false }: DockScaleProps) {
  const id = `question-${question.id}`;
  const answered = typeof value === "number";
  const position = answered ? value : Math.round((question.min + question.max) / 2);
  const progress = answered ? (position - question.min) / (question.max - question.min || 1) * 100 : 0;
  return <div data-scale-control className={refinedScale ? "max-w-md space-y-0.5" : "max-w-md space-y-1.5"}>
    <label htmlFor={id} className={refinedScale ? "mb-1.5 block text-[11px] font-medium leading-snug" : "block text-sm font-medium"}>{question.text}{question.required && <><span aria-hidden="true"> *</span><span className="sr-only"> (obligatorio)</span></>}</label>
    {question.description && <p id={`${id}-description`} className="text-[11px] leading-snug text-stone-300/85">{question.description}</p>}
    <div className={refinedScale ? "flex justify-between gap-4 text-[10px] leading-tight text-stone-300/80" : "flex justify-between gap-4 text-[11px] text-stone-300/85"}>
      <span>{question.minLabel}</span><span className="text-right">{question.maxLabel}</span>
    </div>
    <input id={id} type="range" min={question.min} max={question.max} step={1} value={position}
      aria-valuetext={answered ? String(value) : "Sin respuesta"}
      aria-describedby={`${id}-status${question.description ? ` ${id}-description` : ""}`}
      style={{ "--scale-progress": `${progress}%` } as CSSProperties}
      className={refinedScale ? "h-11 w-full cursor-pointer appearance-none rounded-sm bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#e7e5e4_var(--scale-progress),#78716c_var(--scale-progress))] [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-stone-300 [&::-webkit-slider-thumb]:bg-stone-100 hover:[&::-webkit-slider-thumb]:bg-white [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-stone-500 [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:bg-stone-200 [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-stone-300 [&::-moz-range-thumb]:bg-stone-100" : "h-11 w-full cursor-pointer appearance-none rounded-sm bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#e7e5e4_var(--scale-progress),#78716c_var(--scale-progress))] [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-300 [&::-webkit-slider-thumb]:bg-stone-100 hover:[&::-webkit-slider-thumb]:bg-white [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-stone-500 [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:bg-stone-200 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-stone-300 [&::-moz-range-thumb]:bg-stone-100"}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
      onPointerUp={(event) => onChange(Number(event.currentTarget.value))}
      onKeyUp={(event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown", "Enter", " "].includes(event.key)) onChange(Number(event.currentTarget.value));
      }} />
    <div aria-hidden="true" className={refinedScale ? "flex justify-between px-2 text-[10px] text-stone-300/80" : "flex justify-between px-2 text-xs text-stone-300"}>
      {Array.from({ length: question.max - question.min + 1 }, (_, index) => question.min + index).map((number) => <span key={number} className="flex flex-col items-center gap-1"><span className="h-1 w-px bg-stone-400" />{number}</span>)}
    </div>
    <p id={`${id}-status`} className={refinedScale ? "pt-1 text-[10px] leading-tight text-stone-300/80" : "text-[11px] text-stone-300"}>{answered ? `Valor seleccionado: ${value}` : "Sin respuesta. Selecciona un valor."}</p>
  </div>;
}
