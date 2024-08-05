# language: ru
Функция: Заголовки

  Сценарий: Превратить параграф в заголовок при помощи хоткея
    Пусть смотрим на редактор
    И заполняем документ
      """
      text(*)
      
      text
      """
    Когда нажимаем на клавиши "Control+Alt+2"
    Тогда разметка текущей статьи содержит
      """
      ## text
      
      text
      """

  Сценарий: Нажатие Enter внутри заголовка
    Пусть смотрим на редактор
    И заполняем документ
      """
      ## te(*)xt
      """
    И нажимаем на клавишу "Enter"
    Тогда разметка текущей статьи содержит
      """
      ## te
      
      xt
      """
    И очищаем документ

  Сценарий: Нажатие Enter вначале заголовка
    Пусть смотрим на редактор
    И заполняем документ
      """
      ## (*)text
      """
    Когда нажимаем на клавишу "Enter"
    Тогда разметка текущей статьи содержит
      """
      
      
      ## text
      """
    И очищаем документ

  Сценарий: Переход из статьи в заголовок и обратно
    Пусть смотрим на редактор заголовка
    И вводим "Привет World"
    Тогда находимся по адресу "/-/-/-/-/new-catalog/privet-world"
    Когда заново смотрим на редактор
    И нажимаем на клавишу "ArrowDown"
    И вводим "пока мир"
    Тогда разметка текущей статьи содержит
      """
      пока мир
      """