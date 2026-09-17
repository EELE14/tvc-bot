import { formatAmount, scaleLabel } from "@tvc/core";
import type { ItemValueModel } from "@tvc/db";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[11px] tracking-[0.08em] text-muted uppercase">
        {title}
      </h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Head({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th
            key={column}
            className="border-b border-line px-2 py-1 text-left text-[11px] font-normal tracking-[0.06em] whitespace-nowrap text-muted uppercase"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Cells({ value }: { value: ItemValueModel }) {
  return (
    <>
      <td className="px-2 py-1.5">${formatAmount(value.amount)}</td>
      <td className="px-2 py-1.5">{scaleLabel(value.demand)}</td>
      <td className="px-2 py-1.5">{scaleLabel(value.stability)}</td>
      <td className="px-2 py-1.5">{scaleLabel(value.overpay)}</td>
    </>
  );
}

const COLUMNS = ["Value", "Demand", "Stability", "Overpay"];

export function UnrangedValue({ value }: { value: ItemValueModel }) {
  return (
    <Section title="Value without serial">
      <table className="w-full min-w-[360px] border-collapse">
        <Head columns={COLUMNS} />
        <tbody>
          <tr>
            <Cells value={value} />
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function TierTable({ tiers }: { tiers: ItemValueModel[] }) {
  return (
    <Section title={`Serial tiers (${tiers.length})`}>
      <table className="w-full min-w-[360px] border-collapse">
        <Head columns={["Range", ...COLUMNS]} />
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.id} className="border-b border-[#141414]">
              <td className="px-2 py-1.5 whitespace-nowrap">
                {tier.serialMin}–{tier.serialMax}
              </td>
              <Cells value={tier} />
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
