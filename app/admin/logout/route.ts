import { redirect } from "next/navigation";
import { logoutAdmin } from "@/lib/auth/admin-auth";

export async function GET() {
  await logoutAdmin();
  redirect("/admin/login?loggedOut=1");
}
