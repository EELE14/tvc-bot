import { signIn } from "@/auth.ts";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-[11px] tracking-[0.1em] text-danger uppercase">
        403 — access denied
      </p>
      <p className="text-xs text-muted">
        you don&apos;t have permission to access this interface
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="mt-2 cursor-pointer border border-line bg-[#0f0f0f] px-5 py-2 text-xs text-muted hover:border-line-strong hover:text-ink"
        >
          login with a different account
        </button>
      </form>
    </main>
  );
}
