import ActiveWorkoutScreen from "./active-workout-screen";

export default async function ActiveWorkoutPage(props: PageProps<"/workout/active">) {
  const searchParams = await props.searchParams;
  const source = searchParams.source === "sample" ? "sample" : "program";

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ActiveWorkoutScreen source={source} />
      </div>
    </div>
  );
}
