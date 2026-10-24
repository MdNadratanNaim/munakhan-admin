import type { ReactNode } from "react";

/** "Projects (the groups … shown under)" → a short title with the explanation underneath it. */
function splitLabel(label: string): { title: string; hint?: string } {
  const match = label.match(/^(.*?)\s\((.{24,})\)$/);
  return match ? { title: match[1] ?? label, hint: match[2] } : { title: label };
}

export function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  const { title, hint } = splitLabel(label);
  return (
    <div className="field-shell">
      <div className="field-label">
        {title}
        {hint && <span className="field-hint">{hint.charAt(0).toUpperCase() + hint.slice(1)}</span>}
      </div>
      {children}
    </div>
  );
}
