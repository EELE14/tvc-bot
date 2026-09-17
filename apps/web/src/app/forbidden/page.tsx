import { signIn } from "@/auth.ts";

export default function ForbiddenPage() {
  return (
    <main className="centered">
      <p className="eyebrow danger">403 — access denied</p>
      <p className="hint">
        you don&apos;t have permission to access this interface
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/" });
        }}
      >
        <button className="action" type="submit">
          login with a different account
        </button>
      </form>
    </main>
  );
}
