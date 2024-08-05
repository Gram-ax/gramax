import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SvgContainer from "@ext/markdown/core/edit/components/Menu/SvgContainer";
import { Editor } from "@tiptap/core";
import createDrawio from "../logic/createDrawio";

const DrawioMenuButton = ({ editor }: { editor: Editor }) => {
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<Button
			nodeValues={{ action: "drawio" }}
			tooltipText={t("diagram.names.drawio")}
			onClick={() => createDrawio(editor, articleProps, apiUrlCreator)}
		>
			<SvgContainer>
				<svg
					data-qa="qa-edit-menu-diagrams.net"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g clipPath="url(#clip0_2_16)">
						<path
							d="M14.6667 14.0974C14.6667 14.4191 14.4026 14.6667 14.0974 14.6667H1.90264C1.58086 14.6667 1.33333 14.4026 1.33333 14.0974V1.90264C1.33333 1.58086 1.59736 1.33333 1.90264 1.33333H14.0974C14.4191 1.33333 14.6667 1.59736 14.6667 1.90264V14.0974Z"
							fill="#F08705"
						/>
						<path
							d="M14.6667 14.0974C14.6667 14.4191 14.4026 14.6667 14.0974 14.6667H5.89604L3.23927 11.9686L4.88944 9.27063L9.79043 3.18152L14.6502 8.18977L14.6667 14.0974Z"
							fill="#DF6C0C"
						/>
						<path
							d="M12.2822 8.78383H10.8795L9.39439 6.25908C9.72442 6.19307 9.97195 5.89604 9.97195 5.54951V3.64356C9.97195 3.23927 9.65016 2.91749 9.24587 2.91749H6.77063C6.36634 2.91749 6.04455 3.23927 6.04455 3.64356V5.54951C6.04455 5.90429 6.29208 6.19307 6.61386 6.25908L5.12871 8.79208H3.72607C3.32178 8.79208 3 9.11386 3 9.51815V11.4241C3 11.8284 3.32178 12.1502 3.72607 12.1502H6.20132C6.60561 12.1502 6.92739 11.8284 6.92739 11.4241V9.51815C6.92739 9.11386 6.60561 8.79208 6.20132 8.79208H5.96205L7.43069 6.28383H8.57756L10.0545 8.79208H9.80693C9.40264 8.79208 9.08086 9.11386 9.08086 9.51815V11.4241C9.08086 11.8284 9.40264 12.1502 9.80693 12.1502H12.2822C12.6865 12.1502 13.0082 11.8284 13.0082 11.4241V9.51815C13.0082 9.11386 12.6865 8.78383 12.2822 8.78383Z"
							fill="white"
						/>
					</g>
					<defs>
						<clipPath id="clip0_2_16">
							<rect
								width="13.3333"
								height="13.3333"
								fill="white"
								transform="translate(1.33333 1.33333)"
							/>
						</clipPath>
					</defs>
				</svg>
			</SvgContainer>
		</Button>
	);
};

export default DrawioMenuButton;
