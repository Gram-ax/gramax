#language: ru

Функция: Смена ветки в git.

        Сценарий: Пользователь открывает окно работы с ветками git.
            Пусть пользователь находится в разделе "Автотест > catalog > Раздел 2 уровня > Первый раздел 3 уровня > Статья 2 уровня".
            Когда в правом меню нажимаем на кнопку "Git pull".
            То открывается модальное окно "Git pull".
            И в модальном окне есть поле "Current branch".
            И в поле "Current branch" есть значение "master".

        Сценарий: Пользователь открывает выбор веток.
            Когда нажимаем на поле "Current branch".
            То появляется выпадающее меню.
            И в выпадающем меню будут пункты:
            | demo            |
            | develop         |
            | master          |
            | testCash        |
            | demo_develop    |
            | new_test_branch |

        Сценарий: Пользователь выбирает ветку "demo".
            Когда в выпадающем меню выбираем пункт "demo".
            То выпадающее меню закрывается.
            И в поле "Current branch" есть значение "demo".

        Сценарий: Пользователь меняет ветку на "demo".
            Когда в модальном окне нажимаем на кнопку "Switch".

        Сценарий: Пользователь закрывает модальное окно.
            Когда нажимаем на кнопку закрытия.
            То модальное окно закрывается.
            И пользователь будет находиться в разделе "Test Submodules > О ПРОЕКТЕ".

        Сценарий: Пользователь открывает окно работы с ветками git.
            Когда в правом меню нажимаем на кнопку "Git pull".
            То открывается модальное окно.
            И в модальном окне есть поле "Current branch".
            И в поле "Current branch" есть значение "master".

        Сценарий: Пользователь открывает выбор веток.
            Когда нажимаем на поле "Current branch".
            То появляется выпадающее меню.

        Сценарий: Пользователь выбирает ветку "master".
            Когда в выпадающем меню выбираем пункт "master".
            То выпадающее меню закрывается.
            И в поле "Current branch" есть значение "master".

        Сценарий: Пользователь меняет ветку на "master".
            Когда в модальном окне нажимаем на кнопку "Switch".

        Сценарий: Пользователь закрывает модальное окно.
            Когда нажимаем на кнопку закрытия.
            То модальное окно закрывается.
            И пользователь будет находиться в разделе "Автотест > catalog > Раздел 2 уровня > Первый раздел 3 уровня > Статья 2 уровня".