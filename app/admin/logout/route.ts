import { redirect } from "next/navigation";
import { logoutAdmin } from "@/lib/auth/admin-auth";

// POST uniquement : en GET, la deconnexion se declenchait sur un simple lien
// ou un prechargement du navigateur. L'interface passe de toute facon par la
// server action logoutAdminAction ; cette route ne sert que de repli.
// Le cookie de session est en SameSite=Lax, donc un POST cross-site
// n'emporte pas la session.
export async function POST() {
  await logoutAdmin();
  redirect("/admin/login?loggedOut=1");
}
