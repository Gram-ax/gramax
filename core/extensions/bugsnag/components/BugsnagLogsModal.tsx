import Checkbox from "@components/Atoms/Checkbox";
import TextArea from "@components/Atoms/TextArea";
import FormStyle from "@components/Form/FormStyle";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { classNames } from "@components/libs/classNames";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PageDataContext from "@core/Context/PageDataContext";
import parseContent from "@ext/bugsnag/logic/parseContent";
import sendBug from "@ext/bugsnag/logic/sendBug";
import useLocalize from "@ext/localization/useLocalize";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import React, { useState, useEffect, useCallback } from "react";
import ModalLayout from "@components/Layouts/Modal";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import styled from "@emotion/styled";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { Editor } from "@tiptap/core";

const getDetails = (props: { editor: Editor; context: PageDataContext }) => {
	const { editor, context } = props;

	const replacedArticle = parseContent(editor.getJSON());
	const gitLogs = PersistentLogger.getLogs(/git/, 100);
	const conf = { branch: context.conf?.branch, version: context.conf?.version };

	return { context: { ...context, sourceDatas: null, userInfo: null, conf }, replacedArticle, gitLogs };
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
	const [buttonDisabled, setButtonButtonDisabled] = useState(true);
	const [checked, setChecked] = useState(true);
	const [comment, setComment] = useState("");
	const [isWrongText, setIsWrongText] = useState(false);
	const requiredParameterText = useLocalize("requiredParameter");

	const data = PageDataContextService.value;
	const editor = EditorService.getEditor();

	const sendLogsHandler = useCallback(
		(comment) => {
			const logs = { comment, ...getDetails({ editor, context: data }) };

			void sendBug(new Error("Пользовательская ошибка"), (e) => e.addMetadata("props", logs));
			setIsOpen(false);
		},
		[checked],
	);

	useEffect(() => {
		if (Boolean(comment) && checked) setButtonButtonDisabled(false);
		else setButtonButtonDisabled(true);
	}, [checked, comment, isWrongText]);

	const textAreaBlurHandler = () => {
		const voidComment = !comment;

		setIsWrongText(voidComment);
	};

	return (
		<>
			<legend>{useLocalize("bugReport")}</legend>

			<div className="form-group">
				<div className="field field-string row">
					<label className="control-label">
						<span>{useLocalize("commitMessage")}</span>
						<span className="required">*</span>
					</label>

					<div className="input-lable">
						<TextArea
							onChange={(e) => setComment(e.target.value)}
							placeholder={useLocalize("specifyDetails")}
							className="customer__text"
							onFocus={() => setIsWrongText(false)}
							onBlur={textAreaBlurHandler}
							value={comment}
							style={{ height: "100px" }}
							errorText={requiredParameterText}
							showError={isWrongText}
						/>
					</div>
				</div>
			</div>

			<CheckboxWrapper className={classNames("form-group", {}, [className])}>
				<div>
					<Checkbox checked={checked} onClick={() => setChecked((prev) => !prev)}>
						<span>{useLocalize("sendTechDetails")}</span>
						<span className="required">*</span>
					</Checkbox>
				</div>

				<div className="checkbox__description">
					<span>{useLocalize("descriptionTechDetails")}</span>
				</div>
			</CheckboxWrapper>

			<div className="buttons">
				<Button onClick={() => setIsOpen(false)} buttonStyle={ButtonStyle.underline}>
					<span>{useLocalize("cancel")}</span>
				</Button>
				<Button disabled={buttonDisabled} onClick={() => sendLogsHandler(comment)}>
					<span>{useLocalize("send")}</span>
				</Button>
			</div>
		</>
	);
};

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
	}
`;

export default BugsnagLogsModal;
