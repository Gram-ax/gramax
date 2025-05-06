import { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { classNames } from "@components/libs/classNames";
import FileInput from "@components/Molecules/FileInput";
import Skeleton from "@components/Atoms/Skeleton";
import ButtonLink, { ButtonLinkProps } from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import ErrorModal from "@ext/errorHandlers/client/components/ErrorModal";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import { memo, useCallback, ChangeEvent, useState, useMemo } from "react";

export type UpdateResource = (data: { content: string; type: string; fileName: string }) => void;

interface LogoUploader {
	deleteResource: () => any;
	updateResource: UpdateResource;
	imageTheme?: Theme;
	isLoading?: boolean;
	className?: string;
	logo?: string;
	svgOnly?: boolean;
}

const LogoUploader = memo((props: LogoUploader) => {
	const { updateResource, deleteResource, logo, svgOnly, imageTheme, isLoading, className } = props;
	const [error, setError] = useState<DefaultError>(null);

	const handleUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setError(null);

			const file = event.target.files && event.target.files[0];
			if (!file) return;

			const allowedTypes = svgOnly ? ["image/svg+xml"] : ["image/svg+xml", "image/png"];
			if (!allowedTypes.includes(file.type)) {
				setError(
					new DefaultError(
						t("workspace.invalid-logo-format-body"),
						undefined,
						undefined,
						undefined,
						t("workspace.invalid-logo-format-title"),
					),
				);
				event.target.value = "";
				return;
			}

			const maxSize = 500 * 1024;
			if (file.size > maxSize) {
				setError(
					new DefaultError(
						t("workspace.logo-size-exceeded"),
						undefined,
						undefined,
						undefined,
						t("workspace.logo-upload-failed"),
					),
				);

				return (event.target.value = "");
			}

			const reader = new FileReader();

			if (file.type === "image/svg+xml") {
				reader.onload = (e) => {
					const svgContent = e.target?.result as string;
					if (svgContent) updateResource({ content: svgContent, type: "svg", fileName: file.name });
				};
				reader.readAsText(file);
			} else {
				reader.onload = (e) => {
					const dataUrl = e.target?.result as string;
					if (dataUrl) updateResource({ content: dataUrl, type: "png", fileName: file.name });
				};
				reader.readAsDataURL(file);
			}

			event.target.value = "";
		},
		[updateResource],
	);

	const height = 31.55;

	const buttonProps: ButtonLinkProps = useMemo(() => {
		return {
			iconCode: "upload",
			style: { height },
			text: logo ? undefined : t("load"),
			unionFontSize: true,
			isEmUnits: true,
			textSize: TextSize.S,
			buttonStyle: ButtonStyle.default,
			fullWidth: !logo,
			iconFw: false,
		};
	}, [logo, height]);

	return (
		<div className={classNames(className, { needGap: logo })}>
			{isLoading ? (
				<Skeleton style={{ height, width: "100%" }} />
			) : (
				<>
					{logo && (
						<div style={{ height }} data-theme={imageTheme} className={"imageWrapper"}>
							<img src={logo} className={"homePageImg"} alt={`${imageTheme}-logo`} />
						</div>
					)}

					{logo && <ButtonLink {...buttonProps} iconCode={"x"} onClick={deleteResource} />}

					<FileInput
						buttonLinkProps={buttonProps}
						accept={svgOnly ? ".svg" : ".svg,.png"}
						onChange={handleUpload}
						hidden
					/>
				</>
			)}
			<ErrorModal error={error} setError={setError} />
		</div>
	);
});

export default styled(LogoUploader)`
	display: grid;
	justify-content: space-between;
	grid-template-columns: 1fr auto auto;
	gap: 0;

	&.needGap {
		gap: 0.5rem;
	}

	.imageWrapper {
		background: var(--color-menu-bg);
		height: 100%;
		border-radius: var(--radius-medium);
		padding: 4px 8px;
	}

	.homePageImg {
		max-width: 100%;
		height: 100%;
		max-height: 50px;
	}
`;
