"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Membership = { id: string; companyId: string; companyName: string; role: string };
type Active = { companyId: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrátor",
  accountant: "Účetní",
  driver: "Řidič",
};

export function CompanySwitcher() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [active, setActive] = useState<Active | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/memberships")
      .then((r) => r.json())
      .then((data) => {
        setMemberships(data.memberships ?? []);
        setActive(data.active ?? null);
        setIsSuperAdmin(data.isSuperAdmin ?? false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitch(membershipId: string) {
    setSwitchingId(membershipId);
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return;
      }
      // router.refresh() only re-fetches server component data — this
      // component's own `active` state was set once on mount and won't pick
      // that up on its own, so update it directly from the membership we
      // already have client-side.
      const switched = memberships.find((m) => m.id === membershipId);
      if (switched) setActive({ companyId: switched.companyId, role: switched.role });
      setOpen(false);
      router.push(data.role === "driver" ? "/driver" : "/dashboard");
      router.refresh();
    } catch {
      // swallowed — switchingId reset below regardless of outcome
    } finally {
      setSwitchingId(null);
    }
  }

  // Stays invisible for the 99% of users with exactly one membership and no
  // superadmin flag — the app looks exactly like it does today.
  if (memberships.length <= 1 && !isSuperAdmin) return null;

  const current =
    memberships.find((m) => m.companyId === active?.companyId && m.role === active?.role) ?? memberships[0];

  return (
    <div className="flex items-center gap-2">
      {isSuperAdmin && (
        <Link
          href="/superadmin"
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-signal"
        >
          ⚙ Superadmin
        </Link>
      )}

      {memberships.length > 1 && (
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-bold"
          >
            <span className="max-w-[140px] truncate">{current.companyName}</span>
            <span className="text-muted font-normal">· {ROLE_LABELS[current.role] ?? current.role}</span>
            <span className="text-muted">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 glass-panel p-2 z-50">
              {memberships.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSwitch(m.id)}
                  disabled={switchingId !== null}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm disabled:opacity-60 ${
                    m.companyId === active?.companyId && m.role === active?.role
                      ? "bg-signal/15 text-signal"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{m.companyName}</span>
                  <span className="text-xs text-muted ml-2 shrink-0">
                    {switchingId === m.id ? "…" : ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
