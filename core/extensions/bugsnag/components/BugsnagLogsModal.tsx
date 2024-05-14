import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import TextArea from "@components/Atoms/TextArea";
import FormStyle from "@components/Form/FormStyle";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { classNames } from "@components/libs/classNames";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PageDataContext from "@core/Context/PageDataContext";
import styled from "@emotion/styled";
import parseContent from "@ext/bugsnag/logic/parseContent";
import sendBug from "@ext/bugsnag/logic/sendBug";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import useLocalize from "@ext/localization/useLocalize";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import Fence from "@ext/markdown/elements/fence/render/component/Fence";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Editor, JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

const getDetails = (props: { editor?: Editor; context?: PageDataContext }) => {
	const { editor, context } = props;
	const result: { replacedArticle?: JSONContent; context?: any; gitLogs?: any } = {};

	if (editor) {
		result.replacedArticle = parseContent(editor.getJSON());
	}

	if (context && context.conf) {
		const conf = { branch: context.conf?.isRelease, version: context.conf?.version };
		result.context = { ...context, sourceDatas: null, userInfo: null, conf };
	}

	if (PersistentLogger) {
		const gitLogs = PersistentLogger.getLogs(/git/, 100);
		result.gitLogs = gitLogs;
	}

	return result;
};

const BugsnagLogsModal = ({ className }: { className?: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ModalLayout
			className={className}
			trigger={<ListItem iconCode="bug" text={useLocalize("bugReport")} />}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
			isOpen={isOpen}
		>
			<ModalLayoutLight>
				<FormStyle>{isOpen && <BugsnagBody setIsOpen={setIsOpen} />}</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

const BugsnagBody = ({ setIsOpen, className }: { setIsOpen: (v: boolean) => void; className?: string }) => {
	const [buttonDisabled, setButtonDisabled] = useState(true);
	const [checked, setChecked] = useState(true);
	const [comment, setComment] = useState("");
	const [isWrongText, setIsWrongText] = useState(false);
	const requiredParameterText = useLocalize("requiredParameter");

	const data = PageDataContextService.value;
	const editor = EditorService.getEditor();

	const cantSendFeedback = useLocalize("cantSendFeedback");
	const checkInternetAndDisableAdBlocker = useLocalize("checkInternetAndDisableAdBlocker");

	const sendLogsHandler = useCallback(
		(comment) => {
			const logs = { comment, ...getDetails({ editor, context: data }) };
			void sendBug(new Error("Пользовательская ошибка"), (e) => {
				// TODO Нужно как то отлавливать, дошел ли контент до багснега и если нет, то бросать ошибку.
				e.addMetadata("props", logs);
			}).catch((e) => {
				console.error(e);
				ErrorConfirmService.notify(
					new DefaultError(cantSendFeedback, new Error(checkInternetAndDisableAdBlocker)),
				);
			});
			setIsOpen(false);
		},
		[checked],
	);

	useEffect(() => {
		setButtonDisabled(!(comment.length && checked));
	}, [checked, comment, isWrongText]);

	const textAreaBlurHandler = () => {
		const voidComment = !comment;
		setIsWrongText(voidComment);
	};

	return (
		<fieldset>
			<legend>{useLocalize("bugReport")}</legend>

			<div className="form-group">
				<div className="field field-string row">
					<label className="control-label">
						<span>{useLocalize("whatHappened")}</span>
						<span className="required">*</span>
					</label>
				</div>
			</div>

			<div className="form-group">
				<div className="field field-string row">
					<TextArea
						onChange={(e) => setComment(e.target.value)}
						placeholder={useLocalize("describeTheProblem")}
						onFocus={() => setIsWrongText(false)}
						onBlur={textAreaBlurHandler}
						value={comment}
						style={{ height: "100px" }}
						errorText={requiredParameterText}
						showError={isWrongText}
					/>
				</div>
			</div>

			<CheckboxWrapper className={classNames("form-group", {}, [className])}>
				<div>
					<Checkbox checked={checked} onClick={() => setChecked((prev) => !prev)}>
						<span>{useLocalize("attachTechnicalDetails")}</span>
					</Checkbox>
				</div>

				<div className="checkbox__description">
					<span>{useLocalize("thisWillHelpUs")}</span>{" "}
					<UserDetails details={JSON.stringify(getDetails({ editor, context: data }), null, 4)} />
				</div>
			</CheckboxWrapper>

			<div className="buttons">
				<Button onClick={() => setIsOpen(false)} buttonStyle={ButtonStyle.underline}>
					<span>{useLocalize("cancel")}</span>
				</Button>
				<Button disabled={buttonDisabled} onClick={() => sendLogsHandler(comment)}>
					<span>{useLocalize("submit")}</span>
				</Button>
			</div>
		</fieldset>
	);
};

const UserDetails = styled((props: { className?: string; details: string }) => {
	const { className, details } = props;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ModalLayout
			className={className}
			trigger={
				<a>
					{useLocalize("whatWillBeSent")}
					<span style={{ whiteSpace: "nowrap", padding: 0 }} data-mdignore={true}>
						&#65279;
						<Icon className="linkIcon" code="external-link" />
					</span>
				</a>
			}
			onOpen={() => setIsOpen(true)}
			contentWidth="L"
			onClose={() => setIsOpen(false)}
			isOpen={isOpen}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{useLocalize("techDetails")}</legend>
						<div className={classNames("form-group", {}, ["code_wrapper"])}>
							<Fence lang="javascript" value={details} />
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
})`
	.code_wrapper {
		width: 100%;
		height: 60vh;
		overflow: scroll;
	}
`;

const CheckboxWrapper = styled.div`
	font-size: 14px;
	color: var(--color-article-heading-text);
	font-weight: 400;

	& > div {
		width: fit-content;
	}

	.checkbox__description {
		font-size: 12px;
		font-weight: 300;
		color: var(--color-text-main);

		a {
			font-weight: 300;
		}
	}
`;

export default BugsnagLogsModal;
