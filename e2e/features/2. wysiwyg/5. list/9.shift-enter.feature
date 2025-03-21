# language: ru
Функция: Хоткей списка Shift+Enter

  Сценарий: Создание параграфа в list item с изображением
    Пусть смотрим на редактор
    И заполняем документ
      """
      -  text
      
      -  ![](./new-article-6.png){width=1280px height=720px}
      
      (*)
      """
    И нажимаем на клавиши "ArrowUp Shift+Enter"
    Тогда разметка текущей статьи содержит
      """
      -  text
      
      -  ![](./new-article-6.png){width=1280px height=720px}
      
         
      
      
      
      """
