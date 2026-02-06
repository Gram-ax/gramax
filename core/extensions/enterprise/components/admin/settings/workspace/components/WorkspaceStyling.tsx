import styled from "@emotion/styled";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import t from "@ext/localization/locale/translate";
import EditStyles from "@ext/workspace/components/EditStyles";
import { Button, IconButton } from "@ui-kit/Button";
import { FileInput, type FileValue, Input } from "@ui-kit/Input";
import { useRef } from "react";
import { WorkspaceSettings } from "../types/WorkspaceComponent";

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
					control={() => (
						<div className="flex-[2]">
							{localSettings.style?.logo ? (
								<div className="flex items-center gap-2">
									<div
										className="flex items-center justify-center h-10 rounded-md"
										style={{ backgroundColor: "#f4f4f4", width: "20rem" }}
									>
										<img
											alt="logo"
											className="w-full h-8"
											src={`data:image/svg+xml;base64,${toBase64(localSettings.style.logo)}`}
										/>
									</div>
									<IconButton
										icon="x"
										onClick={() => {
											setLocalSettings((prev) => ({
												...prev,
												style: { ...prev.style, logo: undefined },
											}));
										}}
										variant="outline"
									/>
									<div className="relative cursor-pointer">
										<Input
											accept="image/svg+xml"
											className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer"
											id="style.logo"
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
											type="file"
										/>
										<IconButton icon="upload" variant="outline" />
									</div>
								</div>
							) : (
								<StyledFileInput
									accept="image/svg+xml"
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
									placeholder={t("file-input.select-file")}
								/>
							)}
						</div>
					)}
					title={t("file-input.logo-light")}
				/>

				<StyledField
					control={() => (
						<div className="flex-[2]">
							{localSettings.style?.logoDark ? (
								<div className="flex items-center gap-2">
									<div
										className="flex  items-center justify-center h-10 rounded-md"
										style={{ backgroundColor: "#151828", width: "20rem" }}
									>
										<img
											alt="logo"
											className="w-full h-8"
											src={`data:image/svg+xml;base64,${toBase64(localSettings.style.logoDark)}`}
										/>
									</div>
									<IconButton
										icon="x"
										onClick={() => {
											setLocalSettings((prev) => ({
												...prev,
												style: { ...prev.style, logoDark: undefined },
											}));
										}}
										variant="outline"
									/>
									<div className="relative cursor-pointer">
										<Input
											accept="image/svg+xml"
											className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer"
											id="style.logoDark"
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
											type="file"
										/>
										<IconButton icon="upload" variant="outline" />
									</div>
								</div>
							) : (
								<StyledFileInput
									accept="image/svg+xml"
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
									placeholder={t("file-input.select-file")}
								/>
							)}
						</div>
					)}
					title={t("file-input.logo-dark")}
				/>

				<StyledField
					control={() => (
						<div className="flex-[2]">
							<EditStyles
								customCss={localSettings.style?.css || ""}
								revertCustomCss={handleRevertCss}
								setCustomCss={(css: string) => {
									setLocalSettings((prev) => ({
										...prev,
										style: { ...prev.style, css },
									}));
								}}
							>
								<Button onClick={handleOpenCssEditor} variant="outline">
									{t("edit2")}
								</Button>
							</EditStyles>
						</div>
					)}
					title={t("workspace.css-style")}
				/>
			</div>
		</div>
	);
}
