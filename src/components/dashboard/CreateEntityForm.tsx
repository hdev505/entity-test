"use client";

import { createClient } from "@/lib/supabase/client";
import type { EntityType } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

const types: EntityType[] = ["client", "group", "company", "trust", "other"];

export function CreateEntityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "create_entity_with_me_as_admin",
      { p_name: name.trim(), p_type: type },
    );
    setLoading(false);
    if (rpcError) {
      setError(
        rpcError.message.includes("function") || rpcError.code === "42883"
          ? "Run supabase-bootstrap.sql in the Supabase SQL editor (RPC missing)."
          : rpcError.message,
      );
      return;
    }
    const id = data as number | null;
    if (id != null) {
      router.push(`/dashboard/entities/${id}`);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        New entity
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        Creates a row in entities and assigns you as admin via RPC (required by RLS).
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="block w-full text-sm font-medium text-zinc-700 sm:w-40 dark:text-zinc-300">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EntityType)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-10 shrink-0 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 sm:mb-0.5"
        >
          {loading ? "…" : "Create"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
