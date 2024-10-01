# language: ru
Функция: Ссылки

  Сценарий: Видео с оригинальным языком
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <p class=MsoNormal><a
            href="https://www.youtube.com/embed/MH7054uHjb8?start=449&amp;feature=oembed"><span
            style='color:windowtext;mso-no-proof:yes;text-decoration:none;text-underline:
            none'><v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75"
            o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">
            <v:stroke joinstyle="miter"/>
            <v:formulas>
            <v:f eqn="if lineDrawn pixelLineWidth 0"/>
            <v:f eqn="sum @0 1 0"/>
            <v:f eqn="sum 0 0 @1"/>
            <v:f eqn="prod @2 1 2"/>
            <v:f eqn="prod @3 21600 pixelWidth"/>
            <v:f eqn="prod @3 21600 pixelHeight"/>
            <v:f eqn="sum @0 0 1"/>
            <v:f eqn="prod @6 1 2"/>
            <v:f eqn="prod @7 21600 pixelWidth"/>
            <v:f eqn="sum @8 21600 0"/>
            <v:f eqn="prod @7 21600 pixelHeight"/>
            <v:f eqn="sum @10 21600 0"/>
            </v:formulas>
            <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
            <o:lock v:ext="edit" aspectratio="t"/>
            </v:shapetype><v:shape id="Video_x0020_2" o:spid="_x0000_i1025" type="#_x0000_t75"
            alt="Наслаждаться моментом [GTA 5 RP]"
            href="https://www.youtube.com/embed/MH7054uHjb8?start=449&amp;feature=oembed"
            style='width:5in;height:270pt;visibility:visible;mso-wrap-style:square'
            o:button="t">
            <v:fill o:detectmouseclick="t"/>
            <v:imagedata src="file:///C:/Users/NIKITA~1.VOR/AppData/Local/Temp/msohtmlclip1/01/clip_image001.jpg"
            o:title="Наслаждаться моментом [GTA 5 RP]"/>
            </v:shape></span></a><o:p></o:p></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      [video:https://www.youtube.com/embed/MH7054uHjb8?start=449&feature=oembed:]
      """

  Сценарий: Видео с другим языком
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <p class=MsoNormal><span lang="us-US"><a
            href="https://www.youtube.com/embed/MH7054uHjb8?start=449&amp;feature=oembed"><span
            style='color:windowtext;mso-no-proof:yes;text-decoration:none;text-underline:
            none'><v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75"
            o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">
           </span></a></span><o:p></o:p></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      [video:https://www.youtube.com/embed/MH7054uHjb8?start=449&feature=oembed:]
      """
