# Directus na Railway

Tato složka obsahuje konfiguraci pro Directus (headless CMS) nasazení na Railway.

## Lokální vývoj

### Předpoklady
- Docker a Docker Compose nainstalovaný
- Node.js 18+

### Spuštění lokálně

```bash
cd directus
cp .env.example .env
docker-compose up -d
```

Directus bude dostupný na: **http://localhost:8055**

Admin přihlášení (z .env):
- Email: `admin@example.com`
- Heslo: `admin123`

### Zastavení

```bash
docker-compose down
```

---

## Nasazení na Railway

### Krok 1: Pushovat do GitHubu

```bash
git add directus/
git commit -m "Add Directus CMS configuration"
git push origin main
```

### Krok 2: Vytvořit projekt na Railway

1. Jděte na https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Vyberte váš repo `maca-obaly`
4. Railway detekuje soubor - vyberte **Dockerfile** nebo nechte auto-detect

### Krok 3: Nastavit proměnné prostředí

V Railway dashboardu → **Environment Variables**:

```
DB_CLIENT=pg
DB_HOST=<postgres-railway-host>
DB_PORT=5432
DB_DATABASE=directus
DB_USER=<railway-postgres-user>
DB_PASSWORD=<railway-postgres-password>
ADMIN_EMAIL=vase@email.cz
ADMIN_PASSWORD=StrongPassword123!
JWT_SECRET=<dlouhy-random-string-min-32-znaku>
KEY=<dlouhy-random-string-min-32-znaku>
SECRET=<dlouhy-random-string-min-32-znaku>
CORS_ENABLED=true
CORS_ORIGIN=*
PORT=8055
```

**Tip:** Railway nabídne PostgreSQL - vyberte ji!

### Krok 4: Deploy

Railway automaticky deployuje. ~5 minut a běží.

Directus URL bude: `https://<project-name>.railway.app`

---

## Vytvoření Collections (schéma)

Po spuštění v administraci:

1. **Settings** → **Content Types**
2. Vytvořte:
   - **Categories** (název, slug, popis, obrázek)
   - **Products** (název, slug, popis, cena, obrázek, kategorie)

Nebo použijte import skript ze root složky:

```bash
npm run import:sb2strapi
```

(Pozn: Skript je pro Strapi, pro Directus ho upravíme)

---

## Problém-řešení

### Direktus se spouští ale nemám přístup

- Zkontrolujte že proměnné `ADMIN_EMAIL` a `ADMIN_PASSWORD` jsou nastaveny
- Restartněte kontejner: `docker-compose restart directus`

### PostgreSQL se nespustil

```bash
docker-compose logs postgres
```

### CORS chyby

V `.env` zkontrolujte:
```
CORS_ENABLED=true
CORS_ORIGIN=*
```

---

## Dokumentace

- Directus: https://docs.directus.io/
- Railway: https://docs.railway.app/
