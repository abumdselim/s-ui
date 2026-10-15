/* Linktree clone — auth pages (login / register) interactions */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function setError(wrapId, errId, on) {
    var wrap = document.getElementById(wrapId);
    var err = document.getElementById(errId);
    if (wrap) wrap.classList.toggle("invalid", !!on);
    if (err) err.classList.toggle("show", !!on);
  }

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- toast for demo-only buttons ---------- */
  var toast = document.createElement("div");
  toast.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(16px);" +
    "background:#1E2330;color:#fff;padding:12px 22px;border-radius:999px;font-size:14.5px;font-weight:500;" +
    "box-shadow:0 12px 32px rgba(30,35,48,.28);opacity:0;pointer-events:none;z-index:50;" +
    "transition:opacity .25s ease, transform .25s ease;max-width:88vw;text-align:center";
  document.body.appendChild(toast);
  var toastTimer = null;
  window.showToast = function (msg) {
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(16px)";
    }, 2400);
  };

  /* ---------- step navigation ---------- */
  function goToStep(n) {
    $all(".auth-step").forEach(function (step) {
      step.hidden = step.getAttribute("data-step") !== String(n);
    });
    var dots = $all(".step-dots span");
    dots.forEach(function (d, i) { d.classList.toggle("on", i < n); });
    var focusTarget = $(".auth-step:not([hidden]) input");
    if (focusTarget) focusTarget.focus();
    window.scrollTo({ top: 0 });
  }
  $all("[data-back]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      goToStep(1);
    });
  });

  /* ---------- password visibility ---------- */
  $all("[data-eye]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.getAttribute("data-eye"));
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.style.color = show ? "rgba(4,4,3,.85)" : "";
    });
  });

  /* ---------- social / helper demo buttons ---------- */
  $all("[data-social]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showToast(btn.getAttribute("data-social") + " sign-in isn’t wired up in this front-end demo 🙂");
    });
  });
  $all("[data-forgot]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Reset " + a.getAttribute("data-forgot") + " — demo only");
    });
  });
  $all("[data-cookie-preferences]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Cookie preferences — demo only");
    });
  });

  /* ============================================================
     LOGIN flow
     ============================================================ */
  var loginId = $("#loginId");
  var loginContinue = $("#loginContinue");
  if (loginId && loginContinue) {
    loginId.addEventListener("input", function () {
      var ok = loginId.value.trim().length >= 3;
      loginContinue.disabled = !ok;
      setError("loginIdWrap", "loginIdError", false);
    });
    $("#loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = loginId.value.trim();
      if (v.length < 3) {
        setError("loginIdWrap", "loginIdError", true);
        return;
      }
      $("#loginIdEcho").textContent = "to continue as " + v;
      goToStep(2);
    });
  }

  var loginPass = $("#loginPass");
  var loginSubmit = $("#loginSubmit");
  if (loginPass && loginSubmit) {
    loginPass.addEventListener("input", function () {
      loginSubmit.disabled = loginPass.value.length < 1;
      setError("loginPassWrap", "loginPassError", false);
    });
    $("#loginPassForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!loginPass.value) {
        setError("loginPassWrap", "loginPassError", true);
        return;
      }
      loginSubmit.disabled = true;
      loginSubmit.textContent = "Logging in…";
      setTimeout(function () {
        goToStep(3);
      }, 700);
    });
  }

  /* ============================================================
     REGISTER flow
     ============================================================ */
  var regEmail = $("#regEmail");
  var regEmailBtn = $("#regEmailBtn");
  if (regEmail && regEmailBtn) {
    regEmail.addEventListener("input", function () {
      regEmailBtn.disabled = !emailRe.test(regEmail.value.trim());
      setError("regEmailWrap", "regEmailError", false);
    });
    $("#regEmailForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!emailRe.test(regEmail.value.trim())) {
        setError("regEmailWrap", "regEmailError", true);
        return;
      }
      var suggested = regEmail.value.trim().split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase().slice(0, 20);
      if (regUser && !regUser.value) regUser.value = suggested || "yourname";
      regUserCheck();
      goToStep(2);
    });
  }

  var regUser = $("#regUser");
  var regPass = $("#regPass");
  var regFinish = $("#regFinishBtn");
  var userRe = /^[a-zA-Z0-9_-]{2,30}$/;
  var taken = ["admin", "linktree", "login", "register", "help", "support", "yourname"];

  function pwScore(v) {
    var s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    return Math.min(4, Math.max(0, s));
  }

  function regUserCheck() {
    if (!regUser) return true;
    var v = regUser.value.trim();
    var hint = $("#regUserHint");
    var valid = userRe.test(v);
    if (!valid) {
      if (v) setError("regUserWrap", "regUserError", true);
      hint.textContent = "Your personal link — make it short and memorable.";
      hint.style.color = "";
      return false;
    }
    if (taken.indexOf(v.toLowerCase()) !== -1) {
      setError("regUserWrap", "regUserError", false);
      hint.textContent = "linktr.ee/" + v + " is taken — try adding a word or number.";
      hint.style.color = "#D93036";
      return false;
    }
    setError("regUserWrap", "regUserError", false);
    hint.textContent = "linktr.ee/" + v + " is available 🎉";
    hint.style.color = "#2E9E4F";
    return true;
  }

  function regState() {
    if (!regPass || !regUser || !regFinish) return;
    var okPass = regPass.value.length >= 8;
    var okUser = regUserCheck();
    regFinish.disabled = !(okPass && okUser);
  }

  if (regPass) {
    regPass.addEventListener("input", function () {
      var score = pwScore(regPass.value);
      var meter = $("#pwMeter");
      var label = $("#pwMeterLabel");
      meter.className = "pw-meter" + (regPass.value ? " s" + Math.max(1, score) : "");
      var names = ["Too short", "Weak", "Okay", "Good", "Strong"];
      label.textContent = regPass.value ? names[score] + " password" : "Use 8+ characters with a mix of letters and numbers.";
      setError("regPassWrap", "regPassError", false);
      regState();
    });
  }
  if (regUser) {
    regUser.addEventListener("input", regState);
  }

  if (regFinish) {
    $("#regPassForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (regPass.value.length < 8) {
        setError("regPassWrap", "regPassError", true);
        regPass.focus();
        return;
      }
      if (!regUserCheck()) {
        regUser.focus();
        return;
      }
      var name = regUser.value.trim();
      regFinish.disabled = true;
      regFinish.textContent = "Creating…";
      setTimeout(function () {
        $("#phoneName").textContent = name;
        $("#phoneInitial").textContent = name.charAt(0).toUpperCase();
        $("#successEcho").textContent = "linktr.ee/" + name + " is yours in this front-end demo — the claim flow worked end to end.";
        goToStep(3);
      }, 800);
    });
  }

  /* ---------- prefill from homepage claim form (?claim=name) ---------- */
  try {
    var claimParam = new URLSearchParams(window.location.search).get("claim");
    if (claimParam && regUser && userRe.test(claimParam)) {
      regUser.value = claimParam;
      regUserCheck();
    }
  } catch (e) { /* older browsers: skip prefill */ }

  /* ============================================================
     Promo pane rotator
     ============================================================ */
  var rotator = $("#promoRotator");
  if (rotator) {
    var cards = $all(".promo-quote-card", rotator);
    var dotsWrap = $("#promoDots");
    var pdots = [];
    cards.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Show story " + (i + 1));
      if (i === 0) b.classList.add("on");
      b.addEventListener("click", function () { show(i); });
      dotsWrap.appendChild(b);
      pdots.push(b);
    });
    var cur = 0;
    function show(i) {
      cur = i;
      cards.forEach(function (c, k) { c.classList.toggle("on", k === i); });
      pdots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }
    setInterval(function () { show((cur + 1) % cards.length); }, 5200);
  }
})();
