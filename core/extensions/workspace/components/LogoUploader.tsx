import { MAX_ICON_SIZE } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import Skeleton from "@components/Atoms/Skeleton";
import styled from "@emotion/styled";
import ErrorModal from "@ext/errorHandlers/client/components/ErrorModal";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import { IconButton, Button } from "@ui-kit/Button";
import { memo, useCallback, useState, useRef, ChangeEvent } from "react";

export type UpdateResource = (data: { content: string; type: string; fileName: string }) => void;

interface LogoUploaderProps {
	deleteResource: () => void;
	updateResource: UpdateResource;
	imageTheme?: Theme;
	isLoading?: boolean;
	className?: string;
	logo?: string;
	svgOnly?: boolean;
}

const ALLOWED_SVG = ["image/svg+xml"];
const ALLOWED_PNG_SVG = ["image/svg+xml", "image/png"];
const getAllowedTypes = (svgOnly?: boolean) => (svgOnly ? ALLOWED_SVG : ALLOWED_PNG_SVG);

const useLogoUploader = ({ svgOnly, updateResource }: Pick<LogoUploaderProps, "svgOnly" | "updateResource">) => {
	const [error, setError] = useState<DefaultError | null>(null);

	const resetInput = (input: HTMLInputElement) => {
		input.value = "";
	};

	const validateFile = (file: File, svgOnly?: boolean) => {
		if (!getAllowedTypes(svgOnly).includes(file.type as any)) return "workspace.invalid-logo-format-body";
		if (file.size > MAX_ICON_SIZE) return "workspace.logo-size-exceeded";
	};

	const handleUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const input = event.target;
			setError(null);

			const file = input.files?.[0];
			if (!file) return;

			const errorKey = validateFile(file, svgOnly);
			if (errorKey) {
				const errorInstance = new DefaultError(
					t(errorKey),
					undefined,
					undefined,
					undefined,
					t("workspace.upload-error-title"),
				);
				setError(errorInstance);
				return resetInput(input);
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
			};

			file.type === "image/svg+xml" ? reader.readAsText(file) : reader.readAsDataURL(file);

			resetInput(input);
		},
		[svgOnly, updateResource],
	);

	return { error, setError, handleUpload } as const;
};

const LogoUploaderComponent = memo((props: LogoUploaderProps) => {
	const { updateResource, deleteResource, logo, svgOnly, imageTheme, isLoading, className } = props;

	const { handleUpload, setError, error } = useLogoUploader({
		svgOnly,
		updateResource,
	});
	const fileRef = useRef<HTMLInputElement>(null);

	const hasLogo = Boolean(logo);

	return (
		<Wrapper className={classNames(className, { "need-gap": hasLogo })}>
			{isLoading ? (
				<Skeleton className={"skeleton-structure"} />
			) : (
				<>
					{hasLogo && (
						<>
							<div data-theme={imageTheme} className="image-wrapper">
								<img src={logo} className="home-page-img" alt="logo" />
							</div>
							<IconButton icon="x" type="button" onClick={deleteResource} />
						</>
					)}

					<label style={{ width: "100%" }}>
						{hasLogo ? (
							<IconButton onClick={() => fileRef.current?.click()} type="button" icon="upload" />
						) : (
							<Button
								onClick={() => fileRef.current?.click()}
								startIcon="upload"
								type="button"
								variant="primary"
								style={{ width: "100%" }}
							>
								{t("load")}
							</Button>
						)}

						<input ref={fileRef} hidden type="file" onChange={handleUpload} />
					</label>
				</>
			)}

			<ErrorModal error={error} setError={setError} />
		</Wrapper>
	);
});

LogoUploaderComponent.displayName = "LogoUploader";

const Wrapper = styled("div")`
	display: grid;
	justify-content: space-between;
	grid-template-columns: 1fr auto auto;
	gap: 0;

	&.need-gap {
		gap: 0.5rem;
	}

	.skeleton-structure {
		height: 36px;
		width: 100%;
	}

	.image-wrapper {
		height: 36px;
		background: var(--color-menu-bg);
		border-radius: var(--radius-medium);
		padding: 4px 8px;
	}

	.home-page-img {
		max-width: 100%;
		height: 100%;
		max-height: 50px;
	}
`;

export default LogoUploaderComponent;
