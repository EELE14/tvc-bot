import { notFound } from "next/navigation";
import { ItemDetailView } from "@/components/item-detail.tsx";
import { getItem } from "@/items.ts";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem(decodeURIComponent(slug));
  if (!item) notFound();

  return <ItemDetailView item={item} />;
}
