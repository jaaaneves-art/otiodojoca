import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function clampLimit(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(n)));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const requestedKind = searchParams.get("kind");
  const kind =
    requestedKind === "models" ||
    requestedKind === "generations" ||
    requestedKind === "variants"
      ? requestedKind
      : "makes";

  const q = (searchParams.get("q") ?? "").slice(0, 80);
  const limit = clampLimit(
    searchParams.get("limit"),
    kind === "makes" ? 20 : 30,
  );

  if (kind === "makes") {
    const { data, error } = await supabase.rpc("search_vehicle_makes", {
      q,
      result_limit: limit,
    });

    if (error) {
      console.error("vehicle make autocomplete:", error);
      return NextResponse.json({ kind, items: [] }, { status: 500 });
    }

    return NextResponse.json(
      { kind, items: data ?? [] },
      {
        headers: {
          "Cache-Control": q
            ? "public, s-maxage=300, stale-while-revalidate=3600"
            : "public, s-maxage=3600",
        },
      },
    );
  }

  if (kind === "models") {
    const makeId = Number(searchParams.get("makeId"));

    if (!Number.isFinite(makeId) || makeId <= 0) {
      return NextResponse.json({ kind, items: [] });
    }

    const { data, error } = await supabase.rpc("search_vehicle_models", {
      make_id_arg: makeId,
      q,
      result_limit: limit,
    });

    if (error) {
      console.error("vehicle model autocomplete:", error);
      return NextResponse.json({ kind, items: [] }, { status: 500 });
    }

    return NextResponse.json(
      { kind, items: data ?? [] },
      {
        headers: {
          "Cache-Control": q
            ? "public, s-maxage=300, stale-while-revalidate=3600"
            : "public, s-maxage=1800",
        },
      },
    );
  }

  if (kind === "generations") {
    const modelId = Number(searchParams.get("modelId"));

    if (!Number.isFinite(modelId) || modelId <= 0) {
      return NextResponse.json({ kind, items: [] });
    }

    let query = supabase
      .from("vehicle_generations")
      .select("id,model_id,name,year_start,year_end")
      .eq("model_id", modelId)
      .order("year_start", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(limit);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("vehicle generation autocomplete:", error);
      return NextResponse.json({ kind, items: [] }, { status: 500 });
    }

    return NextResponse.json(
      { kind, items: data ?? [] },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  }

  const generationId = Number(searchParams.get("generationId"));

  if (!Number.isFinite(generationId) || generationId <= 0) {
    return NextResponse.json({ kind, items: [] });
  }

  let query = supabase
    .from("vehicle_variants")
    .select(
      "id,generation_id,name,fuel_type,displacement_cc,power_hp,power_kw,cylinders,transmission,drivetrain",
    )
    .eq("generation_id", generationId)
    .order("name", { ascending: true })
    .limit(limit);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("vehicle variant autocomplete:", error);
    return NextResponse.json({ kind, items: [] }, { status: 500 });
  }

  return NextResponse.json(
    { kind, items: data ?? [] },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
