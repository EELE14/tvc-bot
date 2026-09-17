import { signIn } from "@/auth.ts";

export default function LoginPage() {
  return (
    <main className="centered">
      <p className="eyebrow">TVC Bot Interface</p>
      <form
        action={async () => {
          "use server";
          await signIn("discord", { redirectTo: "/" });
        }}
      >
        <button className="action" type="submit">
          login with discord
        </button>
      </form>
    </main>
  );
}
