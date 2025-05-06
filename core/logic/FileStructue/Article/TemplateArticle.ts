import { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import { UpdateItemProps } from "@core/FileStructue/Item/Item";

export type TemplateField = {
	name: string;
	value: string;
};

export type TemplateProps = ArticleProps & {
	fields: TemplateField[];
	logicPath?: string;
	fileName?: string;
};

export const TemplatePropsKeys = ["fields"];

export class TemplateArticle<P extends TemplateProps = TemplateProps> extends Article<P> {
	get content() {
		const mutableContent = { content: this._content };
		this.events.emitSync("item-get-content", { item: this, mutableContent });

		if (mutableContent.content) {
			mutableContent.content = this._combineFieldsContent(mutableContent.content);
		}

		return mutableContent.content || "\n\n";
	}

	private _combineFieldsContent(content: string) {
		const fields = this._props?.fields;
		if (!fields) return content;

		return fields.reduce((acc, field) => {
			const blockRegex = new RegExp(
				`\\[block-field:${field.name}:([^\\]]*?)\\]([\\s\\S]*?)\\[\\/block-field\\]`,
				"g",
			);

			return acc.replace(
				blockRegex,
				(_, placeholder) => `[block-field:${field.name}:${placeholder}]\n${field.value}\n[/block-field]`,
			);
		}, content);
	}

	protected override _updateProps(props: UpdateItemProps) {
		super._updateProps(props, TemplatePropsKeys);
	}

	override async _save(renamed?: boolean) {
		const mutable = { content: this._content, props: this._props };
		await this.events.emit("item-pre-save", { mutable });
		this._content = mutable.content;
		this._props = mutable.props;

		return super._save(renamed);
	}
}
