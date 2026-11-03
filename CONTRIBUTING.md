# Как изменить ТЭЙЛ вместе с нами

Репозиторий: https://github.com/ivanfix2005/tail-landing

## Скачать и запустить

Установите Node.js 24+ и Git, затем:

```sh
git clone https://github.com/ivanfix2005/tail-landing.git
cd tail-landing
node server/index.mjs
```

Откройте http://127.0.0.1:8790/. На Windows можно запустить start-tail-landing.cmd. Для готового лендинга npm install не нужен. Вместо Git можно скачать Code → Download ZIP на странице репозитория и распаковать архив.

## Где менять

- Тексты и блоки: public/index.html; примеры и вопросы — public/content.js и public/market-data.js.
- Оформление: public/landing.css, refined.css, interactive.css, atmosphere.css.
- Анимации: public/landing-motion.js, journey-motion.js, atmosphere.js.
- Миниатюры преимуществ: ui/benefits.tsx и ui/benefits.css. После их изменения выполните npm ci --ignore-scripts и npm run build:ui; сохраните в коммит оба файла public/components/benefits.*.
- Сервер и опрос: server/. Ответы сохраняются в SQLite; на хостинге база находится в постоянном хранилище /data, вне Git.

После обычной правки обновите страницу браузера. После изменения сервера перезапустите Node. Не добавляйте в Git .env, базы данных, ответы опроса, логи или токены.

## Как предложить изменения владельцу

1. Нажмите Fork на GitHub, чтобы создать свою копию.
2. Клонируйте свой fork и создайте отдельную ветку, например git switch -c feature/new-hero.
3. Внесите изменения, проверьте сайт и выполните node scripts/check.mjs и node --test tests/server.test.mjs.
4. Сделайте commit и push в свою копию, затем на GitHub нажмите Compare & pull request.
5. Опишите изменение и приложите скриншот, если меняли дизайн. Владелец просмотрит и примет Pull Request.

Открытый репозиторий позволяет скачать проект и работать в своей копии. Для прямого push в этот исходный репозиторий владелец отдельно приглашает GitHub-логин участника в Collaborators. Публикация сайта и доступ к ответам опроса остаются у владельца. Происхождение сторонних ресурсов и их лицензии перечислены в docs/THIRD_PARTY.md.
