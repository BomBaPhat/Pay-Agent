import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAgentContext, getSpentTodayUsdc } from "@/lib/currentAgent";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const policySchema = z.object({
  dailyLimitUsdc: z.number().positive(),
  perTxLimitUsdc: z.number().positive(),
  requireApprovalAboveUsdc: z.number().nonnegative(),
  allowedRecipients: z.union([z.literal("any"), z.array(z.string().regex(ADDRESS_REGEX))]),
});

const NOT_CONFIGURED_RESPONSE = () =>
  NextResponse.json({ error: "Chưa cấu hình Supabase — xem docs/SETUP.md mục 1." }, { status: 503 });

export async function GET() {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED_RESPONSE();

  const context = await getCurrentAgentContext();
  if (!context) {
    return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa onboard xong." }, { status: 401 });
  }

  const spentTodayUsdc = await getSpentTodayUsdc(context.agentId);
  return NextResponse.json({ policy: context.policy, spentTodayUsdc });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED_RESPONSE();

  const context = await getCurrentAgentContext();
  if (!context) {
    return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa onboard xong." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = policySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("spending_policies")
    .update({
      daily_limit_usdc: parsed.data.dailyLimitUsdc,
      per_tx_limit_usdc: parsed.data.perTxLimitUsdc,
      require_approval_above_usdc: parsed.data.requireApprovalAboveUsdc,
      allowed_recipients: parsed.data.allowedRecipients,
      updated_at: new Date().toISOString(),
    })
    .eq("agent_id", context.agentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, policy: parsed.data });
}
