"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ValueEntry } from "@tvc/core";
import type { ItemColour } from "@tvc/db/types";
import type { FormState } from "@/types.ts";
import { ColourSelect, Field, ScaleSelect, inputClass } from "./fields.tsx";
import { TierRows } from "./tier-rows.tsx";

export type ItemFormValues = {
  name: string;
  aliases: string;
  colour: ItemColour | null;
  imageSourceUrl: string;
  unsure: boolean;
  single: ValueEntry | undefined;
  tiers: ValueEntry[];
};

const BUTTON =
  "cursor-pointer border border-line px-4 py-1.5 hover:border-line-strong";

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border border-line px-2 py-0.5 text-[11px] ${active ? "text-ink" : "text-muted"}`}
    >
      {label}
    </button>
  );
}

export function ItemForm({
  values,
  action,
  cancelHref,
}: {
  values: ItemFormValues;
  action: (state: FormState, form: FormData) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, submit, pending] = useActionState(action, { problems: [] });
  const [mode, setMode] = useState(
    values.tiers.length > 0 ? "tiers" : "single",
  );

  return (
    <form action={submit}>
      <input type="hidden" name="mode" value={mode} />

      {state.problems.length > 0 && (
        <ul className="mb-4 border border-danger px-3 py-2 text-danger">
          {state.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-[11px] tracking-[0.08em] text-muted uppercase">
          item
        </h2>
        <Field label="name">
          <input
            name="name"
            defaultValue={values.name}
            className={inputClass}
          />
        </Field>
        <Field label="aliases">
          <input
            name="aliases"
            defaultValue={values.aliases}
            placeholder="comma separated"
            className={inputClass}
          />
        </Field>
        <Field label="image url">
          <input
            name="imageSourceUrl"
            defaultValue={values.imageSourceUrl}
            className={inputClass}
          />
        </Field>
        <Field label="colour">
          <ColourSelect value={values.colour} />
        </Field>
        <Field label="unsure">
          <input
            type="checkbox"
            name="unsure"
            defaultChecked={values.unsure}
            className="size-5 cursor-pointer"
          />
        </Field>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.08em] text-muted uppercase">
          pricing
          <ModeButton
            active={mode === "single"}
            label="single value"
            onClick={() => setMode("single")}
          />
          <ModeButton
            active={mode === "tiers"}
            label="serial tiers"
            onClick={() => setMode("tiers")}
          />
        </h2>

        {mode === "single" ? (
          <>
            <Field label="value">
              <input
                name="single.amount"
                defaultValue={values.single?.amount ?? 0}
                className={inputClass}
              />
            </Field>
            <Field label="demand">
              <ScaleSelect
                name="single.demand"
                value={values.single?.demand ?? 1}
              />
            </Field>
            <Field label="stability">
              <ScaleSelect
                name="single.stability"
                value={values.single?.stability ?? 1}
              />
            </Field>
            <Field label="overpay">
              <ScaleSelect
                name="single.overpay"
                value={values.single?.overpay ?? 0}
                from={0}
              />
            </Field>
          </>
        ) : (
          <TierRows tiers={values.tiers} />
        )}
      </section>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "saving…" : "save"}
        </button>
        <Link href={cancelHref} className={`${BUTTON} text-muted`}>
          cancel
        </Link>
      </div>
    </form>
  );
}
