import { signIn } from "@/auth.ts";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-[11px] tracking-[0.1em] text-muted uppercase">
        TVC Bot Interface
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="cursor-pointer border border-line bg-[#0f0f0f] px-6 py-2.5 hover:border-line-strong"
        >
          login with discord
        </button>
      </form>
    </main>
  );
}
