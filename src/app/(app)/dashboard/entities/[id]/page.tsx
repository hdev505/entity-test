import { EntityWorkspace } from "@/components/entity/EntityWorkspace";
import { createClient } from "@/lib/supabase/server";
import type {
  Asset,
  DocumentRow,
  Entity,
  EntityRole,
  Obligation,
  ObligationType,
  TransactionRow,
  Valuation,
} from "@/types/database";
import { notFound, redirect } from "next/navigation";

export default async function EntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entityId = Number(id);
  if (!Number.isFinite(entityId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entity, error: entErr } = await supabase.from("entities").select("*").eq("id", entityId).single();
  if (entErr || !entity) notFound();

  const { data: membership } = await supabase
    .from("user_entity")
    .select("role")
    .eq("entity_id", entityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const role = membership.role as EntityRole;

  const [a, d, t, o, ot, v] = await Promise.all([
    supabase.from("assets").select("*").eq("entity_id", entityId).order("id", { ascending: false }),
    supabase.from("documents").select("*").eq("entity_id", entityId).order("id", { ascending: false }),
    supabase.from("transactions").select("*").eq("entity_id", entityId).order("id", { ascending: false }),
    supabase.from("obligations").select("*").eq("entity_id", entityId).order("id", { ascending: false }),
    supabase.from("obligation_types").select("*").eq("is_active", true).order("label"),
    supabase.from("valuations").select("*").eq("entity_id", entityId).order("valued_at", { ascending: false }),
  ]);

  return (
    <EntityWorkspace
      entity={entity as Entity}
      role={role}
      assets={(a.data ?? []) as Asset[]}
      documents={(d.data ?? []) as DocumentRow[]}
      transactions={(t.data ?? []) as TransactionRow[]}
      obligations={(o.data ?? []) as Obligation[]}
      obligationTypes={(ot.data ?? []) as ObligationType[]}
      valuations={(v.data ?? []) as Valuation[]}
    />
  );
}
