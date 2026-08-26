import UnlockForm from "./unlock-form";

export default async function UnlockPage(props: PageProps<"/unlock">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams.redirect;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/") ? redirectParam : "/";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-black px-4 text-white">
      <h1 className="text-xl font-semibold">Hybrid Training Tracker</h1>
      <UnlockForm redirectTo={redirectTo} />
    </div>
  );
}
