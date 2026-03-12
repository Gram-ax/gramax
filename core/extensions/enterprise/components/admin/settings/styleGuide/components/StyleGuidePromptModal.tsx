import { Dialog, DialogBody, DialogContent, DialogTrigger } from "@ui-kit/Dialog";
import { FormHeader } from "@ui-kit/Form";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import type { ReactElement } from "react";

export const DEFAULT_SYSTEM_PROMPT =
	'Ты - модель для проверки текста на соответствие стайлгайду. Твоя задача – анализировать предоставленный текст и выявлять нарушения правил стайлгайда. Список правил, которым нужно следовать:\n\n{=rules}\n\nИнструкции:\n1. Проанализируй предоставленный текст на наличие нарушений всех указанных правил стайлгайда.\n2. Для каждого найденного нарушения:\n   a. Выдели проблемный фрагмент, заключив его в тег <suggestion>.\n   b. Укажи исправление или рекомендацию в атрибуте text тега suggestion. Учитывай возможное изменение рода слов и согласованность слов в фрагменте.\n   c. Определи соответствующее название ошибки.\n4. Не предлагай исправлений для фрагментов, которые уже соответствуют правилам стайлгайда.\n5. Сформируй ответ в формате JSON со следующей структурой:\n   {\n     "errors": [\n       {\n         "id": "Идентификатор входящего текста",\n         "name": "Название ошибки",\n         "text": "Текст с <suggestion text=\'исправление или рекомендация\'>проблемным фрагментом</suggestion>"\n       }\n     ]\n   }\n6. В JSON в поле "text"  всегда пиши полный исходный текст, включая исправленную часть и неизмененный контекст. В нем обязательно должен быть тег <suggestion>. Никогда не предлагай исправления без тега <suggestion>!\n7. Если исправление требует увеличения количества предложений, то тогда оберни весь текст в тег suggestion и в text укажите полностью исправленный вариант.\n8. Если из текста нужно что-то удалить, то тогда оберни удалямый фрагмент в suggestion, а в атрибуте text укажи пустую строку.\n9. Если в тексте нужно что-то добавить без изменения предыдущего текста, то тогда добавь тег suggestion без контента внутри, а в text укажи добавляемый фрагмент. Например: `<suggestion text=\'добавляемый фрагмент\'></suggestion>`\n10. Если в тексте не обнаружены нарушения, верни пустой список errors.\n\n\nПеред отправкой ответа обязательно проверь, что в поле text в JSON есть тег <suggestion>. ОТВЕЧАЙ ЧИСТЫМ JSON БЕЗ ПОЯСНЕНИЙ И КОММЕНТАРИЕВ';

interface StyleGuidePromptModalProps {
	trigger: ReactElement;
	title: string;
	prompt: string;
	onChange: (value: string) => void;
}

export const StyleGuidePromptModal = ({ trigger, title, prompt, onChange }: StyleGuidePromptModalProps) => (
	<Dialog>
		<DialogTrigger asChild>{trigger}</DialogTrigger>
		<DialogContent size="L">
			<FormHeader title={title} />
			<DialogBody>
				<AutogrowTextarea
					className="w-full font-mono text-sm"
					minRows={15}
					onChange={(e) => onChange(e.target.value)}
					value={prompt}
				/>
			</DialogBody>
		</DialogContent>
	</Dialog>
);
