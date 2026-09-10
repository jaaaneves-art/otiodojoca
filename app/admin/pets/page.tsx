import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moderatePetReportForm } from "@/app/mundo-dos-patudos/actions";

type ReportRow = {
  id: number; reason: string; details: string | null; created_at: string; post_id: string;
  post: { title: string; status: string } | null;
  reporter: { username: string } | null;
};

export default async function AdminPetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/");
  const { data } = await supabase.from("pet_reports").select("id,reason,details,created_at,post_id,post:pet_posts(title,status),reporter:profiles(username)").eq("status", "pending").order("created_at");
  const reports = (data ?? []) as unknown as ReportRow[];
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-slate-500">Administração</p><h1 className="text-3xl font-bold">Denúncias — Mundo dos Patudos</h1></div><Link href="/mundo-dos-patudos" className="underline">Ver comunidade</Link></div>
    {!reports.length ? <p className="mt-8 rounded-xl border bg-white p-8 text-center">Não há denúncias pendentes.</p> : <div className="mt-8 space-y-4">{reports.map((report) => {
      const review = moderatePetReportForm.bind(null, report.id, "reviewed" as const, true);
      const dismiss = moderatePetReportForm.bind(null, report.id, "dismissed" as const, false);
      return <article key={report.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase text-red-700">{report.reason}</p><h2 className="mt-1 text-xl font-bold">{report.post?.title ?? "Publicação removida"}</h2><p className="mt-1 text-sm text-slate-500">Por @{report.reporter?.username ?? "utilizador"} · {new Date(report.created_at).toLocaleString("pt-PT")}</p></div><Link href={`/mundo-dos-patudos/${report.post_id}`} className="text-sm underline">Abrir caso</Link></div>{report.details && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">{report.details}</p>}<div className="mt-4 flex gap-2"><form action={review}><button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white">Arquivar publicação</button></form><form action={dismiss}><button className="rounded-lg border px-3 py-2 text-sm font-bold">Rejeitar denúncia</button></form></div></article>;
    })}</div>}
  </div></main>;
}
