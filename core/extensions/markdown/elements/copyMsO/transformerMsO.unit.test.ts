import TransformerMsO from "@ext/markdown/elements/copyMsO/transfomerMsO";

describe("transformerMsO правильно трансформирует html", () => {
	const transformer = new TransformerMsO(null, null, false, null);
	const normalize = (str: string) => str.replace(/\s+/g, " ").trim();

	describe("вспомогательные функции", () => {
		test("getResourcePath", () => {
			expect(transformer.getResourcePath("file:///C:/Users/user/Downloads/1.png")).toBe(
				"C:/Users/user/Downloads/",
			);
		});
	});

	describe("lineBreakers", () => {
		test("lineBreakers", () => {
			const testHTML = `<html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class="MsoListParagraphCxSpFirst">
                        <b>Техническое задание на выбор системы Master Data Management (MDM) для ГК Ренна (FMCG сектор)<br></b><br>
                        <b>1. Общие сведения</b><br>
                        Название проекта: Выбор и внедрение системы Master Data Management (MDM) для
                        управления данными в компании FMCG-сектора.<o:p></o:p>
                    </p>
                </body>
            </html>`;
			const expectHTML =
				'<p class="MsoListParagraphCxSpFirst"> <b>Техническое задание на выбор системы Master Data Management (MDM) для ГК Ренна (FMCG сектор)</b></p><p></p><p> <b>1. Общие сведения</b></p><p> Название проекта: Выбор и внедрение системы Master Data Management (MDM) для управления данными в компании FMCG-сектора.<o:p></o:p> </p>';

			const html = transformer.parseFromHTML(testHTML);

			expect(normalize(html)).toBe(normalize(expectHTML));
		});
	});

	describe("список", () => {
		test("маркированный список", () => {
			const testHTML = `
                <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoListParagraphCxSpFirst style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l2 level1 lfo2'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Ejtkhrwjt<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level1 lfo2'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtlhrkjwtlrw<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level1 lfo2'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtbrhwkjjlrw<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level2 lfo2'><![if !supportLists]><span
                    style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
                    style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwjbthjrwkt<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level2 lfo2'><![if !supportLists]><span
                    style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
                    style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtjrwbjhbtkn<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level2 lfo2'><![if !supportLists]><span
                    style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
                    style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>Wrlgjrwhbkngfm<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l2 level3 lfo2'><![if !supportLists]><span
                    style='font-family:Wingdings;mso-fareast-font-family:Wingdings;mso-bidi-font-family:
                    Wingdings'><span style='mso-list:Ignore'>§<span style='font:7.0pt "Times New Roman"'>&nbsp;
                    </span></span></span><![endif]>Emngtkeg<o:p></o:p></p>
                    <p class=MsoListParagraphCxSpLast style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l2 level1 lfo2'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Lrjwbtjhgr sf gms<o:p></o:p></p>
                </body>
                </html>`;
			const expectHTML =
				'<ul><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Ejtkhrwjt<o:p></o:p></li><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Rwtlhrkjwtlrw<o:p></o:p></li><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Rwtbrhwkjjlrw<o:p></o:p></li><ul><li><span style="font-family:&quot;Courier New&quot;;mso-fareast-font-family:&quot;Courier New&quot;"><span style="mso-list:Ignore"></span></span>Rwjbthjrwkt<o:p></o:p></li><li><span style="font-family:&quot;Courier New&quot;;mso-fareast-font-family:&quot;Courier New&quot;"><span style="mso-list:Ignore"></span></span>Rwtjrwbjhbtkn<o:p></o:p></li><li><span style="font-family:&quot;Courier New&quot;;mso-fareast-font-family:&quot;Courier New&quot;"><span style="mso-list:Ignore"></span></span>Wrlgjrwhbkngfm<o:p></o:p></li><ul><li><span style="font-family:Wingdings;mso-fareast-font-family:Wingdings;mso-bidi-font-family: Wingdings"><span style="mso-list:Ignore"></span></span>Emngtkeg<o:p></o:p></li></ul></ul><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Lrjwbtjhgr sf gms<o:p></o:p></li></ul>';

			const html = transformer.parseFromHTML(testHTML);

			expect(normalize(html)).toBe(normalize(expectHTML));
		});

		test("нумерованный список", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoListParagraphCxSpFirst style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Ejtkhrwjt<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtlhrkjwtlrw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>3.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtbrhwkjjlrw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>a.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwjbthjrwkt<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>b.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtjrwbjhbtkn<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>c.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Wrlgjrwhbkngfm<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l0 level3 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>a.<span style='font:7.0pt "Times New Roman"'> </span></span></span><![endif]>Wrbjhfw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l0 level3 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>b.<span style='font:7.0pt "Times New Roman"'> </span></span></span><![endif]>Rwfhrkjnwf<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l0 level3 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>c.<span style='font:7.0pt "Times New Roman"'> </span></span></span><![endif]>wrljfhrkwjlfw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>d.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Emngtkeg<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpLast style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>4.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Lrjwbtjhgr sf gms<o:p></o:p></p>
                </body>
            </html>`;
			const expectHTML =
				'<ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Ejtkhrwjt<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtlhrkjwtlrw<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtbrhwkjjlrw<o:p></o:p></li><ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwjbthjrwkt<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtjrwbjhbtkn<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Wrlgjrwhbkngfm<o:p></o:p></li><ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Wrbjhfw<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwfhrkjnwf<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>wrljfhrkwjlfw<o:p></o:p></li></ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Emngtkeg<o:p></o:p></li></ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Lrjwbtjhgr sf gms<o:p></o:p></li></ol>';

			const html = transformer.parseFromHTML(testHTML);

			expect(normalize(html)).toBe(normalize(expectHTML));
		});

		test("смешанный список", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoListParagraphCxSpFirst style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Ejtkhrwjt<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtlhrkjwtlrw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.25in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>3.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtbrhwkjjlrw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>a.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwjbthjrwkt<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>b.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwtjrwbjhbtkn<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>c.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Wrlgjrwhbkngfm<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l1 level3 lfo1'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>Wrbjhfw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l1 level3 lfo1'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>Rwfhrkjnwf<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:1.5in;mso-add-space:
                    auto;text-indent:-9.0pt;mso-list:l1 level3 lfo1'><![if !supportLists]><span
                    style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
                    Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
                    </span></span></span><![endif]>wrljfhrkwjlfw<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpMiddle style='margin-left:.75in;mso-add-space:
                    auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>d.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>Emngtkeg<o:p></o:p></p>
                    
                    <p class=MsoListParagraphCxSpLast style='margin-left:.25in;mso-add-space:auto;
                    text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
                    style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
                    style='mso-list:Ignore'>4.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span></span></span><![endif]>qejrhqkejr<o:p></o:p></p>
                </body>
            </html>`;
			const expectHTML =
				'<ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Ejtkhrwjt<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtlhrkjwtlrw<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtbrhwkjjlrw<o:p></o:p></li><ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwjbthjrwkt<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Rwtjrwbjhbtkn<o:p></o:p></li><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Wrlgjrwhbkngfm<o:p></o:p></li><ul><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Wrbjhfw<o:p></o:p></li><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>Rwfhrkjnwf<o:p></o:p></li><li><span style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family: Symbol"><span style="mso-list:Ignore"></span></span>wrljfhrkwjlfw<o:p></o:p></li></ul><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>Emngtkeg<o:p></o:p></li></ol><li><span style="mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore"></span></span>qejrhqkejr<o:p></o:p></li></ol>';
			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});
	});

	describe("марки", () => {
		test("италик", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoNormal><i>aaa<o:p></o:p></i></p>
                </body>
            </html>`;
			const expectHTML = '<p class="MsoNormal"><i>aaa<o:p></o:p></i></p>';

			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});

		test("жирный", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoNormal><b>bbb<o:p></o:p></b></p>
                </body>
            </html>`;
			const expectHTML = '<p class="MsoNormal"><b>bbb<o:p></o:p></b></p>';

			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});

		test("ссылка", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoNormal><a href="https://www.youtube.com/watch?v=XXYlFuWEuKI">link</a><o:p></o:p></p>
                </body>
            </html>`;
			const expectHTML =
				'<p class="MsoNormal"><a href="https://www.youtube.com/watch?v=XXYlFuWEuKI">link</a><o:p></o:p></p>';

			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});
	});

	describe("блок без контента", () => {
		test("видео", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
                <body>
                    <p class=MsoNormal><span lang="us-US"><a
                    href="https://www.youtube.com/embed/MH7054uHjb8?start=449&amp;feature=oembed"><span
                    style='color:windowtext;mso-no-proof:yes;text-decoration:none;text-underline:
                    none'><v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75"
                    o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">
                    </span></a></span><o:p></o:p></p>
                </body>
            </html>`;
			const expectHTML =
				'<video-react-component path="https://www.youtube.com/embed/MH7054uHjb8?start=449&amp;feature=oembed" title=""></video-react-component>';

			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});
	});

	describe("блок с контентом", () => {
		test("таблица", () => {
			const testHTML = `
            <html xmlns:v="urn:schemas-microsoft-com:vml">
            <body>
                <table class=MsoTableGrid border=1 cellspacing=0 cellpadding=0
                style='border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt;
                mso-yfti-tbllook:1184;mso-padding-alt:0in 5.4pt 0in 5.4pt'>
                <tr style='mso-yfti-irow:0;mso-yfti-firstrow:yes'>
                <td width=312 colspan=2 valign=top style='width:233.7pt;border:solid windowtext 1.0pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 1<o:p></o:p></span></p>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 2<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border:solid windowtext 1.0pt;
                border-left:none;mso-border-left-alt:solid windowtext .5pt;mso-border-alt:
                solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 3<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border:solid windowtext 1.0pt;
                border-left:none;mso-border-left-alt:solid windowtext .5pt;mso-border-alt:
                solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 4<o:p></o:p></span></p>
                </td>
                </tr>
                <tr style='mso-yfti-irow:1'>
                <td width=156 valign=top style='width:116.8pt;border:solid windowtext 1.0pt;
                border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt;
                padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 5<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 6<o:p></o:p></span></p>
                </td>
                <td width=156 rowspan=2 valign=top style='width:116.9pt;border-top:none;
                border-left:none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тесто<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 7<o:p></o:p></span></p>
                </td>
                </tr>
                <tr style='mso-yfti-irow:2'>
                <td width=156 valign=top style='width:116.8pt;border:solid windowtext 1.0pt;
                border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt;
                padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 8<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 9<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 10<o:p></o:p></span></p>
                </td>
                </tr>
                <tr style='mso-yfti-irow:3;mso-yfti-lastrow:yes'>
                <td width=156 valign=top style='width:116.8pt;border:solid windowtext 1.0pt;
                border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt;
                padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 11<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 12<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 13<o:p></o:p></span></p>
                </td>
                <td width=156 valign=top style='width:116.9pt;border-top:none;border-left:
                none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt;
                mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt;
                mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt'>
                <p class=MsoNormal style='margin-bottom:0in;line-height:normal'><span
                lang=RU style='mso-ansi-language:RU'>Тест 14<o:p></o:p></span></p>
                </td>
                </tr>
                </table>
            </body>
            </html>`;
			const expectHTML =
				'<table class="MsoTableGrid" border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt; mso-yfti-tbllook:1184;mso-padding-alt:0in 5.4pt 0in 5.4pt"> <tbody><tr style="mso-yfti-irow:0;mso-yfti-firstrow:yes"> <td width="312" colspan="2" valign="top" style="width:233.7pt;border:solid windowtext 1.0pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 1<o:p></o:p></span></p> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 2<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border:solid windowtext 1.0pt; border-left:none;mso-border-left-alt:solid windowtext .5pt;mso-border-alt: solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 3<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border:solid windowtext 1.0pt; border-left:none;mso-border-left-alt:solid windowtext .5pt;mso-border-alt: solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 4<o:p></o:p></span></p> </td> </tr> <tr style="mso-yfti-irow:1"> <td width="156" valign="top" style="width:116.8pt;border:solid windowtext 1.0pt; border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt; padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 5<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 6<o:p></o:p></span></p> </td> <td width="156" rowspan="2" valign="top" style="width:116.9pt;border-top:none; border-left:none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тесто<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 7<o:p></o:p></span></p> </td> </tr> <tr style="mso-yfti-irow:2"> <td width="156" valign="top" style="width:116.8pt;border:solid windowtext 1.0pt; border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt; padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 8<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 9<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 10<o:p></o:p></span></p> </td> </tr> <tr style="mso-yfti-irow:3;mso-yfti-lastrow:yes"> <td width="156" valign="top" style="width:116.8pt;border:solid windowtext 1.0pt; border-top:none;mso-border-top-alt:solid windowtext .5pt;mso-border-alt:solid windowtext .5pt; padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 11<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 12<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 13<o:p></o:p></span></p> </td> <td width="156" valign="top" style="width:116.9pt;border-top:none;border-left: none;border-bottom:solid windowtext 1.0pt;border-right:solid windowtext 1.0pt; mso-border-top-alt:solid windowtext .5pt;mso-border-left-alt:solid windowtext .5pt; mso-border-alt:solid windowtext .5pt;padding:0in 5.4pt 0in 5.4pt"> <p class="MsoNormal" style="margin-bottom:0in;line-height:normal"><span lang="RU" style="mso-ansi-language:RU">Тест 14<o:p></o:p></span></p> </td> </tr> </tbody></table>';

			const html = transformer.parseFromHTML(testHTML);
			expect(normalize(html)).toBe(normalize(expectHTML));
		});
	});

	test("tr height=0", () => {
		const testHTML = `<html xmlns:v="urn:schemas-microsoft-com:vml"><body><table class="MsoNormalTable" border="1" cellspacing="0" cellpadding="0" width="100%" style="width:100.0%;border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt;mso-padding-alt:0cm 3.5pt 0cm 3.5pt;mso-border-insideh:.5pt solid windowtext;mso-border-insidev:.5pt solid windowtext"><tbody></tr><!--[if !supportMisalignedColumns]--><tr height="0"><td width="157" style="border:none"></td><td width="157" style="border:none"></td><td width="629" style="border:none"></td></tr><!--[endif]--></tbody></table></tr></body></html>`;
		const html = transformer.parseFromHTML(testHTML);
		expect(html).toBe(
			'<table class="MsoNormalTable" border="1" cellspacing="0" cellpadding="0" width="100%" style="width:100.0%;border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt;mso-padding-alt:0cm 3.5pt 0cm 3.5pt;mso-border-insideh:.5pt solid windowtext;mso-border-insidev:.5pt solid windowtext"><tbody><!--[if !supportMisalignedColumns]--><!--[endif]--></tbody></table>',
		);
	});
});
