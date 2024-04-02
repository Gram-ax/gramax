import ItemInput from "@components/Form/InputItem";
import { Validate } from "@components/Form/ValidateObject";
import { JSONSchema7 } from "json-schema";
import { ReactNode } from "react";

interface FieldProps {
	scheme: JSONSchema7;
	value?: string | string[] | boolean;
	tabIndex?: number;
	required?: boolean;
	isFocused?: boolean;
	fieldDirection?: "row" | "column";
	validate?: Validate;
	input?: ReactNode;
	onFocus?: () => void;
	onChange?: (v: string | string[]) => void;
}

const Field = (props: FieldProps) => {
	const { required = false, isFocused = false, fieldDirection = "row" } = props;
	const { scheme, value, tabIndex, validate, input } = props;
	const { onChange, onFocus } = props;

	const isCheckbox = scheme.type == "boolean";

	if (typeof scheme === "string") {
		if (scheme === "separator") return <div className="separator" />;
		return <h3>{scheme}</h3>;
	}

	return (
		<div className="form-group">
			<div className={`field field-string ${fieldDirection}`}>
				{!isCheckbox && (
					<label className="control-label">
						<div style={{ display: "flex" }}>
							<span dangerouslySetInnerHTML={{ __html: scheme?.title }} />
							{required && <span className="required">*</span>}
						</div>
					</label>
				)}
				<div className={`input-lable ${isCheckbox ? "fill-width" : ""}`}>
					{input ? (
						input
					) : (
						<ItemInput
							scheme={scheme}
							tabIndex={tabIndex}
							focus={tabIndex == 1}
							validate={validate}
							showErrorText={isFocused}
							value={value}
							onChange={onChange}
							onFocus={onFocus}
						/>
					)}
				</div>
			</div>
			{scheme.description && (
				<div className={`input-lable-description ${isCheckbox ? "full-width" : ""}`}>
					{!isCheckbox && <div />}
					<div className="article" dangerouslySetInnerHTML={{ __html: scheme.description }} />
				</div>
			)}
		</div>
	);
};

export default Field;
