import { MAX_ICON_SIZE } from "@app/config/const";
import styled from "@emotion/styled";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { FileInput, type FileValue } from "@ui-kit/Input";
import { memo, useCallback } from "react";

export type UpdateResource = (data: { content: string; type: string; fileName: string }) => void;

interface LogoUploaderProps {
	defaultFileInfo: {
		name: string;
		url: string;
	};
	error?: string;
	className?: string;
	svgOnly?: boolean;
	deleteResource: () => void;
	updateResource: UpdateResource;
	onChange?: (file: File) => void;
	onError?: (error: DefaultError) => void;
}

const ALLOWED_SVG = ["image/svg+xml"];
const ALLOWED_PNG_SVG = ["image/svg+xml", "image/png"];
const getAllowedTypes = (svgOnly?: boolean) => (svgOnly ? ALLOWED_SVG : ALLOWED_PNG_SVG);

const useLogoUploader = (props: Pick<LogoUploaderProps, "svgOnly" | "updateResource" | "onError" | "onChange">) => {
	const { svgOnly, updateResource, onError, onChange } = props;
	const validateFile = (file: File, svgOnly?: boolean) => {
		if (!getAllowedTypes(svgOnly).includes(file.type as any)) return "workspace.invalid-logo-format-body";
		if (file.size > MAX_ICON_SIZE) return "workspace.logo-size-exceeded";
	};

	const handleUpload = useCallback(
		(file: File) => {
			const errorKey = validateFile(file, svgOnly);
			if (errorKey) {
				const errorInstance = new DefaultError(
					t(errorKey),
					undefined,
					undefined,
					undefined,
					t("workspace.upload-error-title"),
				);

				onError?.(errorInstance);
				return;
			}

			const reader = new FileReader();

			reader.onload = (e) => {
				const result = e.target?.result as string;
				if (!result) return;

				updateResource({
					content: result,
					type: file.type === "image/svg+xml" ? "svg" : "png",
					fileName: file.name,
				});
				onChange?.(file);
			};

			file.type === "image/svg+xml" ? reader.readAsText(file) : reader.readAsDataURL(file);
		},
		[svgOnly, updateResource, onError, onChange],
	);

	return { handleUpload } as const;
};

const LogoUploaderComponent = memo((props: LogoUploaderProps) => {
	const { updateResource, deleteResource, defaultFileInfo, svgOnly, className, onError, onChange, error } = props;

	const { handleUpload } = useLogoUploader({
		svgOnly,
		updateResource,
		onError,
		onChange,
	});

	const onChangeHandler = useCallback(
		(file: File) => {
			if (!file) return deleteResource();
			handleUpload(file);
		},
		[deleteResource, handleUpload],
	);

	return (
		<Wrapper className={className}>
			<FileInput
				accept={svgOnly ? "image/svg+xml" : "image/svg+xml, image/png"}
				chooseButtonText={t("file-input.select-file")}
				className="overflow-hidden"
				defaultValue={defaultFileInfo as FileValue}
				error={error}
				onChange={onChangeHandler}
				placeholder={t("file-input.no-file-chosen")}
			/>
		</Wrapper>
	);
});

const Wrapper = styled("div")`
	display: grid;
	justify-content: space-between;
	grid-template-columns: 1fr auto auto;
	gap: 0;
`;

export default LogoUploaderComponent;
