// ====== الإعدادات — عدّل هذا الملف فقط / Edit this file only ======
window.SITE = {
  price: "19.99",            // سعر البرنامج بالدولار / price in USD
  currency: "USD",
  paypalClientId: "PUT_YOUR_PAYPAL_CLIENT_ID_HERE",   // من developer.paypal.com → Apps & Credentials (Live)
  firebase: {                                          // من Firebase Console → Project settings → Your apps (Web)
    apiKey: "PUT_API_KEY",
    authDomain: "PUT_PROJECT.firebaseapp.com",
    projectId: "PUT_PROJECT_ID",
    appId: "PUT_APP_ID"
  },
  downloadUrl: "https://github.com/kloody60/Video-Format-Converter/releases/latest",   // رابط ملف التثبيت / installer link
  requireVerified: false     // true = لا يظهر التنزيل إلا بعد تحقق الخادم من الدفع (يحتاج functions/)
};
