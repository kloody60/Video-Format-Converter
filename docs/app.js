(function () {
  var C = window.SITE, $ = function (id) { return document.getElementById(id); };
  var configured = C.firebase.apiKey.indexOf("PUT_") !== 0;

  // ---------- i18n ----------
  var EN = {
    brand: "Video Format Converter", nav_features: "Features", nav_buy: "Buy", login: "Sign in", logout: "Sign out",
    h1: "Convert any video to any format<br><span class='grad'>using your GPU and CPU together</span>",
    lead: "One Windows app: fast conversion, AI upscaling up to 4K and 8x, and video translation into any language, burned onto the screen.",
    cta_buy: "Buy now", cta_more: "Learn more", f_title: "Everything in one app",
    f1t: "Maximum-speed conversion", f1d: "Uses the graphics card (NVENC), processor and RAM together, and converts several videos in parallel.",
    f2t: "AI upscaling", f2d: "From 144p to 4K: 2K, 2x, 4x and 8x options with a before/after preview.",
    f3t: "Video translation", f3d: "Recognises speech in 40+ languages, translates it, and places the subtitles wherever you choose on screen.",
    f4t: "Any format to any format", f4d: "MP4, MKV, AVI, MOV, TS, WebM, MP3 and more, from 720p up to 4K.",
    f5t: "Automatic organising", f5d: "Move originals to a folder or delete them after conversion; pause and cancel per file.",
    f6t: "In-app updates", f6d: "Arabic and English interface, with one-click updates from Settings.",
    p_title: "Get the app", p_once: "One-time payment · no subscription", p1: "Lifetime licence", p2: "All future updates", p3: "Ready-made Windows installer",
    need_login: "Sign in first so you can pay and download.", paynote: "Secure payment through PayPal. We never see your card details.",
    thanks: "✓ Purchase complete. Thank you!", download: "Download the app", pending: "Verifying your payment… refresh in a moment.",
    foot: "© Video Format Converter — Windows 10/11", google: "Continue with Google", or: "or with email",
    to_register: "No account? Create one", to_login: "Have an account? Sign in", register: "Create account", forgot: "Forgot password",
    setup: "The site is not configured yet (see README).", sent: "Password reset email sent.", paidsave: "Payment received but saving failed. Contact support with order: "
  };
  var AR = {}; document.querySelectorAll("[data-i]").forEach(function (e) { AR[e.getAttribute("data-i")] = e.innerHTML; });
  AR.register = "إنشاء حساب"; AR.to_login = "عندك حساب؟ سجّل دخولك"; AR.to_register = "ما عندك حساب؟ أنشئ حساباً";
  AR.setup = "الموقع غير مهيّأ بعد (راجع README)."; AR.sent = "أرسلنا رابط إعادة تعيين كلمة المرور."; AR.paidsave = "وصل الدفع لكن تعذّر الحفظ. تواصل معنا مع رقم الطلب: ";
  var lang = "ar", registerMode = false;
  try { lang = localStorage.getItem("lang") || ((navigator.language || "").indexOf("ar") === 0 ? "ar" : "en"); } catch (e) { }
  function T(k) { return (lang === "ar" ? AR : EN)[k] || k; }
  function applyLang() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i]").forEach(function (e) { var k = e.getAttribute("data-i"); if (k === "login" && e.id === "mTitle" && registerMode) k = "register"; e.innerHTML = T(k); });
    $("langBtn").textContent = lang === "ar" ? "English" : "العربية";
    $("toggleMode").textContent = T(registerMode ? "to_login" : "to_register");
    $("submitBtn").textContent = T(registerMode ? "register" : "login");
    $("mTitle").textContent = T(registerMode ? "register" : "login");
    $("resetBtn").textContent = T("forgot");
    document.title = T("brand");
  }
  $("langBtn").onclick = function () { lang = lang === "ar" ? "en" : "ar"; try { localStorage.setItem("lang", lang); } catch (e) { } applyLang(); };
  $("priceTxt").textContent = "$" + C.price;
  $("dl").href = C.downloadUrl;
  applyLang();

  // ---------- modal ----------
  function openModal() { $("mErr").textContent = ""; $("modal").hidden = false; $("email").focus(); }
  function closeModal() { $("modal").hidden = true; }
  $("loginBtn").onclick = $("loginBtn2").onclick = openModal;
  $("closeModal").onclick = closeModal;
  $("modal").onclick = function (e) { if (e.target === $("modal")) closeModal(); };
  $("toggleMode").onclick = function (e) { e.preventDefault(); registerMode = !registerMode; applyLang(); };

  function showState(s) {
    ["stGuest", "stPay", "stPaid", "stPending"].forEach(function (id) { $(id).hidden = id !== s; });
  }
  showState("stGuest");

  if (!configured) {
    $("msg").textContent = T("setup");
    $("loginBtn").onclick = $("loginBtn2").onclick = function () { $("msg").textContent = T("setup"); };
    return;
  }

  // ---------- firebase ----------
  firebase.initializeApp(C.firebase);
  var auth = firebase.auth(), db = firebase.firestore(), user = null, paypalDone = false;

  function err(e) { $("mErr").textContent = (e && e.message || String(e)).replace("Firebase: ", ""); }
  $("submitBtn").onclick = function () {
    var em = $("email").value.trim(), pw = $("pass").value;
    var p = registerMode ? auth.createUserWithEmailAndPassword(em, pw) : auth.signInWithEmailAndPassword(em, pw);
    p.then(closeModal).catch(err);
  };
  $("gBtn").onclick = function () { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(closeModal).catch(err); };
  $("resetBtn").onclick = function (e) {
    e.preventDefault(); var em = $("email").value.trim(); if (!em) { $("email").focus(); return; }
    auth.sendPasswordResetEmail(em).then(function () { $("mErr").textContent = T("sent"); }).catch(err);
  };
  $("logoutBtn").onclick = function () { auth.signOut(); };

  auth.onAuthStateChanged(function (u) {
    user = u;
    $("userBox").hidden = !u; $("loginBtn").hidden = !!u;
    if (!u) { showState("stGuest"); return; }
    $("userMail").textContent = u.email || "";
    db.collection("purchases").doc(u.uid).onSnapshot(function (d) {
      var data = d.exists ? d.data() : null;
      if (data && (!C.requireVerified || data.verified === true)) showState("stPaid");
      else if (data) showState("stPending");
      else { showState("stPay"); renderPayPal(); }
    }, function () { showState("stPay"); renderPayPal(); });
  });

  // ---------- paypal ----------
  function loadPayPal(cb) {
    if (window.paypal) return cb();
    var s = document.createElement("script");
    s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(C.paypalClientId) + "&currency=" + C.currency + "&intent=capture";
    s.onload = cb; s.onerror = function () { $("msg").textContent = "PayPal failed to load."; };
    document.head.appendChild(s);
  }
  function renderPayPal() {
    if (paypalDone || C.paypalClientId.indexOf("PUT_") === 0) { if (C.paypalClientId.indexOf("PUT_") === 0) $("msg").textContent = T("setup"); return; }
    paypalDone = true;
    loadPayPal(function () {
      paypal.Buttons({
        style: { layout: "vertical", shape: "pill", label: "pay" },
        createOrder: function (d, a) { return a.order.create({ purchase_units: [{ description: "Video Format Converter", amount: { currency_code: C.currency, value: C.price } }] }); },
        onApprove: function (d, a) {
          return a.order.capture().then(function (o) {
            return db.collection("purchases").doc(user.uid).set({
              orderId: o.id, status: o.status, amount: C.price, currency: C.currency, email: user.email || "",
              at: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function () { $("msg").textContent = T("paidsave") + o.id; });
          });
        },
        onError: function (e) { $("msg").textContent = String(e); }
      }).render("#paypal");
    });
  }
})();
