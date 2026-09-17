import { notFound } from "next/navigation";
import { saveItem, type FormState } from "@/actions.ts";
import { ItemForm } from "@/components/item-form.tsx";
import { getItem, splitValues } from "@/items.ts";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem(decodeURIComponent(slug));
  if (!item) notFound();

  const { unranged, tiers } = splitValues(item);
  const save = async (state: FormState, form: FormData) => {
    "use server";
    return saveItem(item.slug, state, form);
  };

  return (
    <>
      <h1 className="mb-4 text-[15px] text-white">edit {item.name}</h1>
      <ItemForm
        action={save}
        cancelHref={`/items/${encodeURIComponent(item.slug)}`}
        values={{
          name: item.name,
          aliases: item.aliases.map((alias) => alias.alias).join(", "),
          colour: item.colour,
          imageSourceUrl: item.imageSourceUrl ?? "",
          unsure: item.unsure,
          single: unranged,
          tiers,
        }}
      />
    </>
  );
}
