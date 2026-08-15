import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DecksService } from "@/lib/modules/decks/service";

/**
 * وب‌هوک ثبت‌نام کاربر — وقتی کسی در Clerk ثبت‌نام می‌کند، اینجا صدا زده
 * می‌شود تا رکورد متناظر در دیتابیس خودمان و یک Deck پیش‌فرض ("لغات من")
 * برایش ساخته شود.
 *
 * تنظیم در داشبورد Clerk: Webhooks → Add Endpoint → این آدرس را بده،
 * رویداد user.created را فعال کن، Signing Secret را در .env بگذار.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!webhookSecret) {
    return new Response("CLERK_WEBHOOK_SIGNING_SECRET تنظیم نشده", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("هدرهای svix ناقص است", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return new Response("امضای وب‌هوک نامعتبر است", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id: clerkId, email_addresses, username } = event.data;
    const email = email_addresses?.[0]?.email_address ?? `${clerkId}@unknown.local`;

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId, email, username: username ?? undefined },
    });

    const decksService = new DecksService(prisma);
    await decksService.ensureDefaultDeck(user.id);
  }

  return new Response("OK", { status: 200 });
}
