import ActiveWorkoutScreen from "./active-workout-screen";

export default function ActiveWorkoutPage() {
  return (
    <div className="flex flex-1 flex-col bg-black px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ActiveWorkoutScreen />
      </div>
    </div>
  );
}
