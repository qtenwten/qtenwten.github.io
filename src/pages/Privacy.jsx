import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import './Privacy.css'

function Privacy() {
  const { t, language } = useLanguage()

  return (
    <>
      <SEO
        title={t('privacy.pageTitle')}
        description={t('privacy.description')}
        path={`/${language}/privacy`}
      />

      <ToolPageShell className="privacy-page">
        <ToolPageHero
          eyebrow={language === 'en' ? 'Legal' : 'Правовая информация'}
          title={t('privacy.pageTitle')}
        />

        <div className="legal-content">
          {language === 'ru' ? (
            <>
              <section className="legal-section">
                <h2>1. Общие положения</h2>
                <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных и иной информации о Пользователях сайта QSEN.RU (далее — «Сайт»).</p>
                <p>1.2. Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» (далее — «ФЗ-152»), Федеральным законом от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о защите информации», а также иными нормативными правовыми актами Российской Федерации в области защиты персональных данных.</p>
                <p>1.3. Использование Сайта означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки персональных данных. Если Пользователь не согласен с условиями Политики, он обязан прекратить использование Сайта.</p>
                <p>1.4. Администрация не проверяет достоверность персональных данных, предоставляемых Пользователем. В связи с этим Администрация исходит из того, что Пользователь предоставляет достоверные и достаточные персональные данные и поддерживает их в актуальном состоянии.</p>
              </section>

              <section className="legal-section">
                <h2>2. Термины и определения</h2>
                <p>2.1. В настоящей Политике используются следующие термины:</p>
                <ul>
                  <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому физическому лицу (субъекту персональных данных).</li>
                  <li><strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (распространение, предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.</li>
                  <li><strong>Оператор</strong> — государственный орган, муниципальный орган, юридическое или физическое лицо, самостоятельно или совместно с другими лицами организующие и (или) осуществляющие обработку персональных данных, а также определяющие цели обработки персональных данных, состав персональных данных, подлежащих обработке, действия (операции), совершаемые с персональными данными. В контексте настоящей Политики Оператором является Администрация Сайта.</li>
                  <li><strong>Cookies</strong> — небольшой фрагмент данных, отправленный веб-сервером и хранимый на компьютере Пользователя, который веб-клиент или веб-браузер каждый раз пересылает веб-серверу в HTTP-запросе при попытке открыть страницу соответствующего сайта.</li>
                  <li><strong>IP-адрес</strong> — уникальный сетевой адрес узла в компьютерной сети, построенной по протоколу IP.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>3. Состав обрабатываемых данных</h2>
                <p>3.1. Администрация обрабатывает следующие категории данных:</p>

                <h3>3.1.1. Данные, не являющиеся персональными</h3>
                <p>При использовании Сайта автоматически собирается следующая информация:</p>
                <ul>
                  <li>IP-адрес устройства Пользователя;</li>
                  <li>тип и версия браузера;</li>
                  <li>тип устройства и его технические характеристики;</li>
                  <li>дата и время доступа к Сайту;</li>
                  <li>просмотренные страницы и разделы Сайта;</li>
                  <li>время, проведённое на Сайте;</li>
                  <li>источник перехода на Сайт (прямой вход, поисковая система, ссылка с другого сайта).</li>
                </ul>
                <p>Указанная информация не позволяет идентифицировать конкретного Пользователя и не относится к персональным данным в соответствии с ФЗ-152.</p>

                <h3>3.1.2. Данные, предоставляемые Пользователем добровольно</h3>
                <p>При заполнении формы обратной связи Пользователь может указать:</p>
                <ul>
                  <li>имя (или псевдоним);</li>
                  <li>адрес электронной почты;</li>
                  <li>текст обращения.</li>
                </ul>
                <p>Предоставление этих данных является добровольным. Указание Пользователем своих персональных данных в форме обратной связи означает согласие на их обработку в соответствии с настоящей Политикой.</p>

                <h3>3.1.3. Файлы cookies</h3>
                <p>Сайт использует файлы cookies для обеспечения функционирования Сайта и повышения качества сервиса. Подробная информация о cookies представлена в Разделе 5 настоящей Политики.</p>
              </section>

              <section className="legal-section">
                <h2>4. Цели обработки данных</h2>
                <p>4.1. Администрация обрабатывает данные в следующих целях:</p>
                <ul>
                  <li>обеспечение работоспособности и функциональности Сайта;</li>
                  <li>улучшение качества работы Сайта и разработка новых сервисов;</li>
                  <li>анализ использования Сайта Пользователями для оптимизации пользовательского опыта;</li>
                  <li>обеспечение связи с Пользователем в случае обращения через форму обратной связи;</li>
                  <li>ведение статистики посещаемости Сайта;</li>
                  <li>выявление и предотвращение технических сбоев и нарушений работы Сайта;</li>
                  <li>исполнение требований законодательства Российской Федерации.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>5. Файлы cookies и технологии веб-аналитики</h2>

                <h3>5.1. Сторонние сервисы веб-аналитики</h3>
                <p>5.1.1. Для сбора и анализа статистики посещаемости Сайта могут использоваться сторонние сервисы веб-аналитики (далее — «Сервисы аналитики»).</p>
                <p>5.1.2. Сервисы аналитики собирают и обрабатывают следующие данные:</p>
                <ul>
                  <li>информацию о поведении Пользователя на Сайте (просмотренные страницы, время, проведённое на Сайте, переходы между страницами, клики, прокрутка страниц, движение курсора мыши);</li>
                  <li>технические данные об устройстве Пользователя (тип устройства, операционная система, разрешение экрана);</li>
                  <li>тип и версию браузера Пользователя;</li>
                  <li>IP-адрес Пользователя (может использоваться для определения географического региона);</li>
                  <li>данные, передаваемые браузером Пользователя в HTTP-заголовках;</li>
                  <li>информацию об источнике перехода на Сайт (прямой вход, поисковая система, ссылка с другого сайта);</li>
                  <li>данные, передаваемые через файлы cookies и иные технологии отслеживания.</li>
                </ul>
                <p>5.1.3. Сервисы аналитики используют собранные данные для следующих целей:</p>
                <ul>
                  <li>анализ посещаемости и поведения Пользователей на Сайте;</li>
                  <li>определение популярности разделов и функций Сайта;</li>
                  <li>выявление технических проблем и ошибок в работе Сайта;</li>
                  <li>оптимизация работы Сайта и улучшение пользовательского опыта;</li>
                  <li>определение эффективности маркетинговых мероприятий и рекламных кампаний;</li>
                  <li>формирование статистических отчётов для Администрации;</li>
                  <li>обеспечение безопасности и выявление подозрительной активности.</li>
                </ul>
                <p>5.1.4. Сервисы аналитики могут использовать файлы cookies первых и третьих лиц, а также иные технологии отслеживания (веб-маяки, пиксельные теги, JavaScript-счётчики) для сбора и обработки данных. Подробная информация о принципах работы и политике конфиденциальности конкретных сервисов аналитики доступна на их официальных сайтах.</p>
                <p>5.1.5. Для отказа от использования cookies сторонними сервисами Пользователь может воспользоваться настройками своего браузера или специальными инструментами, предоставляемыми сервисами аналитики. Отказ от cookies может повлиять на функциональность отдельных элементов Сайта.</p>

                <h3>5.2. Локальное хранение данных браузера</h3>
                <p>5.2.1. Для сохранения пользовательских настроек Сайт использует механизмы хранения данных браузера (localStorage и sessionStorage):</p>
                <ul>
                  <li><strong>theme</strong> (localStorage) — сохранение выбранной темы оформления (light или dark);</li>
                  <li><strong>qsen_cookie_consent</strong> (sessionStorage) — подтверждение согласия Пользователя с использованием файлов cookies.</li>
                </ul>
                <p>5.2.2. Эти данные не содержат персональных данных и используются исключительно для функционирования Сайта. Данные хранятся локально на устройстве Пользователя и не передаются на сервер.</p>

                <h3>5.3. Управление cookies и локальным хранением</h3>
                <p>5.3.1. Пользователь может в любой момент очистить данные локального хранения или отключить использование cookies в настройках своего браузера. В этом случае некоторые функции Сайта могут работать некорректно.</p>
                <p>5.3.2. Инструкции по управлению cookies для популярных браузеров:</p>
                <ul>
                  <li>Google Chrome: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">https://support.google.com/chrome/answer/95647</a></li>
                  <li>Mozilla Firefox: <a href="https://support.mozilla.org/ru/kb/udalenie-kukov-iz-firefox" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/ru/kb/udalenie-kukov-iz-firefox</a></li>
                  <li>Microsoft Edge: <a href="https://support.microsoft.com/ru-ru/microsoft-edge/cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer">https://support.microsoft.com/ru-ru/microsoft-edge/cookies-in-microsoft-edge</a></li>
                  <li>Opera: <a href="https://help.opera.com/ru/latest/web-preferences/" target="_blank" rel="noopener noreferrer">https://help.opera.com/ru/latest/web-preferences/</a></li>
                  <li>Safari: <a href="https://support.apple.com/ru-ru/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">https://support.apple.com/ru-ru/guide/safari/sfri11471/mac</a></li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>6. Правовые основания обработки данных</h2>
                <p>6.1. Администрация обрабатывает персональные данные на следующих правовых основаниях:</p>
                <ul>
                  <li><strong>Согласие субъекта персональных данных</strong> (пункт 1 части 1 статьи 6 ФЗ-152) — для обработки данных, предоставленных Пользователем добровольно через форму обратной связи;</li>
                  <li><strong>Осуществление обработки, необходимой для достижения целей, предусмотренных законом</strong> (пункт 2 части 1 статьи 6 ФЗ-152) — для исполнения требований законодательства;</li>
                  <li><strong>Обработка, необходимая для исполнения договора</strong> (пункт 5 части 1 статьи 6 ФЗ-152) — при использовании Пользователем сервисов Сайта;</li>
                  <li><strong>Осуществление обработки, необходимой для обеспечения работоспособности Сайта</strong> (пункт 2 части 1 статьи 6 ФЗ-152) — для технического функционирования Сайта и обеспечения связи с Пользователем.</li>
                </ul>
                <p>6.2. Обработка данных с использованием сервисов веб-аналитики осуществляется на основании согласия Пользователя с условиями настоящей Политики.</p>
              </section>

              <section className="legal-section">
                <h2>7. Порядок обработки и хранения данных</h2>
                <p>7.1. Администрация обеспечивает сохранность персональных данных и принимает все необходимые меры, исключающие несанкционированный доступ к персональным данным третьих лиц.</p>
                <p>7.2. Персональные данные Пользователя не передаются третьим лицам, за исключением случаев:</p>
                <ul>
                  <li>получения явного согласия Пользователя на такие действия;</li>
                  <li>требования законодательства Российской Федерации;</li>
                  <li>необходимости передачи данных для функционирования сервисов Сайта (в том числе сервисов веб-аналитики), при условии соблюдения третьими лицами требований законодательства о защите персональных данных.</li>
                </ul>
                <p>7.3. Персональные данные, предоставленные через форму обратной связи, обрабатываются в течение срока, необходимого для рассмотрения обращения Пользователя, но не более 3 (трёх) лет с момента последнего взаимодействия.</p>
                <p>7.4. Данные, собираемые через Метрику, хранятся на серверах Яндекса в соответствии с политикой Яндекса.</p>
                <p>7.5. При достижении целей обработки данных или при отзыве согласия Пользователя данные подлежат уничтожению или обезличиванию в установленном законом порядке.</p>
              </section>

              <section className="legal-section">
                <h2>8. Защита данных</h2>
                <p>8.1. Администрация принимает необходимые и достаточные организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий третьих лиц.</p>
                <p>8.2. Меры по обеспечению безопасности данных включают:</p>
                <ul>
                  <li>использование защищённого соединения (HTTPS) при передаче данных между браузером Пользователя и сервером Сайта;</li>
                  <li>регулярное обновление программного обеспечения Сайта для устранения уязвимостей;</li>
                  <li>ограничение доступа сотрудников Администрации к персональным данным;</li>
                  <li>мониторинг систем на предмет несанкционированного доступа.</li>
                </ul>
                <p>8.3. Передача данных через сеть Интернет не может быть полностью безопасной. Администрация не может гарантировать абсолютную защиту данных, передаваемых Пользователем через Сайт.</p>
              </section>

              <section className="legal-section">
                <h2>9. Права Пользователя</h2>
                <p>9.1. Пользователь имеет следующие права в отношении своих персональных данных:</p>
                <ul>
                  <li><strong>Право на получение информации</strong> — Пользователь вправе получить информацию о своих персональных данных, обрабатываемых Администрацией, целях обработки и способах осуществления такой обработки.</li>
                  <li><strong>Право на доступ</strong> — Пользователь вправе получить доступ к своим персональным данным, обрабатываемым Администрацией.</li>
                  <li><strong>Право на уточнение</strong> — Пользователь вправе требовать уточнения, обновления или исправления своих персональных данных, если они являются неполными, устаревшими или неточными.</li>
                  <li><strong>Право на удаление</strong> — Пользователь вправе требовать удаления своих персональных данных, если обработка таких данных не является необходимой для достижения целей, предусмотренных законом.</li>
                  <li><strong>Право на отзыв согласия</strong> — Пользователь вправе в любое время отозвать согласие на обработку своих персональных данных, направив соответствующее обращение через <a href={`/${language}/feedback`}>форму обратной связи</a>.</li>
                </ul>
                <p>9.2. Для реализации своих прав Пользователь может направить запрос через <a href={`/${language}/feedback`}>форму обратной связи</a> на Сайте или по электронной почте.</p>
                <p>9.3. Администрация обязуется рассмотреть запрос и предоставить ответ в течение 30 (тридцати) календарных дней с момента получения запроса.</p>
              </section>

              <section className="legal-section">
                <h2>10. Передача данных сторонним сервисам и внешние API</h2>
                <p>10.1. Для обеспечения отдельных функций Сайта данные Пользователя могут передаваться сторонним сервисам и внешним API. Ниже описаны категории таких передач и цели передачи данных:</p>

                <h3>10.1.1. Сервисы веб-аналитики</h3>
                <p>При работе сервисов веб-аналитики (раздел 5.1 настоящей Политики) данные о поведении Пользователя на Сайте, технические данные устройства и браузера, а также данные cookies передаются сторонним провайдерам этих сервисов для сбора статистики и анализа посещаемости.</p>

                <h3>10.1.2. Сервисы проверки SEO и работоспособности сайтов</h3>
                <p>При использовании функций SEO-анализа сайтов URL проверяемого сайта и связанные данные передаются внешним API для получения информации о техническом состоянии, индексации и позициях сайта в поисковых системах.</p>

                <h3>10.1.3. Сервисы генерации QR-кодов и коротких ссылок</h3>
                <p>При использовании генератора QR-кодов или сокращателя ссылок введённые Пользователем данные (текст, URL) могут передаваться внешним сервисам для генерации соответствующего изображения или сокращённой ссылки.</p>

                <h3>10.1.4. Сервисы обратной связи</h3>
                <p>При отправке обращения через форму обратной связи данные Пользователя (имя, email, текст обращения) передаются внешнему сервису для обработки и доставки сообщения Администрации.</p>

                <p>10.2. Конкретный состав передаваемых данных зависит от используемой функции Сайта и может включать:</p>
                <ul>
                  <li>URL или текст, введённые Пользователем для обработки;</li>
                  <li>IP-адрес и технические данные браузера Пользователя;</li>
                  <li>данные о действиях Пользователя на Сайте (для аналитических сервисов);</li>
                  <li>данные формы обратной связи (имя, email, текст обращения).</li>
                </ul>
                <p>10.3. Все сторонние сервисы, используемые на Сайте, имеют собственные политики конфиденциальности и самостоятельно определяют цели и способы обработки передаваемых данных. Администрация не несёт ответственности за действия сторонних сервисов и рекомендует Пользователям ознакомиться с условиями использования и политиками конфиденциальности таких сервисов.</p>
                <p>10.4. Передача данных сторонним сервисам осуществляется на основании согласия Пользователя с условиями настоящей Политики. Используя функции Сайта, требующие обращения к внешним сервисам, Пользователь выражает согласие на передачу необходимых данных.</p>
                <p>10.5. Переход Пользователя на внешние ресурсы по ссылкам с Сайта осуществляется по собственному усмотрению Пользователя.</p>
              </section>

              <section className="legal-section">
                <h2>11. Изменение Политики</h2>
                <p>11.1. Администрация оставляет за собой право в любое время изменять настоящую Политику без предварительного уведомления Пользователя.</p>
                <p>11.2. Новая редакция Политики вступает в силу с момента её размещения на Сайте, если иное не предусмотрено новой редакцией Политики.</p>
                <p>11.3. Продолжение использования Сайта после внесения изменений в Политику означает согласие Пользователя с новой редакцией Политики.</p>
                <p>11.4. Пользователь обязан самостоятельно отслеживать изменения Политики, периодически просматривая текущую редакцию.</p>
              </section>

              <section className="legal-section">
                <h2>12. Применимое законодательство</h2>
                <p>12.1. Настоящая Политика регулируется и толкуется в соответствии с законодательством Российской Федерации, в частности:</p>
                <ul>
                  <li>Конституцией Российской Федерации;</li>
                  <li>Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»;</li>
                  <li>Федеральным законом от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о защите информации»;</li>
                  <li>Постановлением Правительства РФ от 01.11.2012 № 1119 «Об утверждении требований к защите персональных данных при их обработке в информационных системах персональных данных»;</li>
                  <li>иными нормативными правовыми актами Российской Федерации.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>13. Контактная информация</h2>
                <p>13.1. Для получения информации о порядке обработки персональных данных, реализации своих прав или направления запросов Пользователь может обратиться через <a href={`/${language}/feedback`}>форму обратной связи</a> на Сайте.</p>
                <p>13.2. Администрация обязуется рассмотреть обращение и предоставить ответ в сроки, установленные законодательством Российской Федерации.</p>
                <p className="legal-date">Дата вступления в силу: 24 апреля 2026 года</p>
              </section>
            </>
          ) : (
            <>
              <section className="legal-section">
                <h2>1. General Provisions</h2>
                <p>1.1. This Privacy Policy (hereinafter — "Policy") defines the procedure for processing and protecting personal data and other information about Users of the QSEN.RU website (hereinafter — "Website").</p>
                <p>1.2. The Policy is developed in accordance with Federal Law No. 152-FZ "On Personal Data" dated July 27, 2006 (hereinafter — "FL-152"), Federal Law No. 149-FZ "On Information, Information Technologies and Information Protection" dated July 27, 2006, and other regulatory legal acts of the Russian Federation in the field of personal data protection.</p>
                <p>1.3. Using the Website constitutes the User's unconditional consent to this Policy and the conditions for processing personal data stated herein. If the User does not agree with the Policy conditions, they must stop using the Website.</p>
              </section>

              <section className="legal-section">
                <h2>2. Terms and Definitions</h2>
                <p>2.1. The following terms are used in this Policy:</p>
                <ul>
                  <li><strong>Personal data</strong> — any information relating to a directly or indirectly identified physical person (subject of personal data).</li>
                  <li><strong>Processing of personal data</strong> — any action (operation) or set of actions (operations) performed with or without the use of automation means with personal data, including collection, recording, systematization, accumulation, storage, clarification (update, modification), extraction, use, transmission (distribution, provision, access), anonymization, blocking, deletion, destruction of personal data.</li>
                  <li><strong>Operator</strong> — a state body, municipal body, legal entity or individual that independently or jointly with other persons organizes and (or) carries out the processing of personal data, and also determines the purposes of personal data processing, the composition of personal data to be processed, and the actions (operations) performed with personal data. In the context of this Policy, the Operator is the Website Administration.</li>
                  <li><strong>Cookies</strong> — a small piece of data sent by a web server and stored on the User's computer, which a web client or web browser sends to the web server in an HTTP request each time it tries to open the corresponding page.</li>
                  <li><strong>IP address</strong> — a unique network address of a node in a computer network built on the IP protocol.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>3. Data Processed</h2>
                <p>3.1. The Administration processes the following categories of data:</p>

                <h3>3.1.1. Non-personal data</h3>
                <p>When using the Website, the following information is automatically collected:</p>
                <ul>
                  <li>User's device IP address;</li>
                  <li>browser type and version;</li>
                  <li>device type and its technical characteristics;</li>
                  <li>date and time of Website access;</li>
                  <li>viewed pages and sections of the Website;</li>
                  <li>time spent on the Website;</li>
                  <li>source of transition to the Website (direct access, search engine, link from another site).</li>
                </ul>

                <h3>3.1.2. Data voluntarily provided by the User</h3>
                <p>When filling out the feedback form, the User may provide:</p>
                <ul>
                  <li>name (or pseudonym);</li>
                  <li>email address;</li>
                  <li>message text.</li>
                </ul>

                <h3>3.1.3. Cookies</h3>
                <p>The Website uses cookies to ensure functionality and improve service quality. Detailed cookie information is provided in Section 5 of this Policy.</p>
              </section>

              <section className="legal-section">
                <h2>4. Purposes of Data Processing</h2>
                <p>4.1. The Administration processes data for the following purposes:</p>
                <ul>
                  <li>ensuring the functioning and functionality of the Website;</li>
                  <li>improving the Website quality and developing new services;</li>
                  <li>analyzing Website usage to optimize user experience;</li>
                  <li>maintaining communication with the User when contacting via feedback form;</li>
                  <li>maintaining website visit statistics;</li>
                  <li>identifying and preventing technical failures and Website violations;</li>
                  <li>compliance with the requirements of the Russian Federation legislation.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>5. Cookies and Web Analytics</h2>

                <h3>5.1. Third-Party Analytics Services</h3>
                <p>5.1.1. Third-party web analytics services (hereinafter — "Analytics Services") may be used to collect and analyze Website traffic statistics.</p>
                <p>5.1.2. Analytics Services collect and process the following data:</p>
                <ul>
                  <li>information about User behavior on the Website (viewed pages, time spent on the Website, page transitions, clicks, scrolling, cursor movement);</li>
                  <li>technical data about the User's device (device type, operating system, screen resolution);</li>
                  <li>browser type and version;</li>
                  <li>User's IP address (may be used for geographical region determination);</li>
                  <li>data transmitted by the User's browser in HTTP headers;</li>
                  <li>information about the source of transition to the Website (direct access, search engine, link from another site);</li>
                  <li>data transmitted through cookies and other tracking technologies.</li>
                </ul>
                <p>5.1.3. Analytics Services use collected data for the following purposes:</p>
                <ul>
                  <li>analysis of Website traffic and User behavior;</li>
                  <li>determining the popularity of sections and functions;</li>
                  <li>identifying technical problems and errors;</li>
                  <li>Website optimization and user experience improvement;</li>
                  <li>measuring the effectiveness of marketing activities and advertising campaigns;</li>
                  <li>generating statistical reports for the Administration;</li>
                  <li>ensuring security and detecting suspicious activity.</li>
                </ul>
                <p>5.1.4. Analytics Services may use first-party and third-party cookies, as well as other tracking technologies (web beacons, pixel tags, JavaScript counters) for data collection and processing. Detailed information about the operation principles and privacy policies of specific analytics services is available on their official websites.</p>
                <p>5.1.5. To opt out of third-party analytics services using cookies, the User may use browser settings or special tools provided by analytics services. Disabling cookies may affect the functionality of certain Website elements.</p>

                <h3>5.2. Local Browser Storage</h3>
                <p>5.2.1. To save user preferences, the Website uses browser storage mechanisms (localStorage and sessionStorage):</p>
                <ul>
                  <li><strong>theme</strong> (localStorage) — saving the selected theme (light or dark);</li>
                  <li><strong>qsen_cookie_consent</strong> (sessionStorage) — confirmation of User's consent to cookie usage.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>6. Legal Grounds for Data Processing</h2>
                <p>6.1. The Administration processes personal data on the following legal grounds:</p>
                <ul>
                  <li><strong>Consent of the personal data subject</strong> (Clause 1, Part 1, Article 6 of FL-152) — for processing data voluntarily provided by the User through the feedback form;</li>
                  <li><strong>Processing necessary to achieve purposes provided by law</strong> (Clause 2, Part 1, Article 6 of FL-152) — for compliance with legislative requirements;</li>
                  <li><strong>Processing necessary for contract performance</strong> (Clause 5, Part 1, Article 6 of FL-152) — when the User uses Website services;</li>
                  <li><strong>Processing necessary to ensure Website functioning</strong> (Clause 2, Part 1, Article 6 of FL-152) — for technical Website functioning and communication with the User.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>7. Data Processing and Storage Procedure</h2>
                <p>7.1. The Administration ensures the safety of personal data and takes all necessary measures to prevent unauthorized access to personal data by third parties.</p>
                <p>7.2. User personal data is not transferred to third parties, except in cases of:</p>
                <ul>
                  <li>obtaining explicit User consent for such actions;</li>
                  <li>requirement of the Russian Federation legislation;</li>
                  <li>necessity of data transfer for Website services functioning (including analytics services), provided that third parties comply with personal data protection legislation requirements.</li>
                </ul>
                <p>7.3. Personal data provided through the feedback form is processed during the time necessary to consider the User's request, but no more than 3 (three) years from the last interaction.</p>
              </section>

              <section className="legal-section">
                <h2>8. Data Protection</h2>
                <p>8.1. The Administration takes necessary and sufficient organizational and technical measures to protect personal data from unauthorized or accidental access, destruction, modification, blocking, copying, distribution, as well as other illegal actions by third parties.</p>
                <p>8.2. Security measures include:</p>
                <ul>
                  <li>using a secure connection (HTTPS) for data transmission between the User's browser and the Website server;</li>
                  <li>regular updating of Website software to eliminate vulnerabilities;</li>
                  <li>restricting Administration employees' access to personal data;</li>
                  <li>monitoring systems for unauthorized access.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>9. User Rights</h2>
                <p>9.1. The User has the following rights regarding their personal data:</p>
                <ul>
                  <li><strong>Right to receive information</strong> — the User has the right to receive information about their personal data processed by the Administration, processing purposes, and methods.</li>
                  <li><strong>Right of access</strong> — the User has the right to access their personal data processed by the Administration.</li>
                  <li><strong>Right to clarification</strong> — the User has the right to demand clarification, update, or correction of their personal data if they are incomplete, outdated, or inaccurate.</li>
                  <li><strong>Right to deletion</strong> — the User has the right to demand deletion of their personal data if the processing of such data is not necessary to achieve purposes provided by law.</li>
                  <li><strong>Right to withdraw consent</strong> — the User has the right to withdraw consent to personal data processing at any time by sending a corresponding request through the <a href={`/${language}/feedback`}>feedback form</a>.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>10. Data Transfer to Third-Party Services and External APIs</h2>
                <p>10.1. To provide certain Website functions, User data may be transferred to third-party services and external APIs. The categories of such transfers and purposes of data transfer are described below:</p>

                <h3>10.1.1. Web Analytics Services</h3>
                <p>When web analytics services are operating (Section 5.1 of this Policy), data about User behavior on the Website, device and browser technical data, and cookie data are transferred to third-party providers of these services for statistics collection and traffic analysis.</p>

                <h3>10.1.2. SEO and Website Availability Check Services</h3>
                <p>When using SEO analysis features, the URL of the website being checked and related data are transferred to external APIs to obtain information about the technical condition, indexing, and search engine positions of the website.</p>

                <h3>10.1.3. QR Code and Short Link Generation Services</h3>
                <p>When using the QR code generator or URL shortener, data entered by the User (text, URL) may be transferred to external services to generate the corresponding image or shortened link.</p>

                <h3>10.1.4. Feedback Services</h3>
                <p>When submitting a request through the feedback form, User data (name, email, message text) is transferred to an external service for processing and delivering the message to the Administration.</p>

                <p>10.2. The specific composition of transferred data depends on the Website function being used and may include:</p>
                <ul>
                  <li>URL or text entered by the User for processing;</li>
                  <li>User's IP address and browser technical data;</li>
                  <li>data about User actions on the Website (for analytics services);</li>
                  <li>feedback form data (name, email, message text).</li>
                </ul>
                <p>10.3. All third-party services used on the Website have their own privacy policies and independently determine the purposes and methods of data processing. The Administration is not responsible for the actions of third-party services and recommends that Users familiarize themselves with the terms of use and privacy policies of such services.</p>
                <p>10.4. Data transfer to third-party services is carried out based on the User's consent to this Policy. By using Website functions that require access to external services, the User consents to the transfer of necessary data.</p>
                <p>10.5. The User's transition to external resources via links on the Website is at the User's own discretion.</p>
              </section>

              <section className="legal-section">
                <h2>11. Changes to the Policy</h2>
                <p>10.1. The Administration reserves the right to change this Policy at any time without prior notice to the User.</p>
                <p>10.2. The new version of the Policy takes effect from the moment it is posted on the Website, unless otherwise provided by the new version.</p>
                <p>10.3. Continued use of the Website after changes to the Policy constitutes the User's consent to the new version of the Policy.</p>
                <p className="legal-date">Effective date: April 24, 2026</p>
              </section>
            </>
          )}
        </div>
      </ToolPageShell>
    </>
  )
}

export default Privacy