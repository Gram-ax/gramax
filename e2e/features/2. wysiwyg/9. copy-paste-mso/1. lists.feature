# language: ru
Функция: Списки

  Сценарий: Вставка маркированного списка
    Пусть находимся в новой статье
    И смотрим на редактор
    Когда вставляем html
      """
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
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      -  Ejtkhrwjt
      
      -  Rwtlhrkjwtlrw
      
      -  Rwtbrhwkjjlrw
      
         -  Rwjbthjrwkt
      
         -  Rwtjrwbjhbtkn
      
         -  Wrlgjrwhbkngfm
      
            -  Emngtkeg
      
      -  Lrjwbtjhgr sf gms
      """

  Сценарий: Вставка нумерованного списка
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
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
      </html>
      """
    Тогда разметка текущей статьи содержит
      """
      1. Ejtkhrwjt
      
      2. Rwtlhrkjwtlrw
      
      3. Rwtbrhwkjjlrw
      
         1. Rwjbthjrwkt
      
         2. Rwtjrwbjhbtkn
      
         3. Wrlgjrwhbkngfm
      
            1. Wrbjhfw
      
            2. Rwfhrkjnwf
      
            3. wrljfhrkwjlfw
      
         4. Emngtkeg
      
      4. Lrjwbtjhgr sf gms
      """

  Сценарий: Вставка списка с разными типами
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
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
      </html>
      """
    Тогда разметка текущей статьи содержит
      """
      1. Ejtkhrwjt
      
      2. Rwtlhrkjwtlrw
      
      3. Rwtbrhwkjjlrw
      
         1. Rwjbthjrwkt
      
         2. Rwtjrwbjhbtkn
      
         3. Wrlgjrwhbkngfm
      
            -  Wrbjhfw
      
            -  Rwfhrkjnwf
      
            -  wrljfhrkwjlfw
      
         4. Emngtkeg
      
      4. qejrhqkejr
      """

  Сценарий: Вставка списка с lang
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
      <html xmlns:v="urn:schemas-microsoft-com:vml">
        <body>
          <p class=MsoListParagraphCxSpFirst style='margin-left:18.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span
          style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
          Symbol;mso-bidi-font-weight:bold'><span style='mso-list:Ignore'>·<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><b><span
          lang=EN-US style='mso-ansi-language:EN-US'>Test1</span><o:p></o:p></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:18.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span
          style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
          Symbol;mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span
          style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span></span></span><![endif]><i><span lang=EN-US style='mso-ansi-language:
          EN-US'>Test2</span><b><o:p></o:p></b></i></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:18.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span
          style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
          Symbol;mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span
          style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span></span></span><![endif]><span lang=EN-US style='mso-ansi-language:EN-US'>Test3</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:54.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
          style='font-family:"Courier New";mso-fareast-font-family:"Courier New";
          mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span style='mso-list:
          Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]><span
          lang=EN-US style='mso-ansi-language:EN-US'>Test4</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:54.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
          style='font-family:"Courier New";mso-fareast-font-family:"Courier New";
          mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span style='mso-list:
          Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]><span
          lang=EN-US style='mso-ansi-language:EN-US'>Test5</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:54.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
          style='font-family:"Courier New";mso-fareast-font-family:"Courier New";
          mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span style='mso-list:
          Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]><span
          lang=EN-US style='mso-ansi-language:EN-US'>Test6</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:90.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l1 level3 lfo1'><![if !supportLists]><span
          style='mso-bidi-font-family:Calibri;mso-bidi-theme-font:minor-latin'><span
          style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span></span></span><![endif]><span lang=EN-US style='mso-ansi-language:EN-US'>Abobus</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpMiddle style='margin-left:54.0pt;mso-add-space:
          auto;text-indent:-18.0pt;mso-list:l0 level2 lfo1'><![if !supportLists]><span
          style='font-family:"Courier New";mso-fareast-font-family:"Courier New";
          mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span style='mso-list:
          Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]><span
          lang=EN-US style='mso-ansi-language:EN-US'>Amogus</span><b><i><o:p></o:p></i></b></p>
          <p class=MsoListParagraphCxSpLast style='margin-left:18.0pt;mso-add-space:auto;
          text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span
          style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:
          Symbol;mso-bidi-font-weight:bold;mso-bidi-font-style:italic'><span
          style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span></span></span><![endif]><span lang=EN-US style='mso-ansi-language:EN-US'>No
          test</span><b><i><o:p></o:p></i></b></p>
        </body>
      </html>
      """
    Тогда разметка текущей статьи содержит
      """
      -  **Test1**
      
      -  *Test2*
      
      -  Test3
      
         -  Test4
      
         -  Test5
      
         -  Test6
      
            1. Abobus
      
         -  Amogus
      
      -  No test
      """

  Сценарий: Вставка списка без класса списка
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
      <html xmlns:v="urn:schemas-microsoft-com:vml">
        <body>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level1 lfo1;
          tab-stops:list .25in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>1.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Ejtkhrwjt<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level1 lfo1;
          tab-stops:list .25in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>2.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Rwtlhrkjwtlrw<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level1 lfo1;
          tab-stops:list .25in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>3.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Rwtbrhwkjjlrw<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.75in;text-indent:-.25in;line-height:normal;mso-list:l0 level2 lfo1;
          tab-stops:list .75in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>1.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Rwjbthjrwkt<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.75in;text-indent:-.25in;line-height:normal;mso-list:l0 level2 lfo1;
          tab-stops:list .75in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>2.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Rwtjrwbjhbtkn<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.75in;text-indent:-.25in;line-height:normal;mso-list:l0 level2 lfo1;
          tab-stops:list .75in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>3.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Wrlgjrwhbkngfm<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:1.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level3 lfo1;
          tab-stops:list 1.25in'><![if !supportLists]><span style='font-size:10.0pt;
          mso-bidi-font-size:12.0pt;font-family:Wingdings;mso-fareast-font-family:Wingdings;
          mso-bidi-font-family:Wingdings;mso-fareast-language:RU'><span style='mso-list:
          Ignore'>§<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Wrbjhfw<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:1.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level3 lfo1;
          tab-stops:list 1.25in'><![if !supportLists]><span style='font-size:10.0pt;
          mso-bidi-font-size:12.0pt;font-family:Wingdings;mso-fareast-font-family:Wingdings;
          mso-bidi-font-family:Wingdings;mso-fareast-language:RU'><span style='mso-list:
          Ignore'>§<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Rwfhrkjnwf<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:1.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level3 lfo1;
          tab-stops:list 1.25in'><![if !supportLists]><span style='font-size:10.0pt;
          mso-bidi-font-size:12.0pt;font-family:Wingdings;mso-fareast-font-family:Wingdings;
          mso-bidi-font-family:Wingdings;mso-fareast-language:RU'><span style='mso-list:
          Ignore'>§<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>wrljfhrkwjlfw<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.75in;text-indent:-.25in;line-height:normal;mso-list:l0 level2 lfo1;
          tab-stops:list .75in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>4.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>Emngtkeg<o:p></o:p></span></p>
          <p class=MsoNormal style='mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;
          margin-left:.25in;text-indent:-.25in;line-height:normal;mso-list:l0 level1 lfo1;
          tab-stops:list .25in'><![if !supportLists]><span style='font-size:12.0pt;
          font-family:"Times New Roman",serif;mso-fareast-font-family:"Times New Roman";
          mso-fareast-language:RU'><span style='mso-list:Ignore'>4.<span
          style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span><![endif]><span
          style='font-size:12.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
          "Times New Roman";mso-fareast-language:RU'>qejrhqkejr<o:p></o:p></span></p>
        </body>
      </html>
      """
    Тогда разметка текущей статьи содержит
      """
      1. Ejtkhrwjt
      
      2. Rwtlhrkjwtlrw
      
      3. Rwtbrhwkjjlrw
      
         1. Rwjbthjrwkt
      
         2. Rwtjrwbjhbtkn
      
         3. Wrlgjrwhbkngfm
      
            -  Wrbjhfw
      
            -  Rwfhrkjnwf
      
            -  wrljfhrkwjlfw
      
         4. Emngtkeg
      
      4. qejrhqkejr
      """
