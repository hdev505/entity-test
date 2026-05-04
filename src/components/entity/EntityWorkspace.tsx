"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Asset,
  DocumentRow,
  Entity,
  EntityRole,
  Obligation,
  ObligationType,
  RecordStatus,
  SecurityLevel,
  TransactionRow,
  Valuation,
} from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Tab =
  | "overview"
  | "assets"
  | "documents"
  | "transactions"
  | "obligations"
  | "valuations";

const recordStatuses: RecordStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "active",
  "archived",
];

const securityLevels: SecurityLevel[] = ["standard", "confidential", "restricted"];

type Props = {
  entity: Entity;
  role: EntityRole;
  assets: Asset[];
  documents: DocumentRow[];
  transactions: TransactionRow[];
  obligations: Obligation[];
  obligationTypes: ObligationType[];
  valuations: Valuation[];
};

export function EntityWorkspace({
  entity,
  role,
  assets,
  documents,
  transactions,
  obligations,
  obligationTypes,
  valuations,
}: Props) {
  const router = useRouter();
  const canWrite = role === "admin" || role === "advisor";
  const canAdminDelete = role === "admin";
  const [tab, setTab] = useState<Tab>("overview");

  const supabase = useMemo(() => createClient(), []);

  function refreshFromServer() {
    router.refresh();
  }

  async function addAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const type = String(fd.get("type") ?? "").trim();
    if (!type) return;
    const { error } = await supabase
      .from("assets")
      .insert({ entity_id: entity.id, type, metadata: {} })
      .select()
      .single();
    if (!error) {
      form.reset();
      router.refresh();
    }
  }

  async function removeAsset(id: number) {
    if (!canAdminDelete) return;
    const { error } = await supabase.from("assets").delete().eq("id", id).eq("entity_id", entity.id);
    if (!error) router.refresh();
  }

  async function addDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const docType = String(fd.get("doc_type") ?? "").trim();
    const filePathManual = String(fd.get("file_path") ?? "").trim();
    const security = (fd.get("security_level") as SecurityLevel) || "standard";
    const file = fd.get("file") as File | null;

    let file_path = filePathManual;
    let file_name: string | null = null;
    let mime_type: string | null = null;
    let size_bytes: number | null = null;

    if (file && file.size > 0) {
      const objectPath = `${entity.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(objectPath, file, {
        upsert: false,
      });
      if (upErr) {
        alert(upErr.message);
        return;
      }
      file_path = objectPath;
      file_name = file.name;
      mime_type = file.type || null;
      size_bytes = file.size;
    }

    if (!file_path || !docType) {
      alert("Provide a document type and either a file or a storage file_path.");
      return;
    }

    const { error } = await supabase
      .from("documents")
      .insert({
        entity_id: entity.id,
        type: docType,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        security_level: security,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    form.reset();
    router.refresh();
  }

  async function removeDocument(id: number) {
    if (!canAdminDelete) return;
    const { error } = await supabase.from("documents").delete().eq("id", id).eq("entity_id", entity.id);
    if (!error) router.refresh();
  }

  async function addTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const amount = Number(fd.get("amount"));
    const type = String(fd.get("tx_type") ?? "").trim();
    const currency = String(fd.get("currency") ?? "USD").trim() || "USD";
    const status = (fd.get("status") as RecordStatus) || "pending";
    if (!type || Number.isNaN(amount)) return;
    const { error } = await supabase
      .from("transactions")
      .insert({
        entity_id: entity.id,
        amount,
        currency,
        type,
        status,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    form.reset();
    router.refresh();
  }

  async function removeTransaction(id: number) {
    if (!canAdminDelete) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("entity_id", entity.id);
    if (!error) router.refresh();
  }

  async function addObligation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const typeLabel = String(fd.get("obl_type") ?? "").trim();
    const due = String(fd.get("due_date") ?? "").trim() || null;
    const amountRaw = fd.get("amount");
    const amount =
      amountRaw != null && String(amountRaw).trim() !== ""
        ? Number(amountRaw)
        : null;
    const currency = String(fd.get("currency") ?? "USD").trim() || "USD";
    const status = (fd.get("status") as RecordStatus) || "pending";
    const otIdRaw = fd.get("obligation_type_id");
    const obligation_type_id =
      otIdRaw && String(otIdRaw) !== "" ? Number(otIdRaw) : null;

    const { error } = await supabase
      .from("obligations")
      .insert({
        entity_id: entity.id,
        type: typeLabel || null,
        due_date: due,
        amount,
        currency,
        status,
        obligation_type_id,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    form.reset();
    router.refresh();
  }

  async function removeObligation(id: number) {
    if (!canAdminDelete) return;
    const { error } = await supabase.from("obligations").delete().eq("id", id).eq("entity_id", entity.id);
    if (!error) router.refresh();
  }

  async function addValuation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const asset_id = Number(fd.get("asset_id"));
    const valued_at = String(fd.get("valued_at") ?? "").trim();
    const value = Number(fd.get("value"));
    const currency = String(fd.get("currency") ?? "USD").trim() || "USD";
    const source = String(fd.get("source") ?? "").trim() || null;
    if (!valued_at || Number.isNaN(value) || Number.isNaN(asset_id)) return;
    const { error } = await supabase
      .from("valuations")
      .insert({
        entity_id: entity.id,
        asset_id,
        valued_at,
        value,
        currency,
        source,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    form.reset();
    router.refresh();
  }

  async function removeValuation(id: number) {
    if (!canWrite) return;
    const { error } = await supabase.from("valuations").delete().eq("id", id).eq("entity_id", entity.id);
    if (!error) router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "assets", label: "Assets" },
    { id: "documents", label: "Documents" },
    { id: "transactions", label: "Transactions" },
    { id: "obligations", label: "Obligations" },
    { id: "valuations", label: "Valuations" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← Entities
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {entity.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {entity.type} · your role: <span className="font-medium text-zinc-700 dark:text-zinc-300">{role}</span>
            {!canWrite ? " (read-only)" : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshFromServer()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
        >
          Reload data
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            This workspace maps to your Supabase schema: entities, assets, documents (optional Storage upload
            into bucket <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">documents</code>), transactions,
            obligations, and valuations. Advisors and admins can create and update most records; only admins can
            delete assets, documents, transactions, obligations, and valuations.
          </p>
        </div>
      ) : null}

      {tab === "assets" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form onSubmit={addAsset} className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type
                <input
                  name="type"
                  required
                  placeholder="e.g. account, property"
                  className="mt-1 block w-56 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                Add asset
              </button>
            </form>
          ) : null}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {assets.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No assets yet.</li>
            ) : (
              assets.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 p-4 text-sm">
                  <span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.type}</span>
                    <span className="text-zinc-500"> · id {a.id}</span>
                  </span>
                  {canAdminDelete ? (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removeAsset(a.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "documents" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form
              onSubmit={addDocument}
              className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Document type
                <input
                  name="doc_type"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Security level
                <select
                  name="security_level"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                >
                  {securityLevels.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
                File (uploads to Storage path{" "}
                <code className="text-xs">{`{entityId}/…`}</code>)
                <input name="file" type="file" className="mt-1 block w-full text-sm" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
                Or file_path (if you already uploaded manually)
                <input
                  name="file_path"
                  placeholder={`${entity.id}/…/file.pdf`}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                  Add document
                </button>
              </div>
            </form>
          ) : null}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {documents.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No documents.</li>
            ) : (
              documents.map((d) => (
                <li key={d.id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{d.type}</span>
                    <span className="text-zinc-500"> · {d.file_path}</span>
                    <div className="text-xs text-zinc-500">
                      {d.status} · {d.security_level}
                      {d.file_name ? ` · ${d.file_name}` : ""}
                    </div>
                  </div>
                  {canAdminDelete ? (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removeDocument(d.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "transactions" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form
              onSubmit={addTransaction}
              className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800"
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Amount
                <input
                  name="amount"
                  type="number"
                  step="any"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Currency
                <input name="currency" defaultValue="USD" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type
                <input name="tx_type" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Status
                <select name="status" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950">
                  {recordStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lg:col-span-4">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                  Add transaction
                </button>
              </div>
            </form>
          ) : null}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {transactions.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No transactions.</li>
            ) : (
              transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 p-4 text-sm">
                  <span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.type}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {" "}
                      · {t.amount} {t.currency} · {t.status}
                    </span>
                  </span>
                  {canAdminDelete ? (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removeTransaction(t.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "obligations" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form
              onSubmit={addObligation}
              className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800"
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Obligation type (catalog)
                <select name="obligation_type_id" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950">
                  <option value="">— none —</option>
                  {obligationTypes.map((ot) => (
                    <option key={ot.id} value={ot.id}>
                      {ot.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type label
                <input name="obl_type" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Due date
                <input name="due_date" type="date" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Amount
                <input name="amount" type="number" step="any" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Currency
                <input name="currency" defaultValue="USD" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Status
                <select name="status" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950">
                  {recordStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lg:col-span-3">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                  Add obligation
                </button>
              </div>
            </form>
          ) : null}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {obligations.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No obligations.</li>
            ) : (
              obligations.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 p-4 text-sm">
                  <span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{o.type ?? "—"}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {" "}
                      · {o.amount != null ? `${o.amount} ${o.currency}` : "—"} · {o.status}
                      {o.due_date ? ` · due ${o.due_date}` : ""}
                    </span>
                  </span>
                  {canAdminDelete ? (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removeObligation(o.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {tab === "valuations" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form
              onSubmit={addValuation}
              className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800"
            >
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Asset id
                <select name="asset_id" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950">
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Valued at
                <input name="valued_at" type="date" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Value
                <input name="value" type="number" step="any" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Currency
                <input name="currency" defaultValue="USD" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Source
                <input name="source" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
              </label>
              <div className="lg:col-span-5">
                <button
                  type="submit"
                  disabled={assets.length === 0}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Add valuation
                </button>
              </div>
            </form>
          ) : null}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {valuations.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No valuations.</li>
            ) : (
              valuations.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 p-4 text-sm">
                  <span>
                    asset {v.asset_id} · {v.valued_at} ·{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {v.value} {v.currency}
                    </span>
                    {v.source ? <span className="text-zinc-500"> · {v.source}</span> : null}
                  </span>
                  {canWrite ? (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removeValuation(v.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
