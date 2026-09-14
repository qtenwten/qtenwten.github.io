const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/engine-Bv6eSXtS.js","assets/i18n-CArYEWHH.js"])))=>i.map(i=>d[i]);
import{i as e}from"./rolldown-runtime-aKtaBQYM.js";import{r as t}from"./react-dom-vendor-BBV6OTrx.js";import{n,y as r}from"./LanguageContext-DYrkUah_.js";import{t as i}from"./react-vendor-DKdBMi_L.js";import{S as a}from"./index-D8d9vfu4.js";import{t as o}from"./i18n-CArYEWHH.js";import{i as s,n as c}from"./ToolPageShell-B_Ne6HRJ.js";var l=e(t(),1),u=`<section class="card">
<h2>STRATZ API</h2>
<div class="token-grid">
  <label class="dota-visually-hidden" for="token">STRATZ API token</label>
  <input id="token" type="password" autocomplete="off" spellcheck="false" placeholder="Вставь STRATZ API Token">
  <button id="testToken" type="button">Проверить токен</button>
  <label class="remember"><input id="rememberToken" type="checkbox"> сохранить локально</label>
</div>
<div class="status"><span id="tokenDot" class="dot"></span><span id="tokenStatus">Не проверено</span></div>
<div class="schema-box" id="schemaInfo">Схема ещё не прочитана.</div>
<div class="notice">Токен остаётся в браузере. В лог, CSV и ссылку на матч он не попадает.</div>
</section>

<section class="card">
<div class="players-head">
  <h2>Игроки</h2>
  <button id="selectAllPlayers" type="button">Выбрать всех</button>
</div>
<div id="roster" class="roster"></div>
<div class="add-grid">
  <label class="dota-visually-hidden" for="newName">Имя / прозвище</label>
  <input id="newName" type="text" autocomplete="off" placeholder="Имя / прозвище">
  <label class="dota-visually-hidden" for="newId">Steam Account ID или SteamID64</label>
  <input id="newId" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Account ID / SteamID64">
  <button id="addPlayer" type="button">Добавить</button>
</div>
</section>

<section class="card" id="filtersCard">
<h2>Фильтры</h2>

<div class="basic-grid">
  <label>Как играли выбранные
    <select id="relationship">
      <option value="same_party">В одной party</option>
      <option value="same_team">В одной команде</option>
      <option value="any">Просто в одном матче</option>
      <option value="opponents">Друг против друга</option>
    </select>
    <div id="relationshipHint" class="cap-note"></div>
  </label>
  <label>Сколько выбранных должно быть в матче
    <select id="groupMin"></select>
    <div id="groupMinHint" class="cap-note"></div>
  </label>
  <label>Чью победу считать
    <select id="perspective"></select>
    <div id="perspectiveHint" class="cap-note"></div>
  </label>
  <label>Дата от
    <input id="dateFrom" type="date">
  </label>
  <label>Дата до
    <input id="dateTo" type="date">
  </label>
</div>

<div class="filter-toolbar">
  <button id="resetFilters" type="button">Сбросить доп. фильтры</button>
  <span class="filter-count" id="filterCount">Активно: 0</span>
</div>
<div class="active-filters" id="activeFilters"></div>

<details class="filter-group">
  <summary>Матч: режим, патч, длительность, сторона</summary>
  <div class="group-body">
    <div class="grid4">
      <label>Режим игры
        <select id="simpleMode">
          <option value="">Любой</option>
          <option value="ranked">Рейтинг</option>
          <option value="unranked">Обычная / нерейтинг</option>
          <option value="turbo">Turbo</option>
          <option value="all_pick">All Pick</option>
          <option value="single_draft">Single Draft</option>
          <option value="all_random">All Random</option>
          <option value="random_draft">Random Draft</option>
          <option value="ability_draft">Ability Draft</option>
          <option value="captains_mode">Captain's Mode</option>
          <option value="all_random_deathmatch">All Random Deathmatch</option>
          <option value="mid_1v1">1v1 Mid</option>
        </select>
      </label>
      <label>Патч
        <select id="patchId"><option value="">Любой</option></select>
      </label>
      <label>Период относительно 7.40
        <select id="patch740Period">
          <option value="">Все матчи</option>
          <option value="pre">До 7.40</option>
          <option value="post">7.40 и новее</option>
        </select>
        <div class="cap-note">7.40 вышел 15.12.2025.</div>
      </label>
      <label>Сторона выбранного игрока
        <select id="side">
          <option value="">Любая</option>
          <option value="radiant">Radiant</option>
          <option value="dire">Dire</option>
        </select>
      </label>
      <label>Длительность, минут
        <div class="range-pair">
          <input id="durationMin" type="number" min="0" step="1" placeholder="от">
          <input id="durationMax" type="number" min="0" step="1" placeholder="до">
        </div>
      </label>
      <label>Размер party выбранного игрока
        <select id="partySize">
          <option value="">Любой</option>
          <option value="1">Solo</option><option value="2">2</option><option value="3">3</option>
          <option value="4">4</option><option value="5">5</option>
        </select>
      </label>
      <label data-cap="rank">Средний ранг матча
        <div class="range-pair">
          <input id="rankMin" type="number" min="0" placeholder="от">
          <input id="rankMax" type="number" min="0" placeholder="до">
        </div>
      </label>
    </div>
  </div>
</details>

<details class="filter-group">
  <summary>Состав: кто должен / не должен быть в матче</summary>
  <div class="group-body">
    <div class="grid3">
      <label>Герой у союзников
        <select id="allyHero"><option value="">Любой</option></select>
      </label>
      <label>Герой у противников
        <select id="enemyHero"><option value="">Любой</option></select>
      </label>
      <label>Проверять относительно
        <select id="compositionTarget"></select>
      </label>
    </div>
    <div style="margin-top:12px">
      <div class="small">Не должно быть в матче:</div>
      <div class="check-row" id="excludePlayers"></div>
    </div>
    <div style="margin-top:10px">
      <label class="check-label"><input id="exactRosterParty" type="checkbox"> В party не должно быть других игроков из нашей сохранённой шестёрки</label>
    </div>
  </div>
</details>

<details class="filter-group">
  <summary>Статистика игрока: K/D/A, фарм, урон, варды</summary>
  <div class="group-body">
    <div class="notice" style="margin:0 0 10px">Если STRATZ не имеет parsed-данных для метрики, матч считается «нет данных», а не нулём. При активном числовом фильтре такой матч не проходит.</div>
    <div class="grid3">
      <label>Игрок для статистики
        <select id="metricTarget"></select>
      </label>
      <label>Убийства
        <div class="range-pair"><input id="killsMin" type="number" min="0" placeholder="от"><input id="killsMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label>Смерти
        <div class="range-pair"><input id="deathsMin" type="number" min="0" placeholder="от"><input id="deathsMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label>Ассисты
        <div class="range-pair"><input id="assistsMin" type="number" min="0" placeholder="от"><input id="assistsMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label>KDA
        <div class="range-pair"><input id="kdaMin" type="number" min="0" step="0.1" placeholder="от"><input id="kdaMax" type="number" min="0" step="0.1" placeholder="до"></div>
      </label>
      <label data-cap="gpm">GPM
        <div class="range-pair"><input id="gpmMin" type="number" min="0" placeholder="от"><input id="gpmMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="xpm">XPM
        <div class="range-pair"><input id="xpmMin" type="number" min="0" placeholder="от"><input id="xpmMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="lastHits">Last Hits
        <div class="range-pair"><input id="lhMin" type="number" min="0" placeholder="от"><input id="lhMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="networth">Net Worth
        <div class="range-pair"><input id="netMin" type="number" min="0" placeholder="от"><input id="netMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="heroDamage">Hero Damage
        <div class="range-pair"><input id="heroDmgMin" type="number" min="0" placeholder="от"><input id="heroDmgMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="towerDamage">Tower Damage
        <div class="range-pair"><input id="towerDmgMin" type="number" min="0" placeholder="от"><input id="towerDmgMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="heroHealing">Healing
        <div class="range-pair"><input id="healMin" type="number" min="0" placeholder="от"><input id="healMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="observerWardsPlaced">Поставлено Observer
        <div class="range-pair"><input id="obsMin" type="number" min="0" placeholder="от"><input id="obsMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="sentryWardsPlaced">Поставлено Sentry
        <div class="range-pair"><input id="sentryMin" type="number" min="0" placeholder="от"><input id="sentryMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="wardsDestroyed">Сломано вардов
        <div class="range-pair"><input id="wardsDestroyedMin" type="number" min="0" placeholder="от"><input id="wardsDestroyedMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="courierKills">Убито курьеров
        <div class="range-pair"><input id="courierMin" type="number" min="0" placeholder="от"><input id="courierMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="buybackCount">Buybacks
        <div class="range-pair"><input id="buybackMin" type="number" min="0" placeholder="от"><input id="buybackMax" type="number" min="0" placeholder="до"></div>
        <div class="cap-note">В массовом анализе используется лёгкий buybackCount. Если его нет, Buyback автоматически догружается для одного матча при нажатии «Подробнее».</div>
      </label>
      <label data-cap="campsStacked">Стаки лагерей
        <div class="range-pair"><input id="stacksMin" type="number" min="0" placeholder="от"><input id="stacksMax" type="number" min="0" placeholder="до"></div>
      </label>
    </div>
  </div>
</details>

<details class="filter-group">
  <summary>Предметы</summary>
  <div class="group-body">
    <div class="grid3">
      <label>Игрок
        <select id="itemTarget"></select>
      </label>
      <label data-cap="items">Есть в финальном инвентаре
        <input id="itemInclude" type="text" list="itemList" placeholder="Например: Black King Bar">
      </label>
      <label data-cap="items">Не должно быть
        <input id="itemExclude" type="text" list="itemList" placeholder="Например: Radiance">
      </label>
    </div>
    <datalist id="itemList"></datalist>
    <div class="unsupported">Тайминг покупки предмета требует purchase log. v11 не делает тяжёлый запрос логов для каждого матча, чтобы не потерять скорость.</div>
  </div>
</details>

<details class="filter-group">
  <summary>День недели, время суток и номер игры в сессии</summary>
  <div class="group-body">
    <div class="small" style="margin-bottom:6px">Дни недели</div>
    <div class="day-grid">
      <label class="day-chip"><input class="weekday" value="1" type="checkbox">Пн</label>
      <label class="day-chip"><input class="weekday" value="2" type="checkbox">Вт</label>
      <label class="day-chip"><input class="weekday" value="3" type="checkbox">Ср</label>
      <label class="day-chip"><input class="weekday" value="4" type="checkbox">Чт</label>
      <label class="day-chip"><input class="weekday" value="5" type="checkbox">Пт</label>
      <label class="day-chip"><input class="weekday" value="6" type="checkbox">Сб</label>
      <label class="day-chip"><input class="weekday" value="0" type="checkbox">Вс</label>
    </div>
    <div class="grid3" style="margin-top:11px">
      <label>Время от
        <input id="timeFrom" type="time">
      </label>
      <label>Время до
        <input id="timeTo" type="time">
      </label>
      <label>Номер игры в сессии
        <select id="sessionGame">
          <option value="">Любая</option><option value="1">1-я</option><option value="2">2-я</option>
          <option value="3">3-я</option><option value="4">4-я</option><option value="5plus">5-я и позже</option>
        </select>
      </label>
      <label>Новая сессия после перерыва
        <select id="sessionGap">
          <option value="60">60 минут</option><option value="90" selected>90 минут</option><option value="120">120 минут</option><option value="180">180 минут</option>
        </select>
      </label>
    </div>
    <div class="cap-note">«Номер игры в сессии» считается по полной истории выбранного anchor в диапазоне найденных матчей, включая игры на других героях.</div>
  </div>
</details>

<details class="filter-group">
  <summary>Ход матча: comeback, throw, Roshan, First Blood</summary>
  <div class="group-body">
    <div class="grid3">
      <label data-cap="networthLeads">Comeback: отыграли дефицит золота
        <input id="comebackMin" type="number" min="0" step="500" placeholder="например 10000">
      </label>
      <label data-cap="networthLeads">Throw: потеряли преимущество
        <input id="throwMin" type="number" min="0" step="500" placeholder="например 10000">
      </label>
      <label data-cap="roshanKills">Roshan kills команды игрока
        <div class="range-pair"><input id="roshanMin" type="number" min="0" placeholder="от"><input id="roshanMax" type="number" min="0" placeholder="до"></div>
      </label>
      <label data-cap="firstBloodTime">First Blood не позже, секунд
        <input id="firstBloodMax" type="number" min="0" placeholder="например 120">
      </label>
    </div>
    <div class="unsupported">Draft order, точный победитель линии к 10-й минуте и тайминги крупных предметов требуют более тяжёлых timeline/draft-данных. Они намеренно не загружаются в обычном поиске, чтобы анализ оставался быстрым.</div>
  </div>
</details>

<div class="basic-grid" style="margin-top:12px">
  <label>Сколько матчей просматривать
    <select id="maxMatches">
      <option value="250">Последние 250</option>
      <option value="500">Последние 500</option>
      <option value="1000">Последние 1000</option>
      <option value="2500">Последние 2500</option>
      <option value="5000">Последние 5000</option>
      <option value="10000">Последние 10 000</option>
      <option value="all">Вся доступная история</option>
    </select>
  </label>
  <div>
    <div style="font-size:13px;color:#c8cbd0;margin-bottom:5px">Загрузка STRATZ</div>
    <div class="unsupported" style="margin-top:0">STRATZ отдаёт до 100 матчей за запрос. v13 сохраняет полученные матчи в IndexedDB: полная история источника скачивается один раз, затем проверяется только новый хвост. В режиме ротаций локально объединяются все нужные пятёрки.</div>
  </div>
</div>

<div class="local-db">
  <div class="local-db-head">
    <div>
      <h3>Локальная база матчей</h3>
      <div id="localDbStatus" class="small">Инициализация IndexedDB…</div>
    </div>
    <label class="check-label"><input id="autoSync" type="checkbox" checked> Автоматически докачивать новые матчи</label>
  </div>
  <div class="local-db-stats">
    <div class="local-db-stat"><span>Матчей локально</span><b id="localDbMatches">0</b></div>
    <div class="local-db-stat"><span>Источников истории</span><b id="localDbSources">0</b></div>
    <div class="local-db-stat"><span>Последняя синхронизация</span><b id="localDbLastSync"> - </b></div>
    <div class="local-db-stat"><span>Хранилище браузера</span><b id="localDbStorage"> - </b></div>
  </div>
  <div class="local-db-controls">
    <button id="syncLocal" type="button">Синхронизировать выбранных</button>
    <button id="fullResyncLocal" type="button">Полная пересинхронизация</button>
    <button id="clearCache" type="button">Очистить локальную базу</button>
  </div>
  <div class="local-db-note">Первый анализ сохраняет историю в IndexedDB. Следующие анализы фильтруют локальные матчи и обычно делают 0 запросов. Не чаще чем раз в 6 часов автосинхронизация проверяет только свежий хвост; если новых матчей нет, старая история заново не скачивается.</div>
</div>

<div class="controls" style="margin-top:12px">
  <button id="analyze" type="button">Анализировать</button>
  <button id="stop" type="button" disabled>Остановить</button>
  <button id="csv" type="button" disabled title="Самодостаточный CSV по последнему выполненному анализу">Скачать CSV для анализа</button>
  <span class="cap-note">CSV запоминает именно последнюю выполненную выборку и содержит данные, достаточные для повторного анализа без STRATZ-токена.</span>
  <button id="compare740" type="button" disabled>Сравнить до / после 7.40</button>
  <label class="check-label"><input id="forceRefresh" type="checkbox"> Проверить новые данные сейчас</label>
</div>
</section>

<section class="card">
<h2>Результат</h2>
<div id="progress" class="muted">Проверь токен и выбери хотя бы одного игрока.</div>
<div class="progressbar"><div id="bar"></div></div>
<div id="stats" class="stats" hidden>
  <div class="stat"><span>GraphQL запросов</span><b id="requests">0</b></div>
  <div class="stat"><span>Кандидатов</span><b id="received">0</b></div>
  <div class="stat"><span>Под фильтром</span><b id="matched">0</b></div>
  <div class="stat"><span>Победы</span><b id="wins">0</b></div>
  <div class="stat"><span>Поражения</span><b id="losses">0</b></div>
  <div class="stat"><span>Винрейт</span><b id="wr">0%</b></div>
  <div class="stat"><span>Страниц</span><b id="pages">0</b></div>
  <div class="stat"><span>Кэш</span><b id="cacheHit">нет</b></div>
</div>
<div id="utilitySummary" class="stats" hidden style="margin-top:10px">
  <div class="stat"><span>Курьеры</span><b id="sumCouriers"> - </b><small id="covCouriers" class="coverage"> - </small></div>
  <div class="stat"><span>Сломано вардов</span><b id="sumWardsDestroyed"> - </b><small id="covWardsDestroyed" class="coverage"> - </small></div>
  <div class="stat"><span>Observer поставлено</span><b id="sumObsPlaced"> - </b><small id="covObsPlaced" class="coverage"> - </small></div>
  <div class="stat"><span>Sentry поставлено</span><b id="sumSentryPlaced"> - </b><small id="covSentryPlaced" class="coverage"> - </small></div>
  <div class="stat"><span>Стаки</span><b id="sumStacks"> - </b><small id="covStacks" class="coverage"> - </small></div>
  <div class="stat"><span>Buybacks</span><b id="sumBuybacks"> - </b><small id="covBuybacks" class="coverage"> - </small></div>
</div>
<div class="small" id="utilitySummaryLabel" style="margin-top:6px"></div>

<div id="groupSummary" class="group-summary" hidden>
  <div class="group-summary-head">
    <div>
      <h3>Ротации состава</h3>
      <div id="groupSummaryMeta" class="small"></div>
    </div>
  </div>
  <div class="party-player-wr">
    <div class="party-player-wr-head">
      <div>
        <b>WR пати с игроком</b>
        <span class="small">По текущей выборке. Учитываются только матчи, где игрок был в вашей пятёрке и результат известен.</span>
      </div>
      <div id="partyPlayerWrExtremes" class="party-player-wr-extremes"></div>
    </div>
    <div id="partyPlayerWrRows" class="party-player-wr-row"></div>
  </div>

  <div class="table-wrap">
    <table class="group-combo-table">
      <thead><tr><th>Кто играл</th><th>Кого не было</th><th>Матчи</th><th>В - П</th><th>WR</th></tr></thead>
      <tbody id="groupComboRows"></tbody>
    </table>
  </div>
  <div id="groupAbsenceSummary" class="group-absence-summary"></div>
</div>

<div id="patch740Compare" class="patch-compare" hidden>
  <div class="patch-compare-head">
    <div>
      <h3>Сравнение до / после патча 7.40</h3>
      <div class="small">7.40 вышел 15.12.2025. Сравнение применяется к найденным матчам. Чтобы увидеть обе стороны сравнения, оставь «Период относительно 7.40» = «Все матчи».</div>
    </div>
  </div>
  <div class="patch-compare-grid">
    <div class="stat patch-side">
      <span>До 7.40</span>
      <b id="pre740wr"> - </b>
      <small id="pre740meta" class="coverage"> - </small>
    </div>
    <div class="stat patch-side">
      <span>7.40 и новее</span>
      <b id="post740wr"> - </b>
      <small id="post740meta" class="coverage"> - </small>
    </div>
    <div class="stat patch-side">
      <span>Разница WR</span>
      <b id="delta740wr"> - </b>
      <small id="delta740meta" class="coverage">после − до</small>
    </div>
  </div>
</div>

<div class="small" id="cacheInfo" style="margin-top:6px"></div>
<div id="error"></div>
<div id="log" class="log">Диагностика появится здесь.</div>
</section>

<section class="card">
<h2>Матчи</h2>
<div class="small" style="margin:-5px 0 10px">\`pos  - \` означает, что STRATZ не передал позицию игрока для этого матча. Это не связано с результатом матча.</div>
<div class="table-wrap">
<table>
<thead><tr><th class="match-no-col">№</th><th>Дата</th><th>Match ID</th><th>Результат</th><th>Выбранные игроки</th><th>Длительность</th><th></th></tr></thead>
<tbody id="results"></tbody>
</table>
</div>
</section>
`,d=i();function f({language:e}){let t=(0,l.useRef)(null),n=(0,l.useMemo)(()=>o(u,e),[e]);return(0,l.useEffect)(()=>{let n=()=>{},i=!0;return r(async()=>{let{mountDotaAnalyzer:e}=await import(`./engine-Bv6eSXtS.js`);return{mountDotaAnalyzer:e}},__vite__mapDeps([0,1])).then(({mountDotaAnalyzer:r})=>{!i||!t.current||(n=r({locale:e,root:t.current}))}),()=>{i=!1,n()}},[e]),(0,d.jsx)(`div`,{ref:t,className:`dota-analyzer`,"data-dota-analyzer-root":!0,dangerouslySetInnerHTML:{__html:n}})}var p={ru:{title:`Анализатор пати Dota 2`,intro:`Анализируйте историю матчей одного игрока или постоянной группы друзей. Сравнивайте винрейт составов, героев и позиций, исследуйте ротации 5 из 6 или 5 из 7 игроков и результаты до и после патча 7.40.`,tokenNote:`Данные загружаются через STRATZ. Нужен личный STRATZ API token: он используется непосредственно браузером и не отправляется на сервер qsen.ru.`,guideTitle:`Как пользоваться анализатором Dota 2`,guideSteps:[`Откройте официальную страницу STRATZ API, войдите через Steam и скопируйте личный API token.`,`Вставьте token в поле STRATZ API. Сохраняйте его локально только на своём устройстве.`,`Добавьте игроков по Steam Account ID. Можно вставить и числовой SteamID64, он будет преобразован локально.`,`Выберите одного или нескольких игроков. Для постоянной компании удобно нажать «Выбрать всех».`,`Если в roster 6 или 7 игроков, выберите минимум участников для ротации, например 5 из 7.`,`Оставьте perspective «Группа (по стороне состава)», чтобы считать общий результат команды во всех ротациях.`,`Нажмите «Анализировать». При первом запуске дождитесь полной синхронизации нужной истории.`,`Следующие анализы используют локальную базу и при необходимости докачивают только новые матчи.`],accountTitle:`Steam Account ID, SteamID64 и ссылка на профиль`,accountText:`Steam Account ID - это 32-битный числовой идентификатор Dota 2. Он не равен ссылке на профиль и не равен 17-значному SteamID64. Поле добавления игрока принимает Account ID или числовой SteamID64. Преобразование SteamID64 выполняется только в браузере; vanity URL вида steamcommunity.com/id/name автоматически преобразовать нельзя.`,tokenTitle:`Как получить STRATZ API token`,tokenText:`Перейдите на страницу STRATZ API, войдите через Steam и скопируйте token из своего профиля API. Интерфейс страницы доступен только после входа. qsen не выдаёт tokens и использует ваш token только как Bearer credential для запросов к STRATZ GraphQL.`,tokenLink:`Открыть официальную страницу STRATZ API`,rotationTitle:`Анализ группы и ротаций`,rotationText:`Добавьте постоянный roster один раз, затем выбирайте нужную часть компании. Анализатор проверяет точные Account IDs, сторону команды и активные фильтры, поэтому матчи соперников не смешиваются с матчами одной команды.`,rotationFiveTitle:`Как работает режим 5 из 7`,rotationFiveText:`Если есть 7 постоянных игроков, а одновременно играют 5, анализатор перебирает C(7,5) = 21 возможный состав и объединяет найденные матчи. Повторяющиеся Match IDs удаляются. Для каждой пятёрки показываются матчи, W-L и WR, а отдельные карточки показывают WR пати с каждым участником. Игрок может отсутствовать в конкретной игре; perspective группы привязывает результат к стороне найденной пятёрки.`,statsTitle:`Что показывает статистика`,statsText:`Фильтры охватывают героев, позиции, режимы, lobby, патчи, даты, дни недели, время, состав, K/D/A, фарм, урон, utility stats, предметы, Roshan, First Blood, comeback и throw. Детали матча показывают Radiant и Dire, инвентарь, backpack, neutral item, buybacks и coverage. Неизвестное значение не подменяется нулём.`,syncTitle:`Как работает синхронизация`,syncText:`Первый запуск загружает нужную историю и сохраняет матчи в IndexedDB браузера, привязанной к qsen.ru. Повторный анализ использует локальные данные, а синхронизация проверяет новые или изменившиеся матчи без повторной загрузки всей истории. Полная пересинхронизация нужна редко. Очистка данных сайта может удалить базу; данные standalone-файла file:// автоматически на qsen.ru не переносятся.`,privacyTitle:`STRATZ API token и конфиденциальность`,privacyText:`STRATZ API token используется непосредственно вашим браузером для запросов к STRATZ. qsen.ru не отправляет его на свой сервер. Token не добавляется в URL, CSV, аналитику, SSR HTML или structured data. Сохранение в localStorage выключено по умолчанию и включается только вашим выбором.`,faqTitle:`Частые вопросы`},en:{title:`Dota 2 Party & Match Analyzer`,intro:`Analyze match history for one player or a regular group of friends. Compare lineup, hero, and role win rates, explore 5-of-6 or 5-of-7 rotations, and measure results before and after patch 7.40.`,tokenNote:`Match data comes from STRATZ. You need a personal STRATZ API token; your browser uses it directly and never sends it to a qsen.ru server.`,guideTitle:`How to use the Dota 2 Party Analyzer`,guideSteps:[`Open the official STRATZ API page, sign in with Steam, and copy your personal API token.`,`Paste the token into the STRATZ API field. Save it locally only on a device you control.`,`Add players by Steam Account ID. You can also paste a numeric SteamID64 and convert it locally.`,`Select one or more players. For a regular group, Select all is the quickest starting point.`,`For a six-player or seven-player roster, choose the rotation threshold, such as at least 5 of 7.`,`Keep Result perspective set to Party / team side to calculate the team’s overall win rate across rotations.`,`Select Analyze matches. The first run may take time while the required history is synchronized.`,`Later analyses use the local database and fetch only new matches when a synchronization is due.`],accountTitle:`Steam Account ID, SteamID64, and profile URLs`,accountText:`A Steam Account ID is the 32-bit numeric identifier used by Dota 2. It is not a profile URL and it is not the 17-digit SteamID64. The player field accepts an Account ID or numeric SteamID64. SteamID64 conversion happens only in your browser; a vanity URL such as steamcommunity.com/id/name cannot be converted without an external lookup.`,tokenTitle:`How to get a STRATZ API token`,tokenText:`Open the STRATZ API page, sign in with Steam, and copy the token from your API profile. The token controls are visible only after sign-in. qsen does not issue STRATZ tokens and uses yours only as a Bearer credential for STRATZ GraphQL requests.`,tokenLink:`Open the official STRATZ API page`,rotationTitle:`Party analysis and lineup rotations`,rotationText:`Save your regular roster once, then select the group you want to analyze. The analyzer checks exact Account IDs, team side, and every active filter, so games as opponents are not mixed with games on the same team.`,rotationFiveTitle:`How the 5-of-7 rotation mode works`,rotationFiveText:`With seven regular players and five playing at a time, the analyzer checks all C(7,5) = 21 possible lineups and merges their matches. Duplicate Match IDs are removed. You get games, W-L, and win rate for every five-player lineup, plus party win rate with each player. A player may be absent from a particular game; Party / team side ties the result to the side of the lineup that was found.`,statsTitle:`What the analyzer measures`,statsText:`Filters cover heroes, positions, game modes, lobby, patches, dates, weekdays, time, lineup, K/D/A, farm, damage, utility stats, items, Roshan, First Blood, comebacks, and throws. Match details show Radiant and Dire, inventory, backpack, neutral items, buybacks, and data coverage. An unknown value is never treated as zero.`,syncTitle:`How local match synchronization works`,syncText:`The first run downloads the required history and stores matches in IndexedDB for qsen.ru. Later analyses use local data, while synchronization checks for new or changed matches without downloading old history again. Full resync is rarely needed. Clearing browser or site data can remove the database; data from a standalone file:// version does not migrate to qsen.ru automatically.`,privacyTitle:`STRATZ API token and privacy`,privacyText:`Your browser uses the STRATZ API token directly for requests to STRATZ. qsen.ru does not send it to its server. The token is never placed in URLs, CSV exports, analytics, SSR HTML, or structured data. localStorage saving is off by default and happens only if you choose it.`,faqTitle:`Frequently asked questions`}},m={ru:[[`Что умеет Dota 2 Party Analyzer?`,`Он анализирует историю одного игрока или группы: составы, винрейт, героев, позиции, патчи, utility stats, детали матчей и ротации игроков.`],[`Нужен ли STRATZ API token?`,`Да, для первой загрузки и последующей синхронизации. Уже сохранённые локальные матчи можно анализировать без token.`],[`Где получить STRATZ token?`,`На официальной странице stratz.com/api после входа через Steam. qsen не создаёт и не выдаёт STRATZ tokens.`],[`Передаёт ли qsen мой token на сервер?`,`Нет. Браузер отправляет его непосредственно STRATZ в заголовке Authorization.`],[`Что такое Steam Account ID?`,`Это числовой 32-битный идентификатор Dota 2. Он отличается от SteamID64 и URL профиля.`],[`Можно ли анализировать одного игрока?`,`Да. Выберите одного игрока, затем применяйте фильтры героев, позиций, патчей и статистики.`],[`Можно ли анализировать группу из 6 или 7 игроков?`,`Да. Выберите всех и задайте минимальное число участников матча, обычно 5.`],[`Что означает режим 5 из 7?`,`Анализатор проверяет все 21 возможную пятёрку, объединяет матчи без дублей и считает результат со стороны каждой найденной команды.`],[`Почему некоторые позиции отображаются как «-»?`,`STRATZ не всегда передаёт позицию для исторического матча. Это отсутствие данных, а не ошибка результата.`],[`Почему некоторые показатели могут быть без данных?`,`Часть матчей не имеет полных parsed-данных STRATZ. Анализатор показывает coverage и не заменяет неизвестное значение нулём.`],[`Почему сумма utility stats иногда является минимумом?`,`Если coverage неполное, сумма включает только известные значения. Фактическое значение может быть выше.`],[`Нужно ли каждый раз заново скачивать все матчи?`,`Нет. После полной первой синхронизации анализ обычно идёт локально, а сеть проверяет только новые страницы.`],[`Где хранятся скачанные матчи?`,`В IndexedDB текущего браузера для origin qsen.ru.`],[`Что делает «Полная пересинхронизация»?`,`Она заново строит выбранные источники истории. Используйте её при подозрении на неполные или изменившиеся данные.`],[`Можно ли сравнить результаты до и после патча 7.40?`,`Да. Оставьте период 7.40 на «Все матчи», выполните анализ и откройте сравнение.`],[`Можно ли скачать данные?`,`Да. CSV содержит match-level данные, выбранных и отсутствующих игроков, result source, фильтры и подробные player stats. Token в CSV не попадает.`],[`Почему STRATZ иногда ограничивает запросы?`,`У STRATZ есть пользовательские лимиты API. При HTTP 429 анализатор ждёт и повторяет запрос с backoff.`],[`Работает ли анализатор бесплатно?`,`Инструмент qsen бесплатный. Доступ к STRATZ регулируется правилами и лимитами вашего STRATZ token.`]],en:[[`What can the Dota 2 Party Analyzer do?`,`It analyzes one player or a group across lineups, win rate, heroes, positions, patches, utility stats, match details, and player rotations.`],[`Do I need a STRATZ API token?`,`Yes, for the first download and later synchronization. Matches already stored locally can be analyzed without a token.`],[`Where can I get a STRATZ token?`,`Use the official stratz.com/api page after signing in with Steam. qsen does not create or issue STRATZ tokens.`],[`Does qsen send my token to its server?`,`No. Your browser sends it directly to STRATZ in the Authorization header.`],[`What is a Steam Account ID?`,`It is the 32-bit numeric identifier used by Dota 2. It differs from SteamID64 and from a profile URL.`],[`Can I analyze one player?`,`Yes. Select one player, then filter by heroes, positions, patches, or match statistics.`],[`Can I analyze a group of six or seven players?`,`Yes. Select the full roster and set the required player count, usually five.`],[`What does 5 of 7 mean?`,`The analyzer checks all 21 five-player lineups, deduplicates matches, and counts the result from the side of each lineup found.`],[`Why is a position sometimes shown as “-”?`,`STRATZ does not provide a position for every historical match. Missing position data does not affect the match result.`],[`Why are some metrics unavailable?`,`Some matches lack complete STRATZ parsed data. The analyzer reports coverage and does not turn unknown values into zero.`],[`Why is a utility stat total sometimes a minimum?`,`With partial coverage, the total includes only known values. The true value may be higher.`],[`Must I download every match again each time?`,`No. After the first full synchronization, analysis is local and network sync checks only the newest pages.`],[`Where are downloaded matches stored?`,`In IndexedDB in this browser, scoped to the qsen.ru origin.`],[`What does Full resync do?`,`It rebuilds the selected history sources from STRATZ. Use it only when data appears incomplete or has changed.`],[`Can I compare results before and after patch 7.40?`,`Yes. Keep the 7.40 filter on All matches, run the analysis, then open the comparison.`],[`Can I download the data?`,`Yes. CSV includes match-level data, present and absent players, result source, filters, and detailed player stats. It never includes the token.`],[`Why does STRATZ sometimes rate-limit requests?`,`STRATZ applies limits to API tokens. On HTTP 429 the analyzer waits and retries with backoff.`],[`Is the analyzer free?`,`The qsen tool is free. STRATZ access remains subject to the terms and limits of your STRATZ token.`]]};function h(){let{language:e}=n(),t=p[e],r=m[e];return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(a,{path:`/dota2`}),(0,d.jsxs)(s,{className:`dota2-page`,title:t.title,subtitle:t.intro,note:t.tokenNote,icon:`casino`,sidebar:null,adSlot:!1,children:[(0,d.jsx)(f,{language:e}),(0,d.jsxs)(c,{className:`dota2-guide`,children:[(0,d.jsxs)(`section`,{"aria-labelledby":`dota-guide-title`,children:[(0,d.jsx)(`h2`,{id:`dota-guide-title`,children:t.guideTitle}),(0,d.jsx)(`ol`,{children:t.guideSteps.map(e=>(0,d.jsx)(`li`,{children:e},e))})]}),(0,d.jsxs)(`section`,{"aria-labelledby":`dota-account-title`,children:[(0,d.jsx)(`h2`,{id:`dota-account-title`,children:t.accountTitle}),(0,d.jsx)(`p`,{children:t.accountText})]}),(0,d.jsxs)(`section`,{className:`dota2-token-guide`,"aria-labelledby":`dota-token-title`,children:[(0,d.jsx)(`h2`,{id:`dota-token-title`,children:t.tokenTitle}),(0,d.jsx)(`p`,{children:t.tokenText}),(0,d.jsx)(`a`,{href:`https://stratz.com/api`,target:`_blank`,rel:`noopener noreferrer`,children:t.tokenLink})]}),(0,d.jsxs)(`section`,{"aria-labelledby":`dota-rotation-title`,children:[(0,d.jsx)(`h2`,{id:`dota-rotation-title`,children:t.rotationTitle}),(0,d.jsx)(`p`,{children:t.rotationText}),(0,d.jsx)(`h3`,{children:t.rotationFiveTitle}),(0,d.jsx)(`p`,{children:t.rotationFiveText})]}),(0,d.jsxs)(`section`,{"aria-labelledby":`dota-stats-title`,children:[(0,d.jsx)(`h2`,{id:`dota-stats-title`,children:t.statsTitle}),(0,d.jsx)(`p`,{children:t.statsText})]}),(0,d.jsxs)(`section`,{"aria-labelledby":`dota-sync-title`,children:[(0,d.jsx)(`h2`,{id:`dota-sync-title`,children:t.syncTitle}),(0,d.jsx)(`p`,{children:t.syncText})]}),(0,d.jsxs)(`section`,{className:`dota2-privacy`,"aria-labelledby":`dota-privacy-title`,children:[(0,d.jsx)(`h2`,{id:`dota-privacy-title`,children:t.privacyTitle}),(0,d.jsx)(`p`,{children:t.privacyText})]}),(0,d.jsxs)(`section`,{"aria-labelledby":`dota-faq-title`,children:[(0,d.jsx)(`h2`,{id:`dota-faq-title`,children:t.faqTitle}),(0,d.jsx)(`div`,{className:`dota2-faq`,children:r.map(([e,t])=>(0,d.jsxs)(`details`,{children:[(0,d.jsx)(`summary`,{children:e}),(0,d.jsx)(`p`,{children:t})]},e))})]})]})]})]})}export{h as default};