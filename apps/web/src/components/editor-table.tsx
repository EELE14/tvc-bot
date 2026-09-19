import { EditorRole, type EditorModel } from "@tvc/db";
import { changeRole, revokeEditor } from "@/admin-actions.ts";
import { mayModify } from "@/access.ts";

const BUTTON =
  "cursor-pointer border border-line px-2 py-1 text-muted hover:border-line-strong hover:text-ink";

function RowActions({ editor }: { editor: EditorModel }) {
  const nextRole =
    editor.role === EditorRole.ADMIN ? EditorRole.EDITOR : EditorRole.ADMIN;

  return (
    <div className="flex justify-end gap-2">
      <form action={changeRole}>
        <input type="hidden" name="discordId" value={editor.discordId} />
        <input type="hidden" name="role" value={nextRole} />
        <button type="submit" className={BUTTON}>
          make {nextRole.toLowerCase()}
        </button>
      </form>
      <form action={revokeEditor}>
        <input type="hidden" name="discordId" value={editor.discordId} />
        <button
          type="submit"
          className="cursor-pointer border border-[#3f1f1f] px-2 py-1 text-danger hover:border-danger"
        >
          revoke
        </button>
      </form>
    </div>
  );
}

export function EditorTable({
  editors,
  currentId,
}: {
  editors: EditorModel[];
  currentId: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            {["discord id", "role", "added", "added by", ""].map(
              (column, index) => (
                <th
                  key={column || index}
                  className={`border-b border-line px-2 py-1 text-[11px] font-normal tracking-[0.06em] whitespace-nowrap text-muted uppercase ${index > 2 ? "text-right" : "text-left"}`}
                >
                  {column}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {editors.map((editor) => {
            const modifiable = mayModify(currentId, editor.discordId);
            return (
              <tr key={editor.id} className="border-b border-[#141414]">
                <td className="px-2 py-1.5 break-all">
                  {editor.discordId}
                  {!modifiable && <span className="ml-2 text-muted">you</span>}
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className={
                      editor.role === EditorRole.ADMIN ? "text-orange-500" : ""
                    }
                  >
                    {editor.role.toLowerCase()}
                  </span>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {editor.addedAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-2 py-1.5 text-right break-all">
                  {editor.addedBy ?? "—"}
                </td>
                <td className="px-2 py-1.5">
                  {modifiable && <RowActions editor={editor} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
