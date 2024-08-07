# language: ru
Функция: Нумерованный список

  Сценарий: Создать в статье нумерованный список с помощью "Control+Shift+7"
    Пусть смотрим на редактор
    И очищаем документ
    Когда нажимаем на клавиши "Control+Shift+7"
    И вводим "test"
    Тогда разметка текущей статьи содержит
      """
      1. test(*)
      """

  Сценарий: Создать в статье  нумерованный список с помощью "1."
    Пусть смотрим на редактор
    И очищаем документ
    Когда вводим "1."
    И нажимаем на клавишу "Space"
    И вводим "text"
    Тогда разметка текущей статьи содержит
      """
      1. text(*)
      """

  Сценарий: Создать в статье  нумерованный список с помощью "нумерованный_список"
    Пусть смотрим на редактор
    И очищаем документ
    Когда нажимаем на иконку редактора "нумерованный список"
    И вводим "text"
    Тогда разметка текущей статьи содержит
      """
      1. text(*)
      """

  Сценарий: добавить пункты в нумерованном списке после пустой строки
    Пусть смотрим на редактор
    И заполняем документ
      """
      1. text
      
      (*)
      """
    Когда вводим "2."
    И нажимаем на клавиши "Space"
    И вводим "text"
    Тогда разметка текущей статьи содержит
      """
      1. text
      
      2. text(*)
      """

  Сценарий: изменить маркированный список на нумерованный
    Пусть смотрим на редактор
    И заполняем документ
      """
      -  text
      
      -  text(*)
      
          -  text
      """
    Когда нажимаем на клавиши "Control+Shift+7"
    Тогда разметка текущей статьи содержит
      """
      1. text
      
      2. text(*)
      
         -  text
      """

  Сценарий: разделить на части нумерованный список с помощью "Control+Shift+7"
    Пусть смотрим на редактор
    И заполняем документ
      """
      1. apple
      
      2. test(*)
      
         1. text
      """
    Когда нажимаем на клавиши "Control+Shift+7"
    Тогда разметка текущей статьи содержит
      """
      1. apple
      
      test(*)
      
      1. text
      """

  Сценарий: разделить на части нумерованный список с помощью "нумерованный_список"
    Пусть смотрим на редактор
    И заполняем документ
      """
      1. text
      
      2. orange(*)
      
         1. text
      """
    Когда нажимаем на иконку редактора "нумерованный список"
    Тогда разметка текущей статьи содержит
      """
      1. text
      
      orange(*)
      
      1. text
      """

  Сценарий: вложенный нумерованный список поместить на уровень выше с помощью "Control+Shift+7"
    Пусть смотрим на редактор
    И заполняем документ
      """
      1. петрушка
      
         1. огурец(*)
      
            1. апельсин
      
            2. мандарин
      
            3. виноград
      """
    Когда нажимаем на клавиши "Control+Shift+7"
    Тогда разметка текущей статьи содержит
      """
      1. петрушка
      
      2. огурец(*)
      
         1. апельсин
      
         2. мандарин
      
         3. виноград
      """
