"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { createSchedulingBooking, getSchedulingAvailability, SchedulingApiError } from "../api/scheduling-api";
import { addDays, bogotaDate, schedulingPolicy } from "../config/scheduling";
import type { AvailabilityResult, BookingResult, SchedulingMode } from "../types/contracts";
import styles from "./scheduling-calendar.module.css";
import { ADVISOR_CODES } from "../../submission/advisor-codes";

export interface SchedulingContext { submissionId?: string; advisorCode: string; mode: SchedulingMode }
export interface SchedulingSelection { date: string; slot: string }
interface Props {
  context: SchedulingContext;
  selection: SchedulingSelection;
  onSelectionChange: Dispatch<SetStateAction<SchedulingSelection>>;
  onRegisterProject: () => Promise<string | undefined>;
  onAdvisorChange: (code: string) => void;
  advisorLocked: boolean;
  projectError: string;
  onBack?: () => void;
  onSkip: () => void | Promise<void>;
}
const dateLabel = (date: string) => new Intl.DateTimeFormat("es-CO", {
  timeZone: schedulingPolicy.timezone, day: "numeric", month: "long", year: "numeric",
}).format(new Date(`${date}T12:00:00-05:00`));
const timeLabel = (instant: string) => new Intl.DateTimeFormat("es-CO", {
  timeZone: schedulingPolicy.timezone, hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(instant));

export function SchedulingCalendar({ context, selection, onSelectionChange, onRegisterProject,
  onAdvisorChange, advisorLocked, projectError, onBack, onSkip }: Props) {
  const [today] = useState(() => bogotaDate(new Date()));
  const through = addDays(today, schedulingPolicy.maximumBookingDays);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [availability, setAvailability] = useState<AvailabilityResult>();
  const [status, setStatus] = useState<"LOADING" | "READY" | "EMPTY" | "ERROR">("LOADING");
  const [revision, setRevision] = useState(0);
  const { date: selectedDate, slot: selectedSlot } = selection;
  const [booking, setBooking] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [bookingUncertain, setBookingUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState<BookingResult>();
  const pending = useRef(false);
  const requestId = useRef<string | null>(null);
  const finalTitle = useRef<HTMLHeadingElement>(null);
  const { mode, advisorCode, submissionId } = context;
  const advisorSelected = Object.values(ADVISOR_CODES).some(code => code === advisorCode && code !== "DIRECT_CONTACT");
  const advisorName = Object.entries(ADVISOR_CODES).find(([, code]) => code === advisorCode)?.[0];
  useEffect(() => {
    if (!advisorSelected) return;
    const controller = new AbortController();
    getSchedulingAvailability({ mode, advisorCode, from: today, to: through }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setAvailability(result);
        setStatus(result.dates.some(day => day.slots.length) ? "READY" : "EMPTY");
        onSelectionChange(previous => {
          const day = result.dates.find(day => day.date === previous.date && day.slots.length);
          return { date: day ? previous.date : "", slot: day?.slots.some(slot => slot.startsAt === previous.slot) ? previous.slot : "" };
        });
      }).catch(error => {
        if (controller.signal.aborted) return;
        setStatus("ERROR");
        setMessage(error instanceof SchedulingApiError && error.status === 503
          ? "La agenda aún no está habilitada. Puedes enviar tu proyecto y agendar más tarde."
          : "No fue posible consultar disponibilidad. Inténtalo nuevamente.");
      });
    return () => controller.abort();
  }, [mode, advisorCode, advisorSelected, today, through, revision, onSelectionChange]);
  useEffect(() => { if (confirmed) finalTitle.current?.focus(); }, [confirmed]);

  function reload() {
    setStatus("LOADING"); onSelectionChange(previous => ({ ...previous, slot: "" })); requestId.current = null;
    setRevision(previous => previous + 1);
  }
  function chooseDate(date: string) {
    onSelectionChange({ date, slot: "" }); requestId.current = null; setMessage("");
  }
  async function confirm() {
    if (pending.current || !advisorSelected || !selectedSlot || status !== "READY") return;
    pending.current = true; setBooking(true); setMessage("");
    try {
      setRegistering(!submissionId);
      const receivedId = submissionId ?? await onRegisterProject();
      setRegistering(false);
      if (!receivedId) {
        setMessage("No se pudo completar el envío. Tu selección sigue aquí. Reintenta sin volver a realizar Experience.");
        return;
      }
      requestId.current ??= crypto.randomUUID();
      const result = await createSchedulingBooking({ submissionId: receivedId, advisorCode, mode, startsAt: selectedSlot, bookingRequestId: requestId.current });
      setConfirmed(result);
      setBookingUncertain(false);
    } catch (error) {
      if (error instanceof SchedulingApiError && error.status === 409) {
        setBookingUncertain(false);
        setMessage("Ese horario acaba de dejar de estar disponible. Elige otro horario.");
        reload();
      } else {
        setBookingUncertain(true);
        setMessage("Proyecto recibido, agendamiento pendiente de verificar. Reintenta la misma solicitud para evitar duplicados.");
      }
    } finally { pending.current = false; setBooking(false); setRegistering(false); }
  }
  async function skip() {
    if (pending.current) return;
    pending.current = true; setBooking(true); setRegistering(!submissionId);
    try { await onSkip(); }
    finally { pending.current = false; setBooking(false); setRegistering(false); }
  }
  const virtual = mode === "VIRTUAL";
  const modeLabel = virtual ? "Reunión virtual" : "Visita presencial · Centro de Experiencia S&G";
  const first = new Date(`${month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const monthOffset = (delta: number) => new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1)).toISOString().slice(0, 7);
  const slots = availability?.dates.find(day => day.date === selectedDate)?.slots ?? [];
  return <section className={styles.scheduler} aria-labelledby="scheduling-title">
    {availability?.mock && !confirmed && <p className={styles.notice}>Agenda de prueba: las reservas son simuladas y no crean una cita real.</p>}
    {confirmed ? <div aria-live="polite" className={styles.confirmed}>
      <p className={styles.eyebrow}>CITA CONFIRMADA · SIMULACIÓN</p>
      <h2 id="scheduling-title" tabIndex={-1} ref={finalTitle}>{virtual ? "Tu reunión virtual está agendada." : "Nos vemos en el Centro de Experiencia."}</h2>
      <dl className={styles.appointment}>
        <div><dt>Fecha</dt><dd>{dateLabel(confirmed.startsAt.slice(0, 10))}</dd></div>
        <div><dt>Hora de Colombia</dt><dd>{timeLabel(confirmed.startsAt)}–{timeLabel(confirmed.endsAt)}</dd></div>
        <div><dt>Modalidad</dt><dd>{modeLabel}</dd></div>
      </dl>
      <p className={styles.notice}><strong>Confirmación simulada.</strong> No se ha creado una cita real.{virtual && " Esta prueba no genera un enlace de conexión."}</p>
      <Link className={styles.homeLink} href="/">Volver al inicio <span aria-hidden="true">↗</span></Link>
    </div> : <>
      <h2 id="scheduling-title">{virtual ? "Agenda tu reunión virtual" : "Agenda tu visita al Centro de Experiencia"}</h2>
      {!submissionId && <p className={styles.help}>Selecciona tu asesoría y horario. Al confirmar enviaremos el proyecto; solo después solicitaremos la cita. Elegir un horario no lo reserva.</p>}
      <p>Elige el día y la hora que mejor te funcionen para continuar {virtual ? "con nuestro equipo de forma virtual." : "la experiencia con nuestro equipo."}</p>
      <p className={styles.help}>Hora de Colombia · {schedulingPolicy.timezone}</p>
      <label className={styles.advisor}>Asesora / asesor comercial
        <select value={advisorSelected ? advisorCode : ""} disabled={booking || advisorLocked || Boolean(submissionId)} onChange={event => {
          onAdvisorChange(event.target.value); onSelectionChange({ date: "", slot: "" });
          setStatus("LOADING"); setMessage(""); requestId.current = null;
        }}>
          <option value="" disabled>Selecciona una persona del equipo</option>
          {Object.entries(ADVISOR_CODES).filter(([, code]) => code !== "DIRECT_CONTACT").map(([name, code]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      {advisorLocked && !submissionId && <p className={styles.help}>Para cambiar de asesoría tras un intento de envío, vuelve a revisar la información.</p>}
      <div role="status" aria-live="polite">{registering ? "Enviando proyecto…" : booking ? "Solicitando cita…" : !advisorSelected ? "Selecciona una persona para consultar disponibilidad." : status === "LOADING" ? "Cargando disponibilidad…" : status === "EMPTY" ? "No hay horarios disponibles en este rango." : ""}</div>
      {projectError && !submissionId && <p role="alert">{projectError}</p>}
      {message && <p role="alert">{message}</p>}
      {status === "ERROR" && <button type="button" onClick={() => { setMessage(""); reload(); }}>Reintentar disponibilidad</button>}
      {advisorSelected && (status === "READY" || status === "EMPTY") && <>
        <div className={styles.month}>
          <button type="button" aria-label="Mes anterior" disabled={booking || month <= today.slice(0, 7)} onClick={() => setMonth(monthOffset(-1))}>←</button>
          <h3 aria-live="polite">{new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}</h3>
          <button type="button" aria-label="Mes siguiente" disabled={booking || month >= through.slice(0, 7)} onClick={() => setMonth(monthOffset(1))}>→</button>
        </div>
        <div className={styles.days} aria-label="Selecciona una fecha">
          {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => <span key={index} aria-hidden="true">{day}</span>)}
          {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
          {Array.from({ length: count }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            const available = availability?.dates.some(day => day.date === date && day.slots.length);
            return <button type="button" key={date} aria-label={dateLabel(date)} aria-pressed={date === selectedDate}
              disabled={booking || bookingUncertain || !available} onClick={() => chooseDate(date)}>{i + 1}</button>;
          })}
        </div>
        {selectedDate && <div className={styles.hours}>
          <h3>Horarios disponibles · {dateLabel(selectedDate)}</h3>
          <div className={styles.slots}>{slots.map(slot => <button type="button" key={slot.startsAt} disabled={booking || bookingUncertain}
            aria-pressed={selectedSlot === slot.startsAt} onClick={() => { onSelectionChange(previous => ({ ...previous, slot: slot.startsAt })); requestId.current = null; setMessage(""); }}>
            {timeLabel(slot.startsAt)}
          </button>)}</div>
        </div>}
        {selectedSlot && <p className={styles.summary}>{modeLabel}<br />{advisorName}<br />{dateLabel(selectedDate)} · {timeLabel(selectedSlot)} (Colombia)</p>}
        <button type="button" className={styles.confirm} disabled={booking || !selectedSlot || status !== "READY"} onClick={confirm}>
          {registering ? "Enviando proyecto…" : booking ? "Solicitando cita…" : submissionId ? "Reintentar agendamiento" : "Confirmar proyecto y solicitar reunión"}
        </button>
        <span role="status" className="sr-only">{booking ? "Confirmando cita" : ""}</span>
      </>}
      <button type="button" className={styles.skip} disabled={booking} onClick={skip}>{submissionId ? "Agendar más tarde" : "Enviar proyecto y agendar más tarde"}</button>
      {onBack && <button type="button" className={styles.skip} disabled={booking} onClick={onBack}>Volver a revisar información</button>}
    </>}
  </section>;
}
