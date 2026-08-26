# Photo Portal

A tiny container that gives guests **one URL** with a tab per album, plus an
optional upload tab — protected by a shared username/password (HTTP Basic
Auth) so the link alone isn't the only thing standing between a guest and
the photos.

- One tab per Immich share link you configure (as many as you want)
- An optional **Add Photos** tab for a public upload/proxy link
- A login prompt (Basic Auth) in front of the whole page

Nothing is stored or proxied by this container itself beyond the auth check
— it's a static page with `<iframe>`s and a tab switcher. All actual
viewing/uploading still happens on Immich and on your proxy, in the guest's
own browser.

## 1. Configure

Edit `docker-compose.yml` and set:

- `ALBUMS` — one tab per album, format `Name|share-link;Name|share-link;...`.
- `UPLOAD_URL` — your public proxy URL for uploads. Optional.
- `PORTAL_TITLE` — optional, shown in the header and login prompt.
- `PORTAL_USER` — Basic Auth username (default: `guest`).
- `PORTAL_PASSWORD` — **required.** The shared password guests need to enter
  once before the page loads at all.

Names in `ALBUMS` can't contain `|`, `;`, or `"`. `PORTAL_TITLE` also can't
contain `"` (used as the Basic Auth realm string).

## 2. Build & run

```bash
docker compose up -d --build
```

## 3. Push to GitHub and use the built image

This repo includes `.github/workflows/publish.yml`, which builds the image
and pushes it to GHCR on every push to `main`.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/immich-portal.git
git push -u origin main
```

Then reference `ghcr.io/<you>/immich-portal:latest` in your deployment
compose file with your real `ALBUMS`/`PORTAL_PASSWORD` values.

## File layout

```
immich-portal/
├── .github/workflows/publish.yml
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── nginx/
│   └── portal.conf.template
└── html/
    ├── index.html
    ├── style.css
    ├── app.js
    └── config.js.template
```
