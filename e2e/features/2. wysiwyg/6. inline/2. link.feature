# language: ru
Функция: Ссылки
#  Сценарий: Создание внешней ссылки
#    Пусть смотрим на редактор
#    И заполняем документ
#      """
#      Lorem ipsum dolor(*)
#      """
#    Когда нажимаем на клавиши "Control+Shift+ArrowLeft"
#    И нажимаем на иконку редактора "ссылка"
#    И вводим "https://app.gram.ax/"
#    И нажимаем на клавиши "Enter"
#    Тогда разметка текущей статьи содержит
#      """
#      Lorem ipsum [dolor](https://app.gram.ax/)
#      """
#
#  Сценарий: Удаление пустой ссылки с помощью Esc
#    Пусть смотрим на редактор
#    И заполняем документ
#      """
#      Lorem ipsum(*)
#      """
#    Когда нажимаем на клавиши "Control+Shift+ArrowLeft"
#    И нажимаем на иконку редактора "ссылка"
#    И вводим "https://vk.com/"
#    И нажимаем на клавиши "Escape"
#    Тогда разметка текущей статьи содержит
#      """
#      Lorem ipsum
#      """
#
#  Сценарий: Вставка ссылки
#    Пусть смотрим на редактор
#    И заполняем документ
#      """
#      Lorem ipsum dolor(*)
#      """
#    Когда нажимаем на клавиши "Control+Shift+ArrowLeft"
#    И вставляем текст "https://app.gram.ax/"
#    И вводим " sit"
#    Тогда разметка текущей статьи содержит
#      """
#      Lorem ipsum [dolor](https://app.gram.ax/) sit(*)
#      """
