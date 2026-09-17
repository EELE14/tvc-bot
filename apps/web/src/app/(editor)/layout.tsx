import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/auth.ts";
import { ItemList } from "@/components/item-list.tsx";
import { listItems } from "@/items.ts";
import { requireEditor } from "@/session.ts";

export default async function EditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const editor = await requireEditor();
  const items = await listItems();

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line md:flex">
        <ItemList items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-2 text-[11px] text-muted">
          <Link href="/" className="tracking-[0.08em] uppercase hover:text-ink">
            TVC Bot
          </Link>
          {editor.role === "ADMIN" && (
            <Link href="/stats" className="hover:text-ink">
              usage
            </Link>
          )}
          <span className="ml-auto">{editor.name}</span>
          {editor.role === "ADMIN" && (
            <span className="text-orange-500">[admin]</span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="cursor-pointer hover:text-ink">
              logout
            </button>
          </form>
        </header>

        <main className="max-w-4xl flex-1 overflow-y-auto p-4 md:px-9 md:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
