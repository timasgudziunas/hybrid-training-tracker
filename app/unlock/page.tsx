import UnlockForm from "./unlock-form";

export default async function UnlockPage(props: PageProps<"/unlock">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/") ? redirectParam : "/";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-ink-tertiary">
          Hybrid Training Tracker
        </p>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Enter your passphrase</h1>
      </div>
      <UnlockForm redirectTo={redirectTo} />
    </div>
  );
}
