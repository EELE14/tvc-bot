import { EditorTable } from "@/components/editor-table.tsx";
import { InviteEditor } from "@/components/invite-editor.tsx";
import { Panel } from "@/components/stats.tsx";
import { listEditors } from "@/editors.ts";
import { requireAdmin } from "@/session.ts";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const editors = await listEditors();

  return (
    <>
      <h1 className="mb-5 text-[15px] text-white">access</h1>

      <Panel
        title="editors"
        hint="editors change item values, admins also manage this list"
      >
        <EditorTable editors={editors} currentId={admin.discordId} />
      </Panel>

      <Panel
        title="add an editor"
        hint="right click a discord user and copy their id, developer mode has to be on"
      >
        <InviteEditor />
      </Panel>
    </>
  );
}
