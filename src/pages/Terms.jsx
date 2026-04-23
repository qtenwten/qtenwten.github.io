import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import ToolPageShell, { ToolPageHero } from '../components/ToolPageShell'
import './Terms.css'

function Terms() {
  const { t, language } = useLanguage()

  return (
    <>
      <SEO
        title={t('terms.title')}
        description={t('terms.description')}
        path={`/${language}/terms`}
      />

      <ToolPageShell className="terms-page">
        <ToolPageHero
          eyebrow={language === 'en' ? 'Legal' : 'Правовая информация'}
          title={t('terms.title')}
        />

        <div className="legal-content">
          {language === 'ru' ? (
            <>
              <section className="legal-section">
                <h2>1. Общие положения</h2>
                <p>1.1. Настоящие Правила пользования сайтом QSEN.RU (далее — «Правила») регулируют отношения между владельцем сайта QSEN.RU (далее — «Администрация») и любым лицом, осуществляющим доступ к сайту и использующим его сервисы (далее — «Пользователь»).</p>
                <p>1.2. Правила являются публичной офертой в соответствии со статьёй 437 Гражданского кодекса Российской Федерации. Акцептом оферты является фактическое использование сайта Пользователем.</p>
                <p>1.3. Администрация оставляет за собой право в любое время изменить условия настоящих Правил без предварительного уведомления Пользователя. Новая редакция Правил вступает в силу с момента её размещения на Сайте, если иное не предусмотрено новой редакцией.</p>
                <p>1.4. Использование Пользователем Сайта после вступления в силу изменений означает согласие Пользователя с новой редакцией Правил.</p>
              </section>

              <section className="legal-section">
                <h2>2. Предмет соглашения</h2>
                <p>2.1. Настоящие Правила определяют порядок использования сервисов сайта QSEN.RU, включая все инструменты, калькуляторы, генераторы и иные функциональные возможности (далее — «Сервисы»).</p>
                <p>2.2. Сайт QSEN.RU предоставляет Пользователям доступ к следующим категориям сервисов:</p>
                <ul>
                  <li>калькуляторы (НДС, дата разницы, сложный процент, ипотечный и др.);</li>
                  <li>генераторы (QR-кодов, паролей, случайных чисел, коротких ссылок);</li>
                  <li>инструменты для SEO-анализа сайтов;</li>
                  <li>конвертеры (сумма прописью и др.);</li>
                  <li>информационные материалы (статьи, руководства).</li>
                </ul>
                <p>2.3. Все сервисы Сайта предоставляются бесплатно и без регистрации.</p>
              </section>

              <section className="legal-section">
                <h2>3. Правовой статус сервисов</h2>
                <p>3.1. Сервисы сайта QSEN.RU носят информационный и инструментальный характер. Результаты вычислений, генерируемые сервисами (включая калькуляторы НДС, сумму прописью, иные расчёты), носят справочный характер и не являются официальным документом.</p>
                <p>3.2. Администрация не несёт ответственности за соответствие результатов, полученных с использованием Сервисов, требованиям законодательства, нормативных актов, стандартов или договорных обязательств Пользователя.</p>
                <p>3.3. Пользователь самостоятельно несёт ответственность за использование результатов, полученных через сервисы Сайта, в своих целях, включая принятие решений на основании таких результатов.</p>
              </section>

              <section className="legal-section">
                <h2>4. Порядок использования сервисов</h2>
                <p>4.1. Для использования сервисов Сайта Пользователю не требуется регистрация, создание учётной записи или предоставление персональных данных, за исключением случаев добровольного обращения через форму обратной связи.</p>
                <p>4.2. Все расчёты и генерация результатов осуществляются на стороне браузера Пользователя (client-side). Данные, вводимые Пользователем, не передаются на сервер и не сохраняются после завершения сеанса.</p>
                <p>4.3. Пользователь обязуется:</p>
                <ul>
                  <li>использовать Сайт и его сервисы только в законных целях;</li>
                  <li>не использовать Сайт для действий, нарушающих законодательство Российской Федерации или международные нормы;</li>
                  <li>не предпринимать попыток несанкционированного доступа к сервисам, серверному оборудованию или данным других пользователей;</li>
                  <li>не использовать автоматизированные скрипты, программы или иные средства для массового обращения к сервисам Сайта без письменного согласия Администрации;</li>
                  <li>не размещать на Сайте ссылки на материалы, содержащие запрещённую информацию.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>5. Интеллектуальная собственность</h2>
                <p>5.1. Все элементы дизайна, тексты, графические изображения, логотипы, торговые марки и иные объекты интеллектуальной собственности, размещённые на Сайте, являются собственностью Администрации или используются ею на законных основаниях.</p>
                <p>5.2. Копирование, воспроизведение, распространение, переработка или иное использование элементов Сайта без письменного разрешения Администрации запрещено.</p>
                <p>5.3. Пользователь сохраняет права на данные (введённую информацию), которые он вводит для получения результатов через сервисы Сайта.</p>
              </section>

              <section className="legal-section">
                <h2>6. Ограничение ответственности</h2>
                <p>6.1. Сайт и его сервисы предоставляются «как есть» (as is) без каких-либо гарантий, явных или подразумеваемых.</p>
                <p>6.2. Администрация не гарантирует:</p>
                <ul>
                  <li>бесперебойную работу Сайта и его сервисов;</li>
                  <li>отсутствие ошибок или неточностей в работе сервисов;</li>
                  <li>достижение Пользователем ожидаемого результата при использовании сервисов;</li>
                  <li>пригодность сервисов для конкретных целей или задач Пользователя.</li>
                </ul>
                <p>6.3. Администрация не несёт ответственности за:</p>
                <ul>
                  <li>любые убытки (прямые, косвенные, случайные, штрафные санкции, упущенную выгоду), возникшие у Пользователя в результате использования или невозможности использования Сайта;</li>
                  <li>действия третьих лиц, включая других Пользователей;</li>
                  <li>несанкционированный доступ к данным Пользователя, если такой доступ стал результатом действий самого Пользователя;</li>
                  <li>работоспособность внешних сервисов или API, к которым Сайт может обращаться для выполнения отдельных функций.</li>
                </ul>
                <p>6.4. Максимальная совокупная ответственность Администрации перед Пользователем ограничивается суммой 1000 (одна тысяча) рублей.</p>
              </section>

              <section className="legal-section">
                <h2>7. Внешние ссылки и сторонние сервисы</h2>
                <p>7.1. Сайт может содержать ссылки на внешние интернет-ресурсы, принадлежащие третьим лицам. Такие ссылки размещаются исключительно для удобства Пользователя.</p>
                <p>7.2. Администрация не несёт ответственности за содержание, политику конфиденциальности, условия использования или действия владельцев внешних интернет-ресурсов.</p>
                <p>7.3. Решение о переходе на внешние ресурсы и использовании их сервисов принимается Пользователем самостоятельно и на свой риск.</p>
              </section>

              <section className="legal-section">
                <h2>8. Использование файлов cookies и счётчиков</h2>
                <p>8.1. Сайт использует файлы cookies в соответствии с Политикой конфиденциальности, доступной по адресу <a href={`/${language}/privacy`}>Политика конфиденциальности</a>.</p>
                <p>8.2. Используя Сайт, Пользователь выражает согласие на обработку cookies в соответствии с настоящими Правилами и Политикой конфиденциальности.</p>
                <p>8.3. Для сбора статистики посещаемости и анализа использования Сайта применяется сервис Яндекс.Метрика. Подробная информация о принципах работы Яндекс.Метрики и обрабатываемых ею данных представлена в Политике конфиденциальности.</p>
              </section>

              <section className="legal-section">
                <h2>9. Применимое законодательство и разрешение споров</h2>
                <p>9.1. Настоящие Правила регулируются и толкуются в соответствии с законодательством Российской Федерации.</p>
                <p>9.2. Все споры, возникающие из отношений, регулируемых настоящими Правилами, разрешаются путём переговоров. Срок ответа на претензию составляет 30 (тридцать) календарных дней с момента её получения.</p>
                <p>9.3. Если спор не может быть решён путём переговоров, он передаётся на рассмотрение в суд по месту нахождения Администрации в соответствии с процессуальным законодательством Российской Федерации.</p>
              </section>

              <section className="legal-section">
                <h2>10. Заключительные положения</h2>
                <p>10.1. Если какое-либо положение настоящих Правил будет признано недействительным или не имеющим юридической силы, остальные положения остаются в полной силе и действии.</p>
                <p>10.2. Неспользование Администрацией своих прав по настоящим Правилам не означает отказ от этих прав.</p>
                <p>10.3. Все вопросы, не урегулированные настоящими Правилами, решаются в соответствии с законодательством Российской Федерации.</p>
              </section>

              <section className="legal-section">
                <h2>11. Реквизиты Администрации</h2>
                <p>Сайт: QSEN.RU</p>
                <p>Электронная почта для связи: <a href={`/${language}/feedback`}>форма обратной связи на сайте</a></p>
                <p className="legal-date">Дата публикации: 24 апреля 2026 года</p>
              </section>
            </>
          ) : (
            <>
              <section className="legal-section">
                <h2>1. General Provisions</h2>
                <p>1.1. These Terms of Service (hereinafter — "Terms") govern the relationship between the owner of the QSEN.RU website (hereinafter — "Administration") and any person accessing the website and using its services (hereinafter — "User").</p>
                <p>1.2. The Terms constitute a public offer in accordance with Article 437 of the Civil Code of the Russian Federation. The acceptance of the offer is the User's actual use of the website.</p>
                <p>1.3. The Administration reserves the right to modify these Terms at any time without prior notice to the User. The new version of the Terms takes effect from the moment it is posted on the Website, unless otherwise provided by the new version.</p>
                <p>1.4. The User's use of the Website after the amendments come into force constitutes acceptance of the new version of the Terms.</p>
              </section>

              <section className="legal-section">
                <h2>2. Subject of the Agreement</h2>
                <p>2.1. These Terms define the procedure for using the services of the QSEN.RU website, including all tools, calculators, generators and other functionality (hereinafter — "Services").</p>
                <p>2.2. The QSEN.RU website provides users with access to the following categories of services:</p>
                <ul>
                  <li>calculators (VAT, date difference, compound interest, mortgage, etc.);</li>
                  <li>generators (QR codes, passwords, random numbers, short links);</li>
                  <li>SEO analysis tools;</li>
                  <li>converters (amount in words, etc.);</li>
                  <li>informational materials (articles, guides).</li>
                </ul>
                <p>2.3. All website services are provided free of charge and without registration.</p>
              </section>

              <section className="legal-section">
                <h2>3. Legal Status of Services</h2>
                <p>3.1. The QSEN.RU website services are informational and instrumental in nature. The results of calculations generated by the services (including VAT calculators, amounts in words, and other calculations) are for reference purposes only and do not constitute official documents.</p>
                <p>3.2. The Administration is not responsible for the compliance of results obtained through the Services with the requirements of legislation, regulations, standards, or the User's contractual obligations.</p>
                <p>3.3. The User is solely responsible for using the results obtained through the website's services for their purposes, including making decisions based on such results.</p>
              </section>

              <section className="legal-section">
                <h2>4. Terms of Service Use</h2>
                <p>4.1. To use the website's services, the User does not need to register, create an account, or provide personal data, except in cases of voluntary contact through the feedback form.</p>
                <p>4.2. All calculations and result generation are performed on the User's browser side (client-side). The data entered by the User is not transmitted to the server and is not stored after the session ends.</p>
                <p>4.3. The User agrees to:</p>
                <ul>
                  <li>use the Website and its services only for lawful purposes;</li>
                  <li>not use the Website for actions that violate the legislation of the Russian Federation or international norms;</li>
                  <li>not attempt unauthorized access to services, server equipment, or other users' data;</li>
                  <li>not use automated scripts, programs, or other means for mass access to the Website's services without written consent of the Administration;</li>
                  <li>not post links to materials containing prohibited information on the Website.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>5. Intellectual Property</h2>
                <p>5.1. All design elements, texts, graphic images, logos, trademarks, and other intellectual property objects placed on the Website are the property of the Administration or are used by it legally.</p>
                <p>5.2. Copying, reproduction, distribution, modification, or other use of the Website's elements without the written permission of the Administration is prohibited.</p>
                <p>5.3. The User retains rights to the data (input information) that they enter to obtain results through the Website's services.</p>
              </section>

              <section className="legal-section">
                <h2>6. Limitation of Liability</h2>
                <p>6.1. The Website and its services are provided "as is" without any warranties, express or implied.</p>
                <p>6.2. The Administration does not guarantee:</p>
                <ul>
                  <li>uninterrupted operation of the Website and its services;</li>
                  <li>absence of errors or inaccuracies in the services;</li>
                  <li>the User achieving expected results when using the services;</li>
                  <li>the suitability of services for the User's specific purposes or tasks.</li>
                </ul>
                <p>6.3. The Administration is not liable for:</p>
                <ul>
                  <li>any damages (direct, indirect, incidental, punitive damages, lost profits) incurred by the User as a result of using or inability to use the Website;</li>
                  <li>actions of third parties, including other Users;</li>
                  <li>unauthorized access to the User's data, if such access resulted from the User's own actions;</li>
                  <li>the performance of external services or APIs that the Website may access to perform certain functions.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>7. External Links and Third-Party Services</h2>
                <p>7.1. The Website may contain links to external Internet resources belonging to third parties. Such links are provided solely for the User's convenience.</p>
                <p>7.2. The Administration is not responsible for the content, privacy policy, terms of use, or actions of the owners of external Internet resources.</p>
                <p>7.3. The decision to go to external resources and use their services is made by the User independently and at their own risk.</p>
              </section>

              <section className="legal-section">
                <h2>8. Use of Cookies and Trackers</h2>
                <p>8.1. The Website uses cookies in accordance with the Privacy Policy available at <a href={`/${language}/privacy`}>Privacy Policy</a>.</p>
                <p>8.2. By using the Website, the User consents to the processing of cookies in accordance with these Terms and the Privacy Policy.</p>
                <p>8.3. Yandex.Metrica service is used to collect visit statistics and analyze Website usage. Detailed information about Yandex.Metrica's operation principles and data it processes is provided in the Privacy Policy.</p>
              </section>

              <section className="legal-section">
                <h2>9. Applicable Law and Dispute Resolution</h2>
                <p>9.1. These Terms are governed by and construed in accordance with the laws of the Russian Federation.</p>
                <p>9.2. All disputes arising from the relations governed by these Terms are resolved through negotiations. The response time to a claim is 30 (thirty) calendar days from the date of its receipt.</p>
                <p>9.3. If a dispute cannot be resolved through negotiations, it is referred to the court at the Administration's location in accordance with the procedural legislation of the Russian Federation.</p>
              </section>

              <section className="legal-section">
                <h2>10. Final Provisions</h2>
                <p>10.1. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions remain in full force and effect.</p>
                <p>10.2. The Administration's failure to exercise its rights under these Terms does not mean waiver of those rights.</p>
                <p>10.3. All issues not regulated by these Terms are resolved in accordance with the legislation of the Russian Federation.</p>
              </section>

              <section className="legal-section">
                <h2>11. Administration Details</h2>
                <p>Website: QSEN.RU</p>
                <p>Contact email: <a href={`/${language}/feedback`}>feedback form on the website</a></p>
                <p className="legal-date">Publication date: April 24, 2026</p>
              </section>
            </>
          )}
        </div>
      </ToolPageShell>
    </>
  )
}

export default Terms