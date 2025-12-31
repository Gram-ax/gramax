import { WorkspaceSettings } from "../types/WorkspaceComponent";
import { Button, IconButton } from "@ui-kit/Button";
import { FileInput, Input, type FileValue } from "@ui-kit/Input";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import styled from "@emotion/styled";
import EditStyles from "@ext/workspace/components/EditStyles";
import { useRef } from "react";
import t from "@ext/localization/locale/translate";

const StyledFileInput = styled(FileInput)`
	width: 20rem;
`;

const toBase64 = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str)));

interface WorkspaceStylingProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
}

export function WorkspaceStyling({ localSettings, setLocalSettings }: WorkspaceStylingProps) {
	const originalCssRef = useRef<string>("");

	const handleOpenCssEditor = () => {
		originalCssRef.current = localSettings.style?.css || "";
	};

	const handleRevertCss = () => {
		setLocalSettings((prev) => ({
			...prev,
			style: { ...prev.style, css: originalCssRef.current },
		}));
	};

	return (
		<div>
			<h2 className="text-xl font-medium mb-4">{t("workspace.appearance")}</h2>
			<div className="space-y-4">
				<StyledField
					title={t("file-input.logo-light")}
					control={() => (
						<div className="flex-[2]">
							{localSettings.style?.logo ? (
								<div className="flex items-center gap-2">
									<div
										className="flex items-center justify-center h-10 rounded-md"
										style={{ backgroundColor: "#f4f4f4", width: "20rem" }}
									>
										<img
											src={`data:image/svg+xml;base64,${toBase64(localSettings.style.logo)}`}
											alt="logo"
											className="w-full h-8"
										/>
									</div>
									<IconButton
										icon="x"
										variant="outline"
										onClick={() => {
											setLocalSettings((prev) => ({
												...prev,
												style: { ...prev.style, logo: undefined },
											}));
										}}
									/>
									<div className="relative cursor-pointer">
										<Input
											id="style.logo"
											type="file"
											accept="image/svg+xml"
											className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer"
											onChange={async (e) => {
												const file = e.target.files?.[0];
												if (!file) return;
												const data = await file.arrayBuffer();
												const svg = new TextDecoder().decode(data);
												setLocalSettings((prev) => ({
													...prev,
													style: { ...prev.style, logo: svg },
												}));
											}}
										/>
										<IconButton icon="upload" variant="outline" />
									</div>
								</div>
							) : (
								<StyledFileInput
									accept="image/svg+xml"
									placeholder={t("file-input.select-file")}
									chooseButtonText={t("select")}
									onChange={async (file: FileValue) => {
										if (!file || !(file instanceof File)) return;
										const data = await file.arrayBuffer();
										const svg = new TextDecoder().decode(data);
										setLocalSettings((prev) => ({
											...prev,
											style: { ...prev.style, logo: svg },
										}));
									}}
								/>
							)}
						</div>
					)}
				/>

				<StyledField
					title={t("file-input.logo-dark")}
					control={() => (
						<div className="flex-[2]">
							{localSettings.style?.logoDark ? (
								<div className="flex items-center gap-2">
									<div
										className="flex  items-center justify-center h-10 rounded-md"
										style={{ backgroundColor: "#151828", width: "20rem" }}
									>
										<img
											src={`data:image/svg+xml;base64,${toBase64(localSettings.style.logoDark)}`}
											alt="logo"
											className="w-full h-8"
										/>
									</div>
									<IconButton
										icon="x"
										variant="outline"
										onClick={() => {
											setLocalSettings((prev) => ({
												...prev,
												style: { ...prev.style, logoDark: undefined },
											}));
										}}
									/>
									<div className="relative cursor-pointer">
										<Input
											id="style.logoDark"
											type="file"
											accept="image/svg+xml"
											className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer"
											onChange={async (e) => {
												const file = e.target.files?.[0];
												if (!file) return;
												const data = await file.arrayBuffer();
												const svg = new TextDecoder().decode(data);
												setLocalSettings((prev) => ({
													...prev,
													style: { ...prev.style, logoDark: svg },
												}));
											}}
										/>
										<IconButton icon="upload" variant="outline" />
									</div>
								</div>
							) : (
								<StyledFileInput
									accept="image/svg+xml"
									placeholder={t("file-input.select-file")}
									chooseButtonText={t("select")}
									onChange={async (file: FileValue) => {
										if (!file || !(file instanceof File)) return;
										const data = await file.arrayBuffer();
										const svg = new TextDecoder().decode(data);
										setLocalSettings((prev) => ({
											...prev,
											style: { ...prev.style, logoDark: svg },
										}));
									}}
								/>
							)}
						</div>
					)}
				/>

				<StyledField
					title={t("workspace.css-style")}
					control={() => (
						<div className="flex-[2]">
							<EditStyles
								customCss={localSettings.style?.css || ""}
								setCustomCss={(css: string) => {
									setLocalSettings((prev) => ({
										...prev,
										style: { ...prev.style, css },
									}));
								}}
								revertCustomCss={handleRevertCss}
							>
								<Button variant="outline" onClick={handleOpenCssEditor}>
									{t("edit2")}
								</Button>
							</EditStyles>
						</div>
					)}
				/>
			</div>
		</div>
	);
}
