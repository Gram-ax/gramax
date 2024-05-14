import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { lazy, Suspense } from "react";
import type { FileInputProps } from "./FileInputProps";

const FileInput = lazy(() => import("@components/Atoms/FileInput/FileInputBundle"));

const LazyFileInput = (props: FileInputProps) => {
	return (
		<Suspense fallback={<SpinnerLoader fullScreen />}>
			<FileInput {...props} />
		</Suspense>
	);
};

export default LazyFileInput;
