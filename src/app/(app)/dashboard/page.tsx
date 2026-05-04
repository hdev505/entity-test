import { CreateEntityForm } from "@/components/dashboard/CreateEntityForm";
import { createClient } from "@/lib/supabase/server";
import type { Entity } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("name, email").eq("id", user.id).single();

  const { data: rows } = await supabase
    .from("user_entity")
    .select("role, entities(id, name, type, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const memberships =
    rows?.map((r) => {
      const e = r.entities as unknown as Entity | null;
      return e ? { role: r.role as string, entity: e } : null;
    }) ?? [];
  const list = memberships.filter(Boolean) as { role: string; entity: Entity }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as {profile?.email ?? user.email}
          {profile?.name ? ` · ${profile.name}` : ""}
        </p>
      </div>

      <CreateEntityForm />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your entities
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {list.length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">No entities yet. Create one above.</li>
          ) : (
            list.map(({ entity, role }) => (
              <li key={entity.id}>
                <Link
                  href={`/dashboard/entities/${entity.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{entity.name}</span>
                  <span className="text-sm text-zinc-500">
                    {entity.type} · {role}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
