import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import CircularProgressbar from "@components/Atoms/CircularProgressbar";
import styled from "@emotion/styled";

import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { HTMLAttributes, useEffect, useState } from "react";
import AppError from "./Atoms/AppError";

export type Progress = {
	current: number;
	total: number;
};

export type MigrateProgressProps = {
	progress: Progress;
} & HTMLAttributes<HTMLDivElement>;

export type MigrateIgnoredProps = {
	ignored: string[];
	onClose: () => void;
} & HTMLAttributes<HTMLDivElement>;

export type MigrateProps = {
	state: MigrateState;
	setState: (state: MigrateState) => void;
	onDone: () => Promise<void>;
};

export enum MigrateState {
	None,
	InProgress,
	ShowIgnored,
}

const Migrate = ({ state, setState, onDone }: MigrateProps) => {
	const [shouldMigrate, setShouldMigrate] = useState<boolean>(undefined);
	const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
	const [ignored, setIgnored] = useState<string[]>([]);
	const [error, setError] = useState<DefaultError>();

	useEffect(() => {
		if (typeof shouldMigrate !== "undefined" || shouldMigrate) return;
		(async () => {
			try {
				const app = await getApp();
				const commands = getCommands(app);
				const shouldMigrate = await commands.migrate.shouldMigrate.do();
				setShouldMigrate(shouldMigrate);
				setState(shouldMigrate ? MigrateState.InProgress : MigrateState.None);
				if (shouldMigrate) {
					const total = await commands.migrate.countFiles.do();
					const ignored = [];
					await commands.migrate.migrate.do({
						onProgress: (current) => setProgress({ total, current }),
						onIgnore: (name) => ignored.push(name),
					});
					setIgnored(ignored);
					delete window.app;
					delete window.commands;
					await onDone();
					setState(ignored.length > 0 ? MigrateState.ShowIgnored : MigrateState.None);
				}
			} catch (e) {
				setError(e);
			}
		})();
	}, [shouldMigrate]);
	if (error) return <AppError error={error} />;
	if (state === MigrateState.InProgress) return <MigrateProgress progress={progress} />;
	if (state === MigrateState.ShowIgnored)
		return <MigrateIgnored ignored={ignored} onClose={() => setState(MigrateState.None)} />;
};

const MigrateIgnoredUnstyled = ({ ignored, onClose, ...props }: MigrateIgnoredProps) => {
	return (
		<div {...props}>
			<div className="container">
				<InfoModalForm
					title="Не удалось перенести некоторые каталоги"
					icon={{ code: "circle-alert", color: "var(--color-warning)" }}
					closeButton={{ text: "Продолжить" }}
					onCancelClick={onClose}
				>
					<div className="info article">
						<div>Пожалуйста, загрузите их заново:</div>
						<ul>
							{ignored.map((n, i) => (
								<li key={i}>
									<code>{n}</code>
								</li>
							))}
						</ul>
						<div>
							Если у вас были неопубликованные изменения, которые важно не потерять — обратитесь в{" "}
							<a href="https://t.me/gramax_chat">поддержку</a>.
						</div>
					</div>
				</InfoModalForm>
			</div>
		</div>
	);
};

export const MigrateIgnored = styled(MigrateIgnoredUnstyled)`
	.container {
		width: var(--default-form-width);
		min-width: fit-content;
	}

	display: flex;
	height: 100%;
	width: 100%;
	align-items: center;
	justify-content: center;
	padding-bottom: 0.4rem;

	.info {
		width: 100%;
	}

	ul {
		padding: 0px 0.8rem;
	}
`;

const MigrateProgressUnstyled = ({ progress, ...props }: MigrateProgressProps) => {
	return (
		<div {...props}>
			<div className="container">
				<InfoModalForm
					title="Нам нужно обновить ваши файлы"
					icon={{ code: "circle-alert", color: "var(--color-warning)" }}
					onCancelClick={null}
					noButtons
				>
					<div className="info article">
						<div>В новой версии мы ускорили операции с Git.</div>
						<div>Для корректной работы нужно перенести ваши файлы со старой структуры на новую.</div>
						<div>Это займет пару минут.</div>
						<div className="progress">
							<CircularProgressbar value={progress.current} maxValue={progress.total} />
						</div>
					</div>
				</InfoModalForm>
			</div>
		</div>
	);
};

const MigrateProgress = styled(MigrateProgressUnstyled)`
	.container {
		width: var(--default-form-width);
		min-width: fit-content;
	}

	display: flex;
	height: 100%;
	width: 100%;
	align-items: center;
	justify-content: center;
	padding-bottom: 0.4rem;

	.info {
		width: 100%;
	}

	.progress {
		margin: 0.8rem 0px;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
`;

export default Migrate;
