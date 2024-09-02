import Icon from "@components/Atoms/Icon";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import t from "@ext/localization/locale/translate";
import Form from "@rjsf/core";
import { ReactElement, useState } from "react";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import fnProperties from "../logic/fnProperties";

const Fn = ({ code, defaultValues }: { code: string; defaultValues?: string }): ReactElement => {
	const fnProps = fnProperties?.[code] ?? {};
	const outputJsonSchema = fnProps?.jsonSchemas?.output ?? null;
	const inputJsonSchema = fnProps?.jsonSchemas?.input ?? null;
	const isOnChange = fnProps?.isOnChange ?? null;
	const func = fnProps?.func ?? null;

	const [start, setStart] = useState(true);
	if (defaultValues && inputJsonSchema && start) {
		const arrDefaultValues = defaultValues.split(":");
		const propsKeys = Object.keys(inputJsonSchema.properties);
		for (let i = 0; i < propsKeys.length; i++)
			inputJsonSchema.properties[propsKeys[i]]["default"] = arrDefaultValues[i];
	}

	const [response, setResponse] = useState<{ [key: string]: any }>(
		func
			? func(Object.keys(inputJsonSchema.properties).map((key) => inputJsonSchema.properties[key]["default"]))
			: null,
	);

	const resetResponse = (value: any) => {
		setStart(false);
		setResponse(func(value.formData));
		Object.keys(inputJsonSchema.properties).forEach((key) => {
			inputJsonSchema.properties[key]["default"] = value.formData[key];
		});
	};

	if (!func) return <span>{t("no-such-function")}</span>;

	return (
		<ModalLayout
			trigger={
				<kbd className="active">
					<Icon code="square-function" />
					<span>{inputJsonSchema.title}</span>
				</kbd>
			}
		>
			<div className={`scheme-form ${fnProperties?.[code]?.isOnChange ?? false ? "none-submit" : ""}  modal`}>
				<ModalLayoutLight className="block-elevation-3">
					<div className="form">
						<Form
							schema={inputJsonSchema}
							onSubmit={resetResponse}
							onChange={(value: any) => {
								if (isOnChange) resetResponse(value);
							}}
							className="article global"
						/>
					</div>
				</ModalLayoutLight>
				<div className="article bottom-content res">
					<div className="absolute-bg" />
					<p className="field-description">{outputJsonSchema?.description}</p>
					<div className="fields small-code">
						{Object.keys(response).map((key, idx) => (
							<div key={idx}>
								<label className="control-label">
									{outputJsonSchema?.properties[key]?.description}
								</label>
								<div className="field">
									<CodeBlock
										lang={"json"}
										value={
											typeof response[key] === "string"
												? response[key]
												: JSON.stringify(response[key])
										}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};

export default Fn;
