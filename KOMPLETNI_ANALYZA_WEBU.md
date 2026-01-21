# Kompletní Analýza Webu - MácaObaly.cz

**Datum analýzy:** 21. ledna 2026  
**Web:** MácaObaly.cz  
**Typ:** Produkční web pro e-commerce s dynamickým obsahem  
**Technologie:** HTML5, CSS3, JavaScript (moduly), Storyblok CMS

---

## 📊 CELKOVÝ PŘEHLED

| Oblast | Status | Skóre |
|--------|--------|-------|
| **Responzivita** | ⚠️ Částečná | 5/10 |
| **Přístupnost (A11y)** | ✅ Dobrá | 8/10 |
| **Výkon (Performance)** | ⚠️ Střední | 6/10 |
| **SEO** | ✅ Velmi dobré | 9/10 |
| **Bezpečnost** | ✅ Dobrá | 8/10 |
| **User Experience** | ⚠️ Slabá | 5/10 |
| **Kód** | ✅ Kvalitní | 8/10 |

**Celkové skóre:** 6.4/10

---

## 🎯 ARCHITEKTURA PROJEKTU

### Struktura souboru:
```
/Maca_Obaly/
├── index.html             (Domovská stránka)
├── category.html          (Stránka s produkty kategorií)
├── product.html           (Detail produktu)
├── style.css              (1964 řádků - vše v jednom souboru)
├── js/
│   ├── homepage.js        (Logika domovské stránky)
│   ├── category.js        (Logika kategorie + filtry + paginace)
│   ├── product.js         (Logika detailu produktu)
│   ├── shared.js          (Společné funkce - tema, scroll)
│   └── storyblok.js       (API komunikace se Storyblok CMS)
├── images/                (Obrázky)
└── package.json           (Závislosti)
```

### Technologický stack:
- **Frontend:** Vanilla JavaScript (ES6 moduly)
- **Styling:** CSS3 (proměnné, flexbox, grid, media queries)
- **CMS:** Storyblok
- **Fonty:** Google Fonts (Inter, Rubik)
- **Ikony:** Font Awesome 6
- **Package manager:** npm

---

## 📱 ANALÝZA RESPONZIVITY

### Aktuální breakpointy (pozorované):

```
Definované:
- max-width: 960px   → Mobile layout
- max-width: 768px   → Extra-mobile
- max-width: 767px   → Mobile filters

Chybějí:
- min-width: 480px   → Ultra-malé zařízení (<480px)
- min-width: 1200px  → Extra-velké obrazovky
```

### Problémy s aktuálním layoutem:

#### 1. **Nejednotné breakpointy** ⚠️
```css
.category-card img {
  @media (max-width: 767px) → height: 180px
  @media (max-width: 960px) → height: 250px (konflikt!)
}

.product-item {
  @media (max-width: 960px) → grid-template-columns: repeat(2, 1fr)
}

.products-grid {
  @media (max-width: 960px) → grid-template-columns: repeat(3, 1fr)
  (rozdílné chování těchto dvou - inc consistency!)
}
```

#### 2. **Chybějící XS (<480px)** 🔴
- Žádné media queries pro ultra-malé obrazovky
- Hero h1 je 2.5rem na mobilu → nečitelné na iPhone SE
- Navigation se neškáluje pod 768px
- Hrozí horizontální scroll

#### 3. **Problém s navigací na mobilech** 🔴
```html
<!-- Hamburger menu přepínač je v DOM -->
<input type="checkbox" id="nav-toggle" class="nav-toggle">
<label for="nav-toggle" class="nav-toggle-label">
  <span></span> <!-- 3 linky v HTML -->
</label>

<!-- Mobilní CTA je v nav-links -->
<li><a href="tel:+420720670226" class="mobile-cta">Telefon</a></li>

<!-- NOVÝ container nav-mobile-actions -->
<div class="nav-mobile-actions">
  <a href="tel:+420720670226" class="mobile-cta">Telefon</a>
  <button id="theme-toggle-mobile">☀️/🌙</button>
</div>
```

**Konflikt:** Dvě CTA - jedna v `nav-links`, druhá v `nav-mobile-actions`

#### 4. **Obrázky bez srcset** ⚠️
```html
<!-- Bez variant dle rozlišení -->
<img src="images/collage.png" alt="...">

<!-- Chybí responsive sizes -->
<img src="hero.jpg" alt="...">
```

---

## 🎨 DESIGN & STYLING

### CSS Architektura: ✅ Dobrá
- **CSS proměnné:** ✅ Definovány (light + dark mode)
- **Flexbox/Grid:** ✅ Používáno správně
- **Jednotky:** ✅ Relativní (rem, %, vh, vw)
- **BEM/Organizace:** ⚠️ Částečná (ne všechny selektory jsou konzistentní)

### Barevný schéma:
```css
Light mode:
--bg-color: #fff
--button-bg: #007bff (modrá)
--link-color: #003d82 (tmavá modrá)

Dark mode:
--bg-color: #011f4a (tmavá modrá)
--button-bg: #4da6ff (světlá modrá)
```

**Status:** ✅ Kontrast je v pořádku (WCAG AA+)

### Typografie:
```css
h1: 2.5rem (Rubik 700)  → na mobilu: 2rem
h2: 1.8rem (Rubik 600)
h3: 1.25rem (Rubik 500)
p: 1rem (Inter 400)

Line-height: 1.2-1.8 ✅ Vhodné
```

---

## 🖱️ INTERAKCE A DOSTUPNOST

### Navigace:
- ✅ Hamburger menu funkční
- ⚠️ Bez SVG ikony (pouze CSS checkboxem)
- ✅ Aria-labels přítomny
- ⚠️ CTA tlačítko v headeru má stejnou barvu jako hero btn (zmatení)

### Tlačítka a prvky:
```css
.nav-arrow:         width: 50px, height: 50px  ✅ 44px minimum
.pagination-btn:    min-width: 40px, height: 40px  ⚠️ Pod 44px
.filter-btn:        padding: 0.75rem 1.25rem   ⚠️ Není specifikována min-height
```

### Focus stav:
```css
a:focus {
  outline: 2px solid var(--button-bg)  ✅ Viditelné
  outline-offset: 2px
  border-radius: 4px
}
```

**Status:** ✅ Dobrá, ale chybí focus na některých prvkích

---

## 📸 OBRÁZKY A MÉDIA

### Lazy Loading:
```html
<!-- ✅ Přítomno na novějších obrázcích -->
<img src="..." loading="lazy" decoding="async">

<!-- ❌ Chybí na některých -->
<img src="category_icon.jpg">
```

### Responsive images:
- ❌ **Chybí srcset** - žádné varianty dle rozlišení
- ❌ **Chybí sizes** - browser neví, jak velký obrázek načíst
- ⚠️ **object-fit:** cover → Dobré, ale bez fallback

### Velikosti obrázků:
```css
Hero image:         max-width: 100%
Category cards:     height: 180-300px (v závislosti na breakpointu)
Product items:      height: 280px
Product detail:     min-height: 500px
```

---

## ⚡ VÝKON (PERFORMANCE)

### Co funguje:
- ✅ CSS je minimalizován (inline ve style.css)
- ✅ JavaScript je modulární (type="module")
- ✅ Font Awesome je načten z CDN (async)
- ✅ Google Fonts jsou preloaded

### Co zpomaluje:
- ❌ 1964 řádků CSS v jednom souboru
- ❌ Žádný lazy-loading na obrázcích v JS šablonách
- ❌ Bez image optimization (srcset, webp)
- ❌ Bez minifikace JS
- ⚠️ API volání jsou synchronní (bez error handling)

### Lighthouse diagnostika (odhadnuto):
- **Performance:** 45-55/100
- **Accessibility:** 85-90/100
- **Best Practices:** 70-75/100
- **SEO:** 95-100/100

---

## 🔍 SEO ANALÝZA

### Metadata:
```html
✅ <meta charset="UTF-8">
✅ <meta name="viewport">
✅ <meta name="description">
✅ <meta name="keywords">
✅ <meta name="author">
✅ <link rel="icon">
```

### Struktura:
- ✅ H1 přítomna
- ✅ H2, H3 hierarchicky správně
- ✅ Alt texty na obrázcích
- ✅ Semantické HTML (header, section, footer)

### Sitemap a robots:
- ❌ Chybí sitemap.xml
- ❌ Chybí robots.txt
- ❌ Chybí canonical tags (může způsobit duplicate content s CMS)

---

## 🛡️ BEZPEČNOST

### Co je v pořádku:
- ✅ HTTPS (doména má SSL)
- ✅ Žádný inline JavaScript v HTML
- ✅ Content Security Policy nepotřeba (všechno je z důvěryhodných zdrojů)
- ✅ Email je maskován HTML entitami

### Co by mělo být:
- ⚠️ CORS headers (pokud API není na stejné doméně)
- ⚠️ Error handling pro API volání (žádný try-catch)

---

## 📋 DETAILNÍ ROZBOR STRÁNEK

### 1. **Domovská stránka (index.html)**

#### Sekce:
1. **Navigation** (sticky) - ✅ Funkční, ⚠️ Nejasná CTA

2. **Hero sekce** - ⚠️ Problémy:
   - `min-height: 100vh` na mobilu → Příliš vysoký
   - H1: 3.5rem v HTML, ale 2.5rem v CSS → Nedopadem se neujme
   - Bez media query pro SM/XS

3. **Product Categories Grid** - ⚠️ Problémy:
   - `grid-template-columns: repeat(3, 1fr)` (default)
   - @media (max-width: 767px) → height: 180px
   - @media (max-width: 960px) → height: 250px + `grid-template-columns: 1fr`
   - **Konflikt:** Při 768-959px je grid 3 sloupce, ale obrázky 250px (nevhodné)

4. **About sekce** - ✅ Dobrá:
   - Grid 2 sloupce → 1 sloupec na mobilu
   - Obrázek má min-height: 300px na mobilu

5. **Contact sekce** - ⚠️ Problémy:
   - Grid 3 sloupce → 1 sloupec
   - Chybí media query pro SM

6. **Footer** - ✅ Dobrý:
   - Grid 3 sloupce → 1 sloupec
   - Responsive padding

---

### 2. **Stránka kategorie (category.html)**

#### Dynamické prvky (z JS):
1. **Filtrování** - ⚠️ Problémy:
   ```javascript
   // Tlačítka s ikonami + textem
   <button class="filter-btn" data-subcat="...">
     <i class="fas fa-box"></i>
     <span>Název</span>
   </button>
   ```
   - CSS: `@media (max-width: 768px) { .filter-btn span { display: none } }`
   - **Problém:** Text zmizí, ale ikona je malá
   - **Doporučení:** Nechat text viditelný s `text-overflow: ellipsis`

2. **Produktový grid** - ⚠️ Problémy:
   ```css
   .products-grid {
     grid-template-columns: repeat(3, 1fr);  /* Desktop */
     @media (max-width: 960px) {
       grid-template-columns: repeat(2, 1fr); /* Mobile */
     }
   }
   ```
   - Chybí SM breakpoint (480-767px)
   - Chybí XS (<480px)
   - Obrázky: height: 280px všude (fixní!)

3. **Paginace** - ⚠️ Problémy:
   ```css
   .pagination-btn {
     min-width: 40px;
     height: 40px;  /* Pod doporučenými 44px */
   }
   ```
   - Bez media query pro mobilní layout
   - Při více stránkách se neškáluje

---

### 3. **Detail produktu (product.html)**

#### Layout:
```css
.product-detail-container {
  grid-template-columns: 1fr 1fr;  /* Desktop */
  gap: 4rem;
  
  @media (max-width: 960px) {
    grid-template-columns: 1fr;  /* Mobile */
    gap: 2rem;
  }
}
```

- ✅ Dobrá struktura
- ⚠️ Chybí SM/XS specifika
- ⚠️ Obrázek: min-height: 500px (Desktop) → 300px (mobile) - dobré
- ⚠️ Bez lazy loading

#### Navigační tlačítka:
```css
.nav-arrow {
  width: 50px;
  height: 50px;  /* ✅ Dostatečné */
}

.product-navigation {
  gap: 2rem;  /* Desktop */
  @media (max-width: 960px) {
    gap: 1rem;
  }
}
```

---

## 🎯 SEZNAM PROBLÉMŮ S PRIORITAMI

### 🔴 KRITICKÉ (blokují UX):

1. **Nejednotné breakpointy** - 3 rozdílné systémy
   - Hero: 960px
   - Category: 767px, 960px
   - Product detail: 768px, 960px
   - **Řešení:** Sjednotit na XS, SM, MD, LG

2. **Chybějící XS breakpoint (<480px)**
   - Hero h1 nečitelný
   - Navigace nezvládá malé obrazovky
   - Gridy se neškálují pod 480px
   - **Řešení:** Přidat @media (max-width: 479px)

3. **Duální CTA v navigaci**
   - `nav-links li .mobile-cta` + `nav-mobile-actions .mobile-cta`
   - Může vést k chybám v JS/CSS
   - **Řešení:** Zvolit jedno umístění

4. **Filtrační tlačítka skrývají text na mobilu**
   - Uživatel neví, co filtruje
   - **Řešení:** Nechat text viditelný + ellipsis

---

### 🟡 VYSOKÁ PRIORITA (degradace UX):

5. **Obrázky bez srcset/sizes**
   - Zbytečné stahování velkých variant
   - Chybí optimalizace pro mobilní sítě
   - **Řešení:** Přidat srcset pro všechny obrázky

6. **Tlačítka pod 44px**
   - Pagination: 40px (mělo by být 44px)
   - Filter btn: bez min-height
   - **Řešení:** Zvýšit na 44px minimálně

7. **Chybějící lazy loading na dynamických obrázcích**
   - JS šablony v category.js a product.js nemají loading="lazy"
   - **Řešení:** Přidat loading="lazy" do všech `<img>`

8. **CSS v jednom souboru (1964 řádků)**
   - Těžké se orientovat
   - Žádné code splitting
   - **Řešení:** Rozdělit na componenty (nav.css, hero.css, etc.)

---

### 🟢 STŘEDNÍ PRIORITA (zlacení):

9. **Bez sitemap.xml a robots.txt**
   - SEO trpí
   - **Řešení:** Vygenerovat

10. **API error handling chybí**
    - Chybějící async/await error handling
    - Uživatel nevidí chyby
    - **Řešení:** Přidat try-catch

11. **Bez canonical tags**
    - Možný duplicate content s CMS
    - **Řešení:** Přidat `<link rel="canonical">`

---

## ✅ CO FUNGUJE DOBŘE

- ✅ **Flexbox/Grid:** Správné použití moderních technologií
- ✅ **Dark mode:** Plně funkční s CSS proměnnými
- ✅ **Přístupnost:** Aria-labels, focus stav, kontrast
- ✅ **Mobile-first přístup:** Struktura je hotová
- ✅ **JavaScript architektura:** Modulární, čitelný
- ✅ **Performance základy:** Async scripts, web fonts

---

## 📈 DOPORUČENÉ KROKY (Pořadí implementace)

### Fáze 1 (Kritické - týdny 1-2):
```
1. Sjednotit breakpointy: XS <480px, SM 480-767px, MD 768-959px, LG ≥960px
2. Přidat @media (max-width: 479px) pro všechny komponenty
3. Vyřešit duální CTA v navigaci (ponechat jen nav-mobile-actions)
4. Zmenšit typography na XS (h1: 1.75rem, h2: 1.5rem)
```

### Fáze 2 (Vysoká - týdny 3-4):
```
5. Přidat lazy loading + sizes na všechny <img> v JS
6. Zvýšit tlačítka na min 44px (pagination, filtry)
7. Opravit filtrační tlačítka - keep text visible
8. Rozdělit CSS do modulů
```

### Fáze 3 (Střední - týdny 5-6):
```
9. Vytvořit srcset varianty pro klíčové obrázky
10. Přidat sitemap.xml a robots.txt
11. Přidat error handling do JS API volání
12. Přidat canonical tags
```

### Fáze 4 (Zlacení - týdny 7+):
```
13. Optimalizace obrázků (WebP, lossy compression)
14. CSS minifikace a code splitting
15. Service Worker pro offline přístup
16. Performance monitoring (Web Vitals)
```

---

## 📊 METRIKY KVALITY

```
Responzivita:        5/10  (nejslabší oblast)
Přístupnost:         8/10  (dobré, ale bez perfektu)
Výkon:               6/10  (střední, lze optimalizovat)
SEO:                 9/10  (velmi dobré)
Bezpečnost:          8/10  (dobrá, chybí error handling)
Kód:                 8/10  (kvalitní, chybí modulace)
---
Celkově:             6.4/10
```

---

## 🎓 ZÁVĚR

Web **MácaObaly.cz** má **solidní základy a dobrý kód**, ale trpí **nedostatečnou responzivitou a UX na malých zařízeních**. 

Největší potíž je **rozprostření breakpointů** a chybění **XS úrovně**. Po sjednocení breakpointů a přidání XS pravidel by web dosáhl **8/10 v responzivitě**.

Doporučuji **prioritizovat fáze 1-2** pro zlepšení mobilního zážitku a následně pokračovat s optimalizací výkonu a SEO.

---

**Generáno:** Kompletní analýza kódu  
**Verze:** 2.0  
**Poslední update:** 21. ledna 2026
