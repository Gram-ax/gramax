import { invoke } from "@tauri-apps/api/core";
import * as dialog from "@tauri-apps/plugin-dialog";

import Button from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import Language, { defaultLanguage } from "@ext/localization/core/model/Language";
import useLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { useEffect, useState } from "react";

const Settings = ({ className }: { className?: string }) => {
	const [root, setRoot] = useState("");
	const [language, setLanguage] = useState<Language>();

	useEffect(() => {
		(async () => {
			setRoot(((await invoke("read_env")) as any).ROOT_PATH);
			setLanguage((await invoke("get_user_language")) ?? defaultLanguage);
		})();
	}, []);

	const save = () => {
		invoke("set_root_path", { path: root });
	};

	const requestRootPath = async () => {
		const path = await dialog.open({ directory: true, defaultPath: root, multiple: false });
		if (path) setRoot(path);
	};

	return (
		<div className={className}>
			<div className="title">{useLocalize("desktopSettings.title", language)}</div>
			<div className="description">{useLocalize("desktopSettings.targetDirectory", language)}</div>
			<div className="min-description">{useLocalize("desktopSettings.targetDirectoryDescription", language)}</div>
			<div className="choose-path">
				<Input className="input" onChange={(ev) => setRoot(ev.target.value)} value={root}></Input>
				<Button className="button" onClick={requestRootPath}>
					{useLocalize("open", language)}
				</Button>
			</div>

			<div className="buttons">
				<Button className="button-cancel" onClick={close}>
					{useLocalize("cancel", language)}
				</Button>

				<Button className="button" onClick={save}>
					{useLocalize("save", language)}
				</Button>
			</div>
		</div>
	);
};

const SettingsStyled = styled(Settings)`
	display: flex;
	flex-direction: column;

	.min-description {
		opacity: 0.6;
		font-size: 11px;
		margin-top: -0.4rem;
		margin-bottom: 0.4rem;
	}

	.description {
		margin-bottom: 0.4rem;
	}

	.choose-path {
		gap: 0.3rem;
		display: flex;
		align-items: center;
	}

	.input {
		flex: 1;
		overflow-y: auto;
		user-select: text;
		padding: 0.17rem 0.88rem;
		max-height: 35px;
		height: 35px;
		border-radius: 2px;
		outline-width: 0 !important;
		border: 1px solid #777675;
	}

	.buttons {
		gap: 1rem;
		height: 35px;
		display: flex;
		font-size: 16px;
		margin-top: 1.5rem;
		align-items: center;
		flex-direction: row;
		justify-content: flex-end;
	}

	.button-cancel {
		cursor: pointer;
		font-weight: 400;
		font-size: 14px !important;
		color: #a4a4a4 !important;
	}

	.button-cancel:hover {
		color: #a4a4a4 !important;
		text-decoration: underline !important;
	}

	.button {
		max-height: 35px;
		display: flex;
		cursor: pointer;
		color: #313031;
		font-weight: 500;
		border-radius: 4px;
		align-items: center;
		text-decoration: none;
		padding: 0.33rem 0.88rem;
		border: 1px solid #313031;
		height: calc(35px - 0.33rem);
	}

	.button:hover {
		color: white;
		background: #00000080;
	}

	.title {
		font-weight: 700;
		font-size: 1.8rem;
		margin-bottom: 1rem;
	}
`;

export default SettingsStyled;
