import { createItem } from "@/actions.ts";
import { ItemForm } from "@/components/item-form.tsx";

export default function NewItemPage() {
  return (
    <>
      <h1 className="mb-4 text-[15px] text-white">new item</h1>
      <ItemForm
        action={createItem}
        cancelHref="/"
        values={{
          name: "",
          aliases: "",
          colour: null,
          imageSourceUrl: "",
          unsure: false,
          single: undefined,
          tiers: [],
        }}
      />
    </>
  );
}
