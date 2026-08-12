import { CardLogo } from "@components/HomePage/CardParts/CardLogo";
import t from "@ext/localization/locale/translate";
import { FileInput as FileInputComponent, type FileValue } from "@ui-kit/Input";
import { useEffect, useRef, useState } from "react";

interface FileInputProps {
	value?: FileValue;
	onChange: (file: FileValue) => void;
}

export const FileInput = (props: FileInputProps) => {
	const { onChange, value } = props;
	const initialFile = value instanceof File ? value : null;
	const previewRef = useRef<string>(initialFile ? URL.createObjectURL(initialFile) : null);
	const [previewSrc, setPreviewSrc] = useState<string>(previewRef.current);

	const handleChange = (file: FileValue) => {
		if (previewRef.current) URL.revokeObjectURL(previewRef.current);
		if (file instanceof File) {
			const url = URL.createObjectURL(file);
			previewRef.current = url;
			setPreviewSrc(url);
		} else {
			previewRef.current = null;
			setPreviewSrc(null);
		}
		onChange(file);
	};

	useEffect(
		() => () => {
			if (previewRef.current) URL.revokeObjectURL(previewRef.current);
		},
		[],
	);

	return (
		<div className="overflow-y-auto flex-1 min-h-0 p-1 flex flex-col">
			<FileInputComponent
				accept="image/svg+xml,image/png,image/webp"
				chooseButtonText={t("file-input.select-file")}
				className="overflow-hidden"
				onChange={handleChange}
				placeholder={t("file-input.no-file-chosen")}
				value={value}
			/>
			{previewSrc && (
				<div className="flex-1 min-h-0">
					<div className="relative flex items-center justify-center w-full h-full">
						<CardLogo className="relative size-36" logo={previewSrc ? { src: previewSrc } : null} />
					</div>
				</div>
			)}
		</div>
	);
};
