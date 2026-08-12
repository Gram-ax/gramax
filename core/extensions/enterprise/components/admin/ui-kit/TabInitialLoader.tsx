import { Loader } from "@ui-kit/Loader";

export function TabInitialLoader() {
	return (
		<div className="flex items-center justify-center h-full">
			<Loader style={{ transform: "scale(3)" }} />
		</div>
	);
}
