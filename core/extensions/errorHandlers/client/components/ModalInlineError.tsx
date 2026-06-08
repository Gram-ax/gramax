import Error from "@components/Error";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";

interface ModalInlineErrorProps {
	title: string;
	message: string;
	error: Error;
	onClose: () => void;
	isCommandError?: boolean;
}

export const ModalInlineError = (props: ModalInlineErrorProps) => {
	const { title, message, error, onClose, isCommandError = false } = props;
	const onRefresh = () => {
		onClose();
		window.location.reload();
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-start gap-3">
				<Icon className="mt-0.5 shrink-0" icon={isCommandError ? "circle-x" : "alert-circle"} size="xl" />
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h2 className="mt-2 text-base font-semibold leading-none tracking-tight text-primary-fg lg:text-lg lg:leading-none">
						{title}
					</h2>
					{/** biome-ignore lint/style/useNamingConvention: expected */}
					<p className="article" dangerouslySetInnerHTML={{ __html: message }} />
				</div>
			</div>
			<div className="article bg-transparent">
				<Error error={error} />
			</div>
			<div className="flex justify-end gap-2 pt-2">
				{isCommandError ? (
					<>
						<Button onClick={onClose} variant="outline">
							{t("cancel")}
						</Button>
						<Button onClick={onRefresh} variant="primary">
							{t("refresh")}
						</Button>
					</>
				) : (
					<Button onClick={onClose} variant="primary">
						{t("ok")}
					</Button>
				)}
			</div>
		</div>
	);
};
