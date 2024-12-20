import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { lazy, Suspense } from "react";
import DiffFileInputType from "./DiffFileInputProps";

const DiffFileInput = lazy(() => import("@components/Atoms/FileInput/DiffFileInput/DiffFileInputBundle"));

const LazyDiffFileInput: DiffFileInputType = (props) => {
	return (
		<Suspense fallback={<SpinnerLoader fullScreen />}>
			<DiffFileInput {...props} />
		</Suspense>
	);
};

export default LazyDiffFileInput;
