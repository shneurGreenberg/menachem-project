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

## סנכרון בין מכשירים (Firebase)

הנתונים נשמרים מקומית **וגם** בענן אחרי שמגדירים סנכרון בהגדרות.

1. צרו אפליקציית **Web** ב-Firebase (Project settings → Your apps → `</>`).
2. Authentication → Sign-in method → הפעילו **Anonymous**.
3. Firestore → Rules → הדביקו את התוכן מ־`firestore.rules` ולחצו Publish.
4. באתר: **הגדרות** → הדביקו את `firebaseConfig` → קוד `MENACHEM-5776` → **שמירה והפעלת סנכרון**.
5. העתיקו את **הקישור האישי** ופתחו אותו בטלפון / מחשב אחר.

בלי הקישור/הקוד אין גישה לענן. אין צורך להתחבר עם Google.

