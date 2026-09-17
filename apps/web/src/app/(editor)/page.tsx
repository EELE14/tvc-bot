import { ItemList } from "@/components/item-list.tsx";
import { listItems } from "@/items.ts";

export default async function IndexPage() {
  const items = await listItems();

  return (
    <>
      <p className="hidden py-16 text-center text-muted md:block">
        select an item
      </p>
      <div className="-m-4 flex flex-col md:hidden">
        <ItemList items={items} />
      </div>
    </>
  );
}
