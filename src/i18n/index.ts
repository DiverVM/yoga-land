import i18next, { type TOptions } from "i18next";

const resources = {
  ru: {
    translation: {
      brand: "Yoga Land",
      common: {
        home: "Главная",
        login: "Войти",
        logout: "Выйти",
        back: "Назад",
        backToLanding: "На главную",
        adminPanel: "Панель администратора",
        noData: "Нет данных",
      },
      landing: {
        title: "Йога-занятия за пару минут",
        subtitle:
          "Выберите курс, оплатите и получите QR-код для подтверждения бронирования.",
      },
      header: {
        scanQr: "Сканировать QR",
        admin: "Админ",
        openMenu: "Открыть меню",
        closeMenu: "Закрыть меню",
      },
      checkout: {
        title: "Покупка курса",
        subtitle:
          "Выберите курс ниже и завершите оплату, чтобы получить QR-код.",
        course: "Курс",
        noCourses: "Нет активных курсов.",
        paymentSimulation: "Симуляция оплаты",
        simulationAuto: "Авто",
        simulationSuccess: "Успех",
        simulationFailed: "Ошибка",
        total: "Итого",
        payNow: "Оплатить",
        processing: "Обработка…",
        selectCourse: "Выберите курс.",
        checkoutFailed: "Ошибка оформления заказа",
        paymentFailedTitle: "Оплата не прошла",
        paymentFailedBanner:
          "Платеж отклонен. Ничего не списано, попробуйте снова.",
        paymentFailedTransaction: "Номер транзакции: {{id}}",
      },
      login: {
        badge: "Доступ администратора",
        title: "Вход администратора",
        subtitle: "Войдите, чтобы открыть административную зону.",
        loginLabel: "Логин",
        passwordLabel: "Пароль",
        signIn: "Войти",
        signingIn: "Выполняется вход…",
        backHome: "Вернуться на главную",
        failed: "Ошибка входа",
      },
      scan: {
        title: "QR-сканер",
        subtitle:
          "Наведите камеру на QR-код Yoga Land для автоматического подтверждения или используйте фото, если Safari блокирует камеру по HTTP.",
      },
      scanner: {
        notYogaQr: "Это не QR-код Yoga Land.",
        alreadyDecided: "QR уже был обработан.",
        acceptFailed: "Не удалось подтвердить QR.",
        accepted: "QR успешно подтвержден.",
        openQrDetails: "Открыть детали QR",
        cameraUnavailable: "Камера недоступна",
        fallbackTitle: "Резервное сканирование",
        fallbackSubtitle:
          "Если доступ к камере заблокирован, выберите фото/файл с QR-кодом, и он будет обработан автоматически.",
        uploadAction: "Сделать фото / Выбрать изображение / Загрузить PDF",
        unableReadImage: "Не удалось прочитать изображение.",
        unableProcessImage: "Не удалось обработать изображение.",
        qrNotFoundImage: "QR-код не найден на выбранном изображении.",
        pdfNoPages: "PDF не содержит страниц.",
        qrNotFoundPdf: "QR-код не найден на первой странице PDF.",
        cameraBlockedHttp:
          "Safari блокирует доступ к камере по http://192.168.x.x. Используйте HTTPS или загрузку фото ниже.",
        browserNoCamera:
          "В этом браузере недоступен доступ к камере. Используйте загрузку фото ниже.",
        cameraDenied:
          "Доступ к камере запрещен. Вы можете использовать загрузку фото ниже.",
      },
      qrActions: {
        copied: "URL QR скопирован в буфер обмена.",
        pdfTitle: "QR-код Yoga Land",
        pdfFailed: "Не удалось создать PDF.",
        openedTab: "URL QR открыт в новой вкладке.",
        enterEmail: "Сначала введите email.",
        emailFailed: "Ошибка отправки email",
        emailSent: "Email отправлен",
        generatingPdf: "Генерация PDF…",
        downloadPdf: "Скачать PDF",
        openInTab: "Открыть в новой вкладке",
        sendByEmail: "Отправить QR по email",
        send: "Отправить",
        sending: "Отправка…",
      },
      payment: {
        successBadge: "Оплата успешна",
        successTitle: "Ваш QR-код готов",
        transactionFor: "Транзакция {{id}} на сумму {{amount}}",
        successSubtitle:
          "Спасибо за покупку. Сохраните QR-код и покажите его при посещении.",
        nextStepsTitle: "Что делать дальше",
        nextStepsBody:
          "Скачайте QR в PDF или отправьте его на email, чтобы он всегда был под рукой.",
        failedBadge: "Оплата не прошла",
        failedTitle: "Транзакция не завершена",
        transactionId: "ID транзакции: {{id}}",
        noTransactionId: "ID транзакции не передан.",
        tryAgain: "Попробовать снова",
      },
      qrDetails: {
        title: "Детали QR",
        subtitle: "Запись QR {{qrId}} связана с транзакцией {{transactionId}}",
        transactionInfo: "Информация о транзакции",
        productId: "ID продукта",
        amount: "Сумма",
        paymentStatus: "Статус оплаты",
        created: "Создано",
        decodedPayload: "Декодированная нагрузка QR",
        decodeFailed: "Не удалось декодировать JSON нагрузку.",
        qrUrl: "URL QR",
        backToAdmin: "Назад в панель администратора",
      },
      qrDecision: {
        currentDecision: "Текущее решение",
        accept: "Подтвердить QR-код",
        decline: "Отклонить QR-код",
        accepted: "QR-код подтвержден.",
        declined: "QR-код отклонен.",
        updateFailed: "Не удалось обновить статус QR",
      },
      admin: {
        title: "Панель администратора",
        subtitle: "Сохраненные записи из вашей базы данных.",
        transactions: "Транзакции",
        qrRecords: "QR-записи",
        emailLogs: "Email-логи",
        id: "ID",
        course: "Курс",
        amount: "Сумма",
        status: "Статус",
        qr: "QR",
        date: "Дата",
        recipient: "Получатель",
        transaction: "Транзакция",
        decision: "Решение",
        decidedAt: "Решено",
        created: "Создано",
        link: "Ссылка",
        filter: "Фильтр",
        clear: "Сброс",
        allStatuses: "Все статусы",
        allDecisions: "Все решения",
        all: "Все",
        pending: "В ожидании",
        success: "Успех",
        failed: "Ошибка",
        accepted: "Подтвержден",
        declined: "Отклонен",
        sent: "Отправлен",
        open: "Открыть",
        pageOf: "Страница {{page}} из {{total}}",
        prev: "← Назад",
        next: "Вперед →",
        noTransactions: "Транзакции не найдены.",
        noQrRecords: "QR-записи не найдены.",
        noEmailLogs: "Email-логи не найдены.",
      },
      email: {
        subject: "Ваш QR-код Yoga Land для курса {{course}}",
        title: "Спасибо за покупку в Yoga Land",
        subtitle:
          "Ваша покупка подтверждена. Покажите QR-код ниже при посещении.",
        detailsTitle: "Детали покупки",
        course: "Курс",
        price: "Цена",
        transaction: "Транзакция",
        purchasedAt: "Дата покупки",
        qrId: "ID QR",
        footer:
          "Сохраните это письмо. В нем содержатся ваш QR-код и данные транзакции.",
        textIntro: "Спасибо за покупку в Yoga Land.",
        textConfirmed: "Ваша покупка подтверждена.",
        textUseQr: "Используйте QR-код из HTML-версии письма при посещении.",
      },
    },
  },
} as const;

if (!i18next.isInitialized) {
  void i18next.init({
    lng: "ru",
    fallbackLng: "ru",
    resources,
    interpolation: {
      escapeValue: false,
    },
  });
}

export function t(key: string, options?: TOptions): string {
  return i18next.t(key, options);
}
