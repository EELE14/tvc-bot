"use client";

import { useActionState } from "react";
import { EditorRole } from "@tvc/db/types";
import { inviteEditor } from "@/admin-actions.ts";
import { inputClass } from "./fields.tsx";

export function InviteEditor() {
  const [state, submit, pending] = useActionState(inviteEditor, {
    problems: [],
  });

  return (
    <form action={submit}>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          name="discordId"
          placeholder="discord user id"
          inputMode="numeric"
          aria-label="discord user id"
          className={inputClass}
        />
        <select
          name="role"
          defaultValue={EditorRole.EDITOR}
          className={inputClass}
        >
          <option value={EditorRole.EDITOR}>editor</option>
          <option value={EditorRole.ADMIN}>admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer border border-line px-4 py-1.5 whitespace-nowrap hover:border-line-strong"
        >
          {pending ? "adding…" : "add"}
        </button>
      </div>
      {state.problems.length > 0 && (
        <ul className="mt-2 text-danger">
          {state.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
