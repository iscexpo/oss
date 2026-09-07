import { Welcome } from "@/components/modals/welcome";
import { cookies } from "next/headers";
import { hideBanner } from "./actions";
import { WorkspaceShell } from "./workspace-shell";

export default async function Page() {
  const store = await cookies();
  const banner = store.get("banner-hidden")?.value !== "true";
  return (
    <>
      <Welcome defaultOpen={banner} onDismissAction={hideBanner} />
      <WorkspaceShell />
    </>
  );
}
