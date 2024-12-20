import { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";
import { memo, useRef, useCallback, ChangeEvent } from "react";

interface LogoUploader {
	imageTheme?: Theme;
	updateResource: (value: string) => void;
	deleteResource: () => any;
	logo?: string;
	className?: string;
}

const LogoUploader = memo((props: LogoUploader) => {
	const { updateResource, deleteResource, logo, imageTheme, className } = props;
	const imageRef = useRef<HTMLImageElement>(null);
	const addImageRef = useRef(null);
	const deleteImageRef = useRef<HTMLDivElement>(null);
	const labelRef = useRef(null);

	const handleUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files && event.target.files[0];
			if (file && file.type === "image/svg+xml") {
				const reader = new FileReader();
				reader.onload = (e) => {
					const svgContent = e.target?.result as string;
					if (svgContent) updateResource(svgContent);
				};
				reader.readAsText(file);
			}
			event.target.value = ""; // он автоматом сохраняет значение в value при onChange
		},
		[updateResource],
	);

	const height = 31.55;

	return (
		<>
			<div
				className={className}
				style={{
					display: "grid",
					justifyContent: "space-between",
					gridTemplateColumns: "1fr auto auto",
					gap: logo ? "0.5rem" : "0",
				}}
			>
				{logo && (
					<div style={{ height }} data-theme={imageTheme} className={"imageWrapper"}>
						<img ref={imageRef} src={logo} className={"homePageImg"} alt={`${imageTheme}-logo`} />
					</div>
				)}
				{logo && (
					<ButtonLink
						unionFontSize
						isEmUnits
						iconFw={false}
						ref={deleteImageRef}
						iconCode={"x"}
						textSize={TextSize.S}
						onClick={deleteResource}
						buttonStyle={ButtonStyle.default}
						style={{ height }}
					/>
				)}
				<div>
					<label ref={labelRef} style={{ width: "100%" }}>
						<ButtonLink
							unionFontSize
							iconFw={false}
							isEmUnits
							ref={addImageRef}
							iconCode={"upload"}
							textSize={TextSize.S}
							buttonStyle={ButtonStyle.default}
							style={{ height }}
							text={logo ? undefined : t("workspace.upload-logo")}
							fullWidth={!logo}
						/>
						<input type="file" accept=".svg" onChange={handleUpload} hidden />
					</label>
				</div>
			</div>
		</>
	);
});

export default styled(LogoUploader)`
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
