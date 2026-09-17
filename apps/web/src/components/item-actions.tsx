import Link from "next/link";
import { deleteItem } from "@/actions.ts";

export function ItemActions({ slug, name }: { slug: string; name: string }) {
  const remove = async () => {
    "use server";
    await deleteItem(slug);
  };

  return (
    <div className="mt-6 flex gap-2">
      <Link
        href={`/items/${encodeURIComponent(slug)}/edit`}
        className="cursor-pointer border border-line px-4 py-1.5 hover:border-line-strong"
      >
        edit
      </Link>
      <form action={remove}>
        <button
          type="submit"
          className="cursor-pointer border border-[#3f1f1f] px-4 py-1.5 text-danger hover:border-danger"
        >
          delete {name}
        </button>
      </form>
    </div>
  );
}
