import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { lazy, Suspense } from "react";
import FileInputType from "./FileInputProps";

const FileInput = lazy(() => import("@components/Atoms/FileInput/FileInputBundle"));

const LazyFileInput: FileInputType = (props) => {
	return (
		<Suspense fallback={<SpinnerLoader fullScreen />}>
			<FileInput {...props} />
		</Suspense>
	);
};

export default LazyFileInput;
