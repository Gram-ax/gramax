import { Loader } from "@ui-kit/Loader";

export const FileLoader = () => {
	return (
		<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" data-loader="true">
			<Loader size="3xl" />
		</div>
	);
};
