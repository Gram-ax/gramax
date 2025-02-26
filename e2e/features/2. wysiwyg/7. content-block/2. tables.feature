# language: ru
Функция: Таблица

  Сценарий: Полностью заполнить таблицу с помощью хоткеев
    И смотрим на редактор
    И заполняем документ
      """
      |(*)|||
      |-|-|-|
      ||||
      ||||
      """
    Когда нажимаем на клавиши "a ArrowDown b ArrowRight b ArrowDown Shift+Tab c Tab c Tab c ArrowUp b ArrowUp ArrowLeft a Tab a"
    То разметка текущей статьи содержит
      """
      | a | a | a |
      |---|---|---|
      | b | b | b |
      | c | c | c |
      """

  Сценарий: Создать в таблице маркированный список
    Пусть смотрим на редактор
    И заполняем документ
      """
      |(*)|||
      |-|-|-|
      ||||
      ||||
      """
    Когда вводим "- text"
    И нажимаем на клавиши "Enter"
    И вводим "test"
    То разметка текущей статьи содержит
      """
      {% table header="row" %}
      
      ---
      
      *  -  text
      
         -  test
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      {% /table %}
      
      """

  Сценарий: Создать в таблице блок кода
    Пусть смотрим на редактор
    И заполняем документ
      """
      |(*)|||
      |-|-|-|
      ||||
      ||||
      """
    Когда нажимаем на иконку редактора "блок кода"
    И вводим "text"
    То разметка текущей статьи содержит
      """
      {% table header="row" %}
      
      ---
      
      *  ```
         text
         ```
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      {% /table %}
      
      """

  Сценарий: Выход из таблицы
    Пусть смотрим на редактор
    И заполняем документ
      """
      ||||
      |-|-|-|
      ||||
      |||(*)|
      """
    Когда нажимаем на клавиши "Enter Enter"
    И вводим "Текст после таблики"
    Тогда разметка текущей статьи содержит
      """
      |   |   |   |
      |---|---|---|
      |   |   |   |
      |   |   |   |
      
      Текст после таблики
      """

  Сценарий: Выход из сложной таблицы
    Пусть смотрим на редактор
    И заполняем документ
      """
      {% table header="row" %}
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  {% rowspan=2 %}
      
         (*)
      
      ---
      
      *  
      
      *  
      
      {% /table %}
      """
    Когда нажимаем на клавиши "Enter Enter"
    И вводим "Текст после таблики"
    Тогда разметка текущей статьи содержит
      """
      {% table header="row" %}
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  
      
      ---
      
      *  
      
      *  
      
      *  {% rowspan=2 %}
      
         
      
      ---
      
      *  
      
      *  
      
      {% /table %}
      
      Текст после таблики
      """

  Сценарий: Целостность изображения при взаимодействии с таблицей
    Пусть смотрим на редактор
    И заполняем документ
      """
      ||||
      |-|-|-|
      |(*)|||
      ||||
      """
    Когда вставляем изображение
    И нажимаем на клавиши "ArrowUp Shift+ArrowLeft"
    И нажимаем на иконку "удалить строку"
    Тогда не ожидаем ошибку
    Когда перезагружаем страницу
    Тогда не видим элемент "alert-error" внутри "article-editor"
