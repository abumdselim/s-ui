/* Linktree homepage clone — interactions */
(function () {
  "use strict";

  /* ---------- promo banner ---------- */
  var banner = document.getElementById("promoBanner");
  var bannerClose = document.getElementById("bannerClose");
  if (bannerClose && banner) {
    bannerClose.addEventListener("click", function () {
      banner.classList.add("hidden");
    });
  }

  /* ---------- mobile header: solid lime band once scrolled ---------- */
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var onScroll = function () {
      siteHeader.classList.toggle("scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     Desktop mega menus
     ============================================================ */
  var megaItems = Array.prototype.slice.call(document.querySelectorAll(".nav-item[data-mega]"));
  var isDesktop = function () { return window.innerWidth > 1023; };
  var hoverTimer = null;

  function closeAll(except) {
    megaItems.forEach(function (item) {
      if (item !== except) {
        item.classList.remove("open");
        var t = item.querySelector(".nav-trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
  }

  megaItems.forEach(function (item) {
    var trigger = item.querySelector(".nav-trigger");
    if (!trigger) return;

    function open() {
      clearTimeout(hoverTimer);
      closeAll(item);
      item.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }
    function close() {
      item.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }

    item.addEventListener("mouseenter", function () {
      if (isDesktop()) open();
    });
    item.addEventListener("mouseleave", function () {
      if (isDesktop()) {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(close, 160);
      }
    });
    trigger.addEventListener("click", function () {
      if (item.classList.contains("open")) close();
      else open();
    });
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item[data-mega]")) closeAll(null);
  });

  /* ---------- mobile menu ---------- */
  var mobileMenu = document.getElementById("mobileMenu");
  var menuToggle = document.getElementById("menuToggle");
  var menuClose = document.getElementById("menuClose");

  function setMenu(open) {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (menuToggle) menuToggle.addEventListener("click", function () { setMenu(true); });
  if (menuClose) menuClose.addEventListener("click", function () { setMenu(false); });
  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---------- mobile accordions ---------- */
  Array.prototype.slice.call(document.querySelectorAll(".mm-acc-btn")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.nextElementSibling;
      if (!panel || !panel.classList.contains("mm-acc-panel")) return;
      var isOpen = panel.classList.contains("open");
      document.querySelectorAll(".mm-acc-panel.open").forEach(function (p) {
        if (p !== panel) p.classList.remove("open");
      });
      document.querySelectorAll(".mm-acc-btn.open").forEach(function (b) {
        if (b !== btn) b.classList.remove("open");
      });
      panel.classList.toggle("open", !isOpen);
      btn.classList.toggle("open", !isOpen);
    });
  });

  /* ---------- duplicate marquee tracks for seamless loop ---------- */
  Array.prototype.slice.call(document.querySelectorAll("[data-duplicate]")).forEach(function (track) {
    track.insertAdjacentHTML("beforeend", track.innerHTML);
  });

  /* ============================================================
     Draggable marquee (auto-scroll + pointer drag + inertia)
     Used by the hero strip and the trusted-by row, like the
     swipeable cards on the original site.
     ============================================================ */
  function Marquee(track, opts) {
    this.track = track;
    this.speed = opts.speed || 60;
    this.getAxis = opts.getAxis || function () { return "x"; };
    this.offset = 0;
    this.inertia = null;
    this.dragging = false;
    this.hovering = false;
    this.lastTime = performance.now();
    this.bind();
    requestAnimationFrame(this.tick.bind(this));
  }

  Marquee.prototype.axis = function () { return this.getAxis(); };

  Marquee.prototype.half = function () {
    var a = this.axis();
    return a === "x" ? this.track.scrollWidth / 2 : this.track.scrollHeight / 2;
  };

  Marquee.prototype.applyTouchAction = function () {
    this.track.style.touchAction = this.axis() === "x" ? "pan-y" : "pan-x";
  };

  Marquee.prototype.clamp = function () {
    var half = this.half();
    if (!isFinite(half) || half <= 0) return;
    while (this.offset <= -half) this.offset += half;
    while (this.offset > 0) this.offset -= half;
  };

  Marquee.prototype.render = function () {
    var a = this.axis();
    var transform = a === "x"
      ? "translate3d(" + this.offset + "px, 0, 0)"
      : "translate3d(0, " + this.offset + "px, 0)";
    this.track.style.transform = transform;
  };

  Marquee.prototype.bind = function () {
    var self = this;
    this.applyTouchAction();

    this.track.addEventListener("pointerenter", function () { self.hovering = true; });
    this.track.addEventListener("pointerleave", function () { self.hovering = false; });

    this.track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      self.dragging = true;
      self.inertia = null;
      self.lastX = e.clientX;
      self.lastY = e.clientY;
      self.lastT = performance.now();
      self.velocity = 0;
      self.track.classList.add("dragging");
      if (self.track.setPointerCapture) {
        try { self.track.setPointerCapture(e.pointerId); } catch (err) { /* no-op */ }
      }
    });

    window.addEventListener("pointermove", function (e) {
      if (!self.dragging) return;
      var a = self.axis();
      var delta = a === "x" ? e.clientX - self.lastX : e.clientY - self.lastY;
      var now = performance.now();
      var dt = Math.max(1, now - self.lastT);
      self.offset -= delta;
      self.velocity = delta / dt; /* px per ms, pointer direction */
      self.lastX = e.clientX;
      self.lastY = e.clientY;
      self.lastT = now;
      self.clamp();
      self.render();
    });

    function release() {
      if (!self.dragging) return;
      self.dragging = false;
      self.track.classList.remove("dragging");
      /* flick → carry momentum in the scroll direction */
      self.inertia = -self.velocity * 1000;
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  };

  Marquee.prototype.tick = function (now) {
    var dt = Math.min(64, now - this.lastTime) / 1000;
    this.lastTime = now;

    if (!this.dragging) {
      var base = this.hovering ? 0 : this.speed;
      if (this.inertia === null) {
        this.inertia = base;
      } else {
        /* ease momentum back to the base scroll speed */
        this.inertia += (base - this.inertia) * Math.min(1, dt * 2.4);
      }
      this.offset -= this.inertia * dt;
      this.clamp();
    }

    this.render();
    requestAnimationFrame(this.tick.bind(this));
  };

  /* hero strip: vertical on desktop, horizontal on mobile (like the original) */
  var heroTrack = document.querySelector(".hero-track");
  if (heroTrack) {
    var heroMarquee = new Marquee(heroTrack, {
      speed: 46,
      getAxis: function () {
        return window.matchMedia("(max-width: 1023px)").matches ? "x" : "y";
      }
    });
    window.addEventListener("resize", function () { heroMarquee.applyTouchAction(); });
  }

  /* trusted-by row: horizontal, draggable with momentum */
  var trustedTrack = document.querySelector(".trusted-track");
  if (trustedTrack) {
    new Marquee(trustedTrack, { speed: 64 });
  }

  /* ============================================================
     Testimonials: dots + arrows + mouse drag (touch swipes natively)
     ============================================================ */
  var viewport = document.getElementById("testiViewport");
  var dotsWrap = document.getElementById("testiDots");
  if (viewport && dotsWrap) {
    var slides = Array.prototype.slice.call(viewport.children);
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "testi-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      dot.addEventListener("click", function () {
        viewport.scrollTo({ left: i * viewport.clientWidth, behavior: "smooth" });
      });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    var ticking = false;
    viewport.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var idx = Math.round(viewport.scrollLeft / viewport.clientWidth);
        idx = Math.max(0, Math.min(dots.length - 1, idx));
        dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
        ticking = false;
      });
    });

    var prev = document.getElementById("testiPrev");
    var next = document.getElementById("testiNext");
    if (prev) prev.addEventListener("click", function () {
      viewport.scrollBy({ left: -viewport.clientWidth, behavior: "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      viewport.scrollBy({ left: viewport.clientWidth, behavior: "smooth" });
    });

    /* desktop drag-to-swipe; touch already scrolls natively */
    var down = false, startX = 0, startScroll = 0, dragged = false;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; dragged = false;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add("dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      viewport.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      viewport.classList.remove("dragging");
      if (dragged) {
        var i = Math.round(viewport.scrollLeft / viewport.clientWidth);
        viewport.scrollTo({ left: i * viewport.clientWidth, behavior: "smooth" });
      }
    });
  }

  /* ============================================================
     FAQ: smooth open/close animation
     ============================================================ */
  Array.prototype.slice.call(document.querySelectorAll(".faq-item")).forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (item.classList.contains("animating")) return;

      var body = item.querySelector(".faq-body");
      var isOpen = item.hasAttribute("open");
      item.classList.add("animating");

      function finish(then) {
        var done = false;
        function cleanup() {
          if (done) return;
          done = true;
          item.classList.remove("animating");
          item.style.height = "";
          if (then) then();
        }
        item.addEventListener("transitionend", cleanup, { once: true });
        setTimeout(cleanup, 420); /* fallback */
      }

      if (!isOpen) {
        var closedH = item.offsetHeight;
        item.setAttribute("open", "");
        var openH = summary.offsetHeight + body.offsetHeight;
        item.style.height = closedH + "px";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { item.style.height = openH + "px"; });
        });
        finish();
      } else {
        var target = summary.offsetHeight;
        item.style.height = item.offsetHeight + "px";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { item.style.height = target + "px"; });
        });
        finish(function () { item.removeAttribute("open"); });
      }
    });
  });

  /* ============================================================
     Hero claim form → availability check → register
     ============================================================ */
  var heroForm = document.getElementById("heroClaimForm");
  var heroInput = document.getElementById("heroClaimInput");
  var heroBtn = heroForm ? heroForm.querySelector("button[type='submit']") : null;
  var heroFb = document.getElementById("heroClaimFeedback");
  if (heroForm && heroInput && heroBtn && heroFb) {
    heroForm.addEventListener("submit", function () {
      var raw = heroInput.value.trim().replace(/^linktr\.ee\//i, "").replace(/\s+/g, "").toLowerCase();
      heroFb.classList.remove("show");
      if (!raw) {
        heroFb.textContent = "Type a username first — e.g. linktr.ee/yourname";
        heroFb.classList.add("show");
        heroInput.focus();
        return;
      }
      heroBtn.disabled = true;
      heroBtn.innerHTML = "<span class='spin'></span>Checking availability…";
      setTimeout(function () {
        heroBtn.disabled = false;
        heroBtn.textContent = "Get started for free";
        heroFb.innerHTML = "🎉 <strong>linktr.ee/" + raw + "</strong> looks available — taking you to sign up…";
        heroFb.classList.add("show");
        setTimeout(function () {
          window.location.href = "register.html?claim=" + encodeURIComponent(raw);
        }, 900);
      }, 900);
    });
  }

  /* ============================================================
     Footer claim form: playful availability check
     ============================================================ */
  var claimForm = document.querySelector(".claim-form");
  var claimInput = claimForm ? claimForm.querySelector(".claim-input") : null;
  var claimBtn = claimForm ? claimForm.querySelector("button[type='submit']") : null;
  var claimFeedback = document.getElementById("claimFeedback");
  if (claimForm && claimInput && claimBtn && claimFeedback) {
    claimForm.addEventListener("submit", function () {
      var raw = claimInput.value.trim().replace(/^linktr\.ee\//i, "").replace(/\s+/g, "").toLowerCase();
      claimFeedback.classList.remove("show");
      if (!raw) {
        claimFeedback.textContent = "Type a username first — e.g. linktr.ee/yourname";
        claimFeedback.classList.add("show");
        claimInput.focus();
        return;
      }
      claimBtn.disabled = true;
      claimBtn.innerHTML = "<span class='spin'></span>Checking availability…";
      setTimeout(function () {
        claimBtn.disabled = false;
        claimBtn.textContent = "Claim your Linktree";
        claimFeedback.innerHTML = "🎉 <strong>linktr.ee/" + raw + "</strong> looks available — taking you to sign up…";
        claimFeedback.classList.add("show");
        setTimeout(function () {
          window.location.href = "register.html?claim=" + encodeURIComponent(raw);
        }, 900);
      }, 900);
    });
  }

  /* ============================================================
     QR card: progressive draw when it scrolls into view
     ============================================================ */
  (function () {
    var qr = document.getElementById("qrCanvas");
    if (!qr || !qr.getContext) return;
    var ctx = qr.getContext("2d");
    var size = 880;
    var modules = 33;
    var cell = size / (modules + 8);
    var offset = cell * 4;
    var seed = 42;
    function rnd() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }

    var coords = [];
    for (var r = 0; r < modules; r++) {
      for (var c = 0; c < modules; c++) {
        var inFinder = (r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8);
        if (!inFinder && rnd() > 0.52) coords.push([r, c]);
      }
    }
    for (var i = coords.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = coords[i]; coords[i] = coords[j]; coords[j] = tmp;
    }
    var total = coords.length;

    function finder(x, y) {
      var s = cell * 7;
      ctx.fillStyle = "#254F1A";
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + cell, y + cell, s - cell * 2, s - cell * 2);
      ctx.fillStyle = "#254F1A";
      ctx.fillRect(x + cell * 2, y + cell * 2, s - cell * 4, s - cell * 4);
    }

    function centerMark() {
      ctx.fillStyle = "#ffffff";
      var cw = cell * 9;
      ctx.fillRect(size / 2 - cw / 2, size / 2 - cw / 2, cw, cw);
      ctx.strokeStyle = "#254F1A";
      ctx.lineWidth = cell * 0.8;
      ctx.lineCap = "round";
      var cx = size / 2, cy = size / 2, L = cw * 0.32;
      [[0, 1], [0.7, 0.7], [-0.7, 0.7], [1, 0.2], [-1, 0.2]].forEach(function (d) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + L * 0.9);
        ctx.lineTo(cx + d[0] * L, cy + L * 0.9 - Math.abs(d[1]) * L * 1.6 - L * 0.4);
        ctx.stroke();
      });
    }

    function paint(p) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#254F1A";
      var n = Math.floor(total * p);
      for (var k = 0; k < n; k++) {
        ctx.fillRect(offset + coords[k][1] * cell, offset + coords[k][0] * cell, cell * 0.92, cell * 0.92);
      }
      if (p >= 1) {
        finder(offset, offset);
        finder(offset + cell * (modules - 7), offset);
        finder(offset, offset + cell * (modules - 7));
        centerMark();
      }
    }

    paint(0);
    if (!("IntersectionObserver" in window)) { paint(1); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        var start = null;
        function step(t) {
          if (start === null) start = t;
          var linear = Math.min(1, (t - start) / 1100);
          var eased = 1 - Math.pow(1 - linear, 3);
          paint(eased);
          if (linear < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.3 });
    io.observe(qr);
  })();

  /* ---------- reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  /* ---------- trusted heading word rotator ---------- */
  var word = document.getElementById("trustedWord");
  var words = ["musicians", "creators", "brands", "podcasters", "sellers", "you"];
  var wi = 0;
  if (word) {
    setInterval(function () {
      wi = (wi + 1) % words.length;
      word.style.transition = "opacity .25s";
      word.style.opacity = "0";
      setTimeout(function () {
        word.textContent = words[wi];
        word.style.opacity = "1";
      }, 250);
    }, 2600);
  }
})();
