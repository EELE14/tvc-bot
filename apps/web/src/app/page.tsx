import { signOut } from "@/auth.ts";
import { requireEditor } from "@/session.ts";

export default async function HomePage() {
  const editor = await requireEditor();

  return (
    <main className="centered">
      <p className="eyebrow">signed in as {editor.name}</p>
      <p className="hint">role: {editor.role.toLowerCase()}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button className="action" type="submit">
          logout
        </button>
      </form>
    </main>
  );
}
