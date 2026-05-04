import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Entity workspace MVP
        </h1>
        <p className="mt-3 text-balance text-zinc-600 dark:text-zinc-400">
          Next.js app wired to your Supabase schema: entities, assets, documents, transactions, obligations, and
          valuations with row-level security aligned to <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">query.db</code>.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <p className="mt-8 text-left text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          After applying <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">query.db</code>, run{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">supabase-bootstrap.sql</code> so you can create
          your first entity (RPC + junction table policies). Copy <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">web/.env.local.example</code> to{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> with your project URL and anon
          key.
        </p>
      </div>
    </div>
  );
}
