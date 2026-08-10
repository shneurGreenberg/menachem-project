# ניהול אישי — שליחות · חינוך · בית

אפליקציית SPA בעברית (RTL) לניהול אישי: שליחות בשכונה, חינוך ובית.  
הנתונים נשמרים מקומית בדפדפן (IndexedDB דרך Dexie).

## הרצה מקומית

```bash
npm install
npm run dev
```

האתר ייפתח בדרך כלל ב־`http://localhost:5173/menachem-project/`.

בנייה לבדיקה:

```bash
npm run build
npm run preview
```

## פריסה ל־GitHub Pages

1. דחפו את הריפו ל־GitHub בשם `menachem-project` (או עדכנו את `base` ב־`vite.config.ts` בהתאם).
2. ב־GitHub: **Settings → Pages → Source = GitHub Actions**.
3. בכל push ל־`main` רץ ה־workflow ב־`.github/workflows/deploy.yml` ומפרסם את האתר.

כתובת צפויה: `https://<user>.github.io/menachem-project/`

## גיבוי נתונים

הנתונים חיים **רק בדפדפן**. מחיקת cache / נתוני אתר תמחק אותם.

1. היכנסו ל־**הגדרות**.
2. לחצו **ייצוא גיבוי JSON** ושמרו את הקובץ.
3. לשחזור: **ייבוא מגיבוי** (מחליף את כל הנתונים הקיימים).

מומלץ לייצא גיבוי מדי פעם, במיוחד לפני ניקוי דפדפן או מעבר למכשיר אחר.
