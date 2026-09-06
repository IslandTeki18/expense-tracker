"use client";

import { useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { PEOPLE, PERSON_IDS } from "@/lib/display";
import type { Person } from "@/lib/types";

/* ----------------------------- Segmented ----------------------------- */
export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  full,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <div className="gt-seg" role="tablist" data-full={full ? "1" : "0"}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className="gt-seg-btn"
          data-active={o.value === value ? "1" : "0"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Chip ----------------------------- */
export function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="gt-chip" data-active={active ? "1" : "0"} onClick={onClick}>
      {color && <span className="gt-chip-dot" style={{ background: color }} />}
      {children}
    </button>
  );
}

/* ----------------------------- Badge ----------------------------- */
export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="gt-badge"
      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}
    >
      <span className="gt-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {children}
    </span>
  );
}

/* ----------------------------- People ----------------------------- */
export function PersonChip({ id }: { id: Person | null }) {
  if (!id) return <span style={{ color: "var(--fg-subtle)" }}>&mdash;</span>;
  const p = PEOPLE[id];
  return (
    <span className="gt-person" style={{ "--p": p.accent } as React.CSSProperties}>
      <span className="gt-person-dot" />
      {p.name}
    </span>
  );
}

/** Full-width two-way person picker used inside forms. */
export function PersonPick({ value, onChange }: { value: Person; onChange: (p: Person) => void }) {
  return (
    <div className="gt-seg" data-full="1">
      {PERSON_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className="gt-seg-btn"
          data-active={value === id ? "1" : "0"}
          onClick={() => onChange(id)}
        >
          <span
            className="gt-person-dot"
            style={{ background: value === id ? "var(--accent-fg)" : PEOPLE[id].accent, boxShadow: "none" }}
          />
          {PEOPLE[id].name}
        </button>
      ))}
    </div>
  );
}

/** Compact "acting as" switcher shown in app bars. */
export function ActorSwitch({ value, onChange }: { value: Person; onChange: (p: Person) => void }) {
  return (
    <div className="gt-acting-seg" aria-label="Acting as">
      {PERSON_IDS.map((id) => (
        <button
          key={id}
          type="button"
          data-on={value === id ? "1" : "0"}
          style={{ "--p": PEOPLE[id].accent } as React.CSSProperties}
          onClick={() => onChange(id)}
          title={PEOPLE[id].name}
        >
          <span
            className="gt-person-dot"
            style={{ background: value === id ? "var(--accent-fg)" : PEOPLE[id].accent }}
          />
          {PEOPLE[id].initials}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Field ----------------------------- */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string | null;
  children?: ReactNode;
}

export function Field({ label, icon, hint, error, children, ...input }: FieldProps) {
  return (
    <label className="gt-field-wrap">
      <span className="eyebrow" style={{ marginBottom: 6, display: "block" }}>
        {label}
      </span>
      <span className="gt-field-box" data-error={error ? "1" : "0"}>
        {icon && <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>}
        {children ?? <input className="gt-field-input" {...input} />}
      </span>
      {error && <span className="gt-field-err">{error}</span>}
      {hint && !error && <span className="gt-field-hint">{hint}</span>}
    </label>
  );
}

/* ----------------------------- Modal (sheet on mobile) ----------------------------- */
export function Modal({
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  // On mobile the on-screen keyboard shrinks the visual viewport but not the
  // layout viewport, so a `position: fixed` sheet ends up hidden behind it.
  // Track the visual viewport and pin the overlay to it instead.
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setViewport({ height: vv.height, top: vv.offsetTop });
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  // Keep the focused control visible once the sheet has been resized.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.scrollIntoView) return;
      requestAnimationFrame(() => target.scrollIntoView({ block: "nearest" }));
    };
    body.addEventListener("focusin", onFocusIn);
    return () => body.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <div
      className="gt-overlay"
      onClick={onClose}
      style={viewport ? { height: viewport.height, top: viewport.top, bottom: "auto" } : undefined}
    >
      <div className="gt-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="gt-modal-head">
          <div>
            {eyebrow && (
              <div className="eyebrow" style={{ color: "var(--accent)" }}>
                {eyebrow}
              </div>
            )}
            <h3 className="gt-modal-title">{title}</h3>
          </div>
          <button type="button" className="m-icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="gt-modal-body" ref={bodyRef}>
          {children}
        </div>
        {footer && <div className="gt-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- ConfirmDialog ----------------------------- */
export function ConfirmDialog({
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "DELETE",
  busy,
  error,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
}) {
  return (
    <Modal
      onClose={onClose}
      title={title}
      eyebrow="CONFIRM"
      footer={
        <>
          <button type="button" className="gt-btn gt-btn-ghost" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button type="button" className="gt-btn gt-btn-danger" onClick={onConfirm} disabled={busy}>
            <Trash2 size={15} />
            {busy ? "WORKING…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--fg-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{body}</p>
      {error && (
        <div className="gt-error-box" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}

/* ----------------------------- ColorPicker ----------------------------- */
export const SWATCHES = [
  "#0090FF", "#5EB1EF", "#38BDF8", "#22C55E", "#34D399", "#65A30D", "#ADFA1D",
  "#F59E0B", "#FB923C", "#F87171", "#E11D48", "#A78BFA", "#737373",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="gt-swatches">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          className="gt-swatch"
          data-on={c.toLowerCase() === value.toLowerCase() ? "1" : "0"}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
          aria-label={c}
        >
          {c.toLowerCase() === value.toLowerCase() && <Check size={13} color="#0A0A0A" />}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Empty ----------------------------- */
export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="m-empty">
      <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
