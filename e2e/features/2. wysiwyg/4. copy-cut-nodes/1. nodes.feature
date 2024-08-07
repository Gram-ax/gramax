# language: ru
Функция: Начало работы

  Сценарий: Копирование списка
    Пусть находимся в новой статье
    Когда смотрим на редактор
    И заполняем документ
      """
      -  абрикос
      
      -  мандаринчик(*)
      """
    И нажимаем на клавиши "Control+A Control+C Control+V"
    Тогда разметка текущей статьи содержит
      """
      
      
      -  абрикос
      
      -  мандаринчик
      """

  Сценарий: Копирование диаграммы
    Пусть смотрим на "редактор"
    И очищаем документ
    И наводим мышку
    И вводим "text"
    И разметка текущей статьи содержит
      """
      text
      """
    И наводимся на иконку редактора "диаграммы"
    И нажимаем на иконку редактора "диаграмма draw.io"
    И разметка текущей статьи содержит
      """
      text
      
      [drawio:./new-article-2.svg:]
      """
    И нажимаем на клавиши "Control+KeyA Control+KeyC Control+KeyV"
    Тогда разметка текущей статьи содержит
      """
      
      
      text
      
      [drawio:./new-article.svg:]
      """
  # Сценарий: Постройка сложного узла
  #   Пусть смотрим на редактор
  #   Когда заполняем документ
  #     """
  #     text
  #     :::note 
  #     Очень важная заметка
  #     1. Адин
  #     2. Ту
  #     3. Фри
  #        1. буковка а
  #        2. буковка б
  #           1. буковка ай
  #     :::
  #     (*)
  #     """
  #   И наводимся на иконку редактора "диаграммы"
  #   И нажимаем на иконку редактора "диаграмма mermaid"
  #   И нажимаем на клавишу "Enter"
  #   И вводим "text"
  #   Тогда разметка текущей статьи содержит
  #     """
  #     text
  #     :::note 
  #     Очень важная заметка
  #     1. Адин
  #     2. Ту
  #     3. Фри
  #        1. буковка а
  #        2. буковка б
  #           1. буковка ай
  #     :::
  #     [mermaid:./new-article-3.mermaid]
  #     text
  #     """
  # Сценарий: Копирование сложного узла
  #   Пусть смотрим на редактор
  #   Когда нажимаем на клавиши "Control+A Control+C"
  #   И очищаем документ
  #   И нажимаем на клавиши "Control+V"
  #   Тогда разметка текущей статьи содержит
  #     """
  #     text
  #     :::note 
  #     Очень важная заметка
  #     1. Адин
  #     2. Ту
  #     3. Фри
  #        1. буковка а
  #        2. буковка б
  #           1. буковка ай
  #     :::
  #     [mermaid:./new-article-3.mermaid]
  #     text
  #     """
