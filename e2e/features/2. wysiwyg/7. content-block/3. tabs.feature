# language: ru
Функция: Вкладки

  Сценарий: Создание статьи
    Пусть находимся в новой статье
    И смотрим на редактор
    Когда нажимаем на клавиши "Control+A Backspace"
    Тогда разметка текущей статьи ничего не содержит

  Сценарий: Создаем вкладку
    Пусть смотрим на редактор
    И заново смотрим на редактор
    Когда нажимаем на иконку редактора "карандаш с линейкой"
    И смотрим на подсказку
    И нажимаем на иконку "вкладка"
    И вводим "абра кадабра"
    И нажимаем на клавиши "ArrowUp Control+Shift+ArrowLeft"
    И вводим "крутая вкладка"
    Тогда разметка текущей статьи содержит
      """
      <tabs>
      
      <tab name="крутая вкладка">
      
      абра кадабра
      
      </tab>
      
      </tabs>
      """

  Сценарий: Наполняем вкладку
    Пусть смотрим на редактор
    Когда нажимаем на элемент "добавление вкладки"
    И вводим "абра кадабра 2"
    Тогда разметка текущей статьи содержит
      """
      <tabs>

      <tab name="крутая вкладка">
      
      абра кадабра
      
      </tab>
      
      <tab name="Вкладка">
      
      абра кадабра 2
      
      </tab>
      
      </tabs>
      """

  Сценарий: Удаление содержимого вкладки
    Пусть смотрим на редактор
    И заполняем документ
      """
      [tabs]
      
      [tab:крутая вкладка]
      
      абра кадабра
      
      :::note
      
      заклинаю на прохождение теста
      
      йуху(*)
      
      :::
      
      [/tab]
      
      [tab:Вкладка]
      
      абра кадабра 2
      
      [/tab]
      
      [/tabs]
      """
    Когда нажимаем на клавиши "Control+Shift+ArrowLeft Shift+ArrowUp Shift+ArrowUp Shift+ArrowUp Backspace"
    Тогда разметка текущей статьи содержит
      """
      <tabs>

      <tab name="крутая вкладка">
      
      
      
      </tab>
      
      <tab name="Вкладка">
      
      абра кадабра 2
      
      </tab>
      
      </tabs>
      """

  Сценарий: Удаляем вкладку
    Пусть смотрим на редактор
    Когда нажимаем на клавишу "ArrowUp ArrowUp Control+Backspace"
    И наводимся и нажимаем на элемент "удаление вкладки"
    И наводимся и нажимаем на элемент "удаление вкладки"
    Тогда разметка текущей статьи ничего не содержит

  Сценарий: Enter в списке

  Сценарий: Удаление содержимого вкладки
    Пусть смотрим на редактор
    Когда заполняем документ
      """
      [tabs]
      
      [tab:крутая вкладка]
      
      (*)
      
      [/tab]
      
      [/tabs]
      """
    И нажимаем на клавиши "Control+Shift+8"
    И вводим "AMOGUS"
    И нажимаем на клавишу "Enter"
    Тогда разметка текущей статьи содержит
      """
      <tabs>

      <tab name="крутая вкладка">
      
      -  AMOGUS
      
      -   
      
      </tab>
      
      </tabs>
      """
    Когда нажимаем на клавишу "Enter Enter"
    Тогда разметка текущей статьи содержит
      """
      <tabs>

      <tab name="крутая вкладка">
      
      -  AMOGUS
      
      </tab>
      
      </tabs>
      
      
      
      """
    И очищаем документ

  Сценарий: Вставка HTML вкладки
    Пусть смотрим на редактор
    И вставляем html
      """
      <meta charset='utf-8'>
      <div xmlns="http://www.w3.org/1999/xhtml">
        <p>test start</p>
        <tabs-react-component childattrs="[{&quot;name&quot;:&quot;test1&quot;,&quot;idx&quot;:0},{&quot;name&quot;:&quot;test2&quot;,&quot;idx&quot;:1},{&quot;name&quot;:&quot;test3&quot;,&quot;idx&quot;:2}]">
          <tab-react-component name="Вкладка" idx="0"><p>1</p></tab-react-component>
          <tab-react-component name="Вкладка" idx="1"><p>2</p></tab-react-component>
          <tab-react-component name="Вкладка" idx="2"><p>3</p></tab-react-component>
        </tabs-react-component>
        <p>test end</p>
      </div>
      """
    Тогда разметка текущей статьи содержит
      """
      test start
      
      <tabs>

      <tab name="test1">
      
      1
      
      </tab>
      
      <tab name="test2">
      
      2
      
      </tab>
      
      <tab name="test3">
      
      3
      
      </tab>
      
      </tabs>
      
      test end
      """
