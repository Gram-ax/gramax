import { MAX_ICON_SIZE } from "@app/config/const";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { FormProps } from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import ErrorModal from "@ext/errorHandlers/client/components/ErrorModal";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";
import { Button } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";

import {
	memo,
	useCallback,
	ChangeEvent,
	useState,
	forwardRef,
	Dispatch,
	SetStateAction,
	useEffect,
	useRef,
} from "react";
import Path from "@core/FileProvider/Path/Path";
import Tooltip from "@components/Atoms/Tooltip";

type IconResource = { content: string; type: "svg"; fileName: string };

interface IconUploaderButtonProps {
	className?: string;
	handleUpload: (event: ChangeEvent<HTMLInputElement>) => void;
	error: DefaultError | null;
	setError: Dispatch<SetStateAction<DefaultError | null>>;
}

export const IconUploaderButton = memo(
	forwardRef<HTMLDivElement, IconUploaderButtonProps>(({ className, handleUpload, error, setError }, ref) => {
		const fileRef = useRef<HTMLInputElement>(null);

		const onClickHandler = useCallback(() => {
			fileRef.current?.click();
		}, [fileRef.current]);

		return (
			<div ref={ref} className={className}>
				<label style={{ width: "100%" }}>
					<Button
						startIcon={"upload"}
						children={t("load")}
						variant="outline"
						style={{ width: "100%" }}
						onClick={onClickHandler}
						type="button"
					/>
					<input
						ref={fileRef}
						className="textInput"
						type={"file"}
						accept=".svg"
						onChange={handleUpload}
						multiple
						hidden
					/>
				</label>
				<ErrorModal error={error} setError={setError} />
			</div>
		);
	}),
);

export const useUploadIcon = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [error, setError] = useState<DefaultError | null>(null);
	const [uploadedCount, setUploadedCount] = useState(0);
	const [showUploadInfoTooltip, setShowUploadInfoTooltip] = useState(false);

	const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const uploadCallback = useCallback(
		(props: IconResource) => {
			if (props.type !== "svg") return;

			const iconCode = new Path(props.fileName).name;
			const icon: IconEditorProps = { svg: props.content, code: iconCode };

			void FetchService.fetch(apiUrlCreator.createCustomIcon(), JSON.stringify(icon));
		},
		[apiUrlCreator],
	);

	const handleUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setError(null);
			setUploadedCount(0);
			setShowUploadInfoTooltip(false);
			if (tooltipTimerRef.current) {
				clearTimeout(tooltipTimerRef.current);
				tooltipTimerRef.current = null;
			}

			const files = event.target.files;
			if (!files?.length) return;

			const invalidFileNames: string[] = [];

			Array.from(files).forEach((file) => {
				const isSvg = file.type === "image/svg+xml";
				const isSizeOk = file.size <= MAX_ICON_SIZE;

				if (!isSvg || !isSizeOk) {
					invalidFileNames.push(file.name);
					return;
				}

				const reader = new FileReader();
				reader.onload = (e) => {
					const svgContent = e.target?.result as string;
					if (svgContent) {
						uploadCallback({
							content: svgContent,
							type: "svg",
							fileName: file.name,
						});
						setUploadedCount((prev) => prev + 1);
					}
				};
				reader.readAsText(file);
			});

			if (invalidFileNames.length) {
				setError(
					new DefaultError(
						t("workspace.icon-invalid-files-body").replace("{{iconNames}}", invalidFileNames.join(", ")),
						undefined,
						undefined,
						undefined,
						t("workspace.upload-error-title"),
					),
				);
			}

			event.target.value = "";
		},
		[uploadCallback],
	);

	useEffect(() => {
		if (error === null && uploadedCount > 0) {
			setShowUploadInfoTooltip(true);
			if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
			tooltipTimerRef.current = setTimeout(() => {
				setShowUploadInfoTooltip(false);
			}, 2000);
		}
	}, [error, uploadedCount]);

	useEffect(() => {
		return () => tooltipTimerRef.current && clearTimeout(tooltipTimerRef.current);
	}, []);

	return {
		handleUpload,
		error,
		setError,
		uploadedCount,
		showUploadInfoTooltip,
	};
};

const UploadArticleIcon = ({ formProps }: { formProps: FormProps }) => {
	const { handleUpload, error, setError, uploadedCount, showUploadInfoTooltip } = useUploadIcon();

	return (
		<FormField
			name={"iconUploader"}
			title={t("check-icons")}
			description={t("workspace.icons-available-in-article")}
			control={() => (
				<Tooltip content={`${t("workspace.icons-uploaded")}: ${uploadedCount}`} visible={showUploadInfoTooltip}>
					<IconUploaderButton handleUpload={handleUpload} error={error} setError={setError} />
				</Tooltip>
			)}
			{...formProps}
		/>
	);
};

export default UploadArticleIcon;
