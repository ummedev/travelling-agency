/* =========================================================
   SkyVoyage — shared interactions
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Shared nav + footer ---------- */
  const pages = [
    { href: "index.html", label: "Home" },
    { href: "tours.html", label: "Tours" },
    { href: "booking.html", label: "Booking & Hotels" },
    { href: "contact.html", label: "Contact" },
  ];
  const current = location.pathname.split("/").pop() || "index.html";

  const navHost = $("#site-nav");
  if (navHost) {
    navHost.outerHTML = `
      <nav class="nav" id="nav">
        <div class="container">
          <a href="index.html" class="logo"><span class="logo-mark">✈</span><span><span class="sky">Sky</span>Voyage</span></a>
          <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
          <ul class="nav-links" id="navLinks">
            ${pages.map(p => `<li><a href="${p.href}" class="${p.href === current ? "active" : ""}">${p.label}</a></li>`).join("")}
          </ul>
        </div>
      </nav>`;
  }

  const footHost = $("#site-footer");
  if (footHost) {
    footHost.outerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="index.html" class="logo"><span class="logo-mark">✈</span><span><span class="sky">Sky</span>Voyage</span></a>
              <p style="margin-top:16px">Crafting unforgettable journeys since 2008. Handpicked tours, luxury stays and 24/7 travel support across 120+ destinations.</p>
              <div class="socials"><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="X">x</a><a href="#" aria-label="YouTube">yt</a></div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>${pages.map(p => `<li><a href="${p.href}">${p.label}</a></li>`).join("")}</ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul><li>+1 (555) 248-7720</li><li>hello@skyvoyage.travel</li><li>221 Ocean Drive, Miami, FL</li></ul>
            </div>
            <div>
              <h4>Newsletter</h4>
              <p>Get secret deals and travel inspiration.</p>
              <form class="newsletter" id="newsletter"><input type="email" placeholder="Your email" required aria-label="Email"><button type="submit">Join</button></form>
            </div>
          </div>
          <div class="footer-bottom">© ${new Date().getFullYear()} SkyVoyage Travel Agency. All rights reserved.</div>
        </div>
      </footer>`;
  }

  /* ---------- Toast ---------- */
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);
  let toastTimer;
  window.showToast = function (msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  };

  /* ---------- Preloader ---------- */
  const hidePreloader = () => { const pre = $(".preloader"); if (pre) pre.classList.add("hide"); };
  window.addEventListener("load", () => setTimeout(hidePreloader, 400));
  setTimeout(hidePreloader, 3000); // don't wait forever on slow image loads

  /* ---------- Nav behaviour ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", links).forEach(a => a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      document.body.style.overflow = "";
    }));
  }

  const newsletter = $("#newsletter");
  if (newsletter) newsletter.addEventListener("submit", e => {
    e.preventDefault();
    newsletter.reset();
    showToast("🎉 You're subscribed! Watch your inbox for deals.");
  });

  /* ---------- Image fallback ---------- */
  $$("img").forEach(img => img.addEventListener("error", () => {
    img.style.background = "linear-gradient(135deg,#1d3557,#2b8cff)";
    img.removeAttribute("src");
  }, { once: true }));

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const el = en.target;
        el.classList.add("visible");
        // once revealed, hand transform control back to the fast 3D tilt transition
        setTimeout(() => el.classList.add("done"), 1000 + (+el.dataset.delay || 0));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (el.dataset.delay || 0) + "ms";
    io.observe(el);
  });

  /* ---------- Scroll parallax ---------- */
  const parallaxEls = $$("[data-speed]");
  const heroScenes = $(".hero-scenes");
  const heroContent = $(".hero-content");
  const mountainLayers = $$(".mountains[data-scroll]");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (reduceMotion) return;

    parallaxEls.forEach(el => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const offset = (rect.top + rect.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    if (heroScenes && y < innerHeight * 1.2) {
      heroScenes.style.setProperty("--sy", y * 0.45 + "px");
      mountainLayers.forEach(m => m.style.setProperty("--sy", -y * parseFloat(m.dataset.scroll) + "px"));
      if (heroContent) {
        heroContent.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.7));
        heroContent.style.setProperty("--sy", y * 0.3 + "px");
      }
    }
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Mouse parallax (hero) ----------
     Each [data-depth] layer combines its scroll offset (--sy) with a
     mouse-driven offset so the scene feels layered in 3D. */
  const hero = $(".hero, .page-hero");
  const depthEls = $$("[data-depth]");
  let mx = 0, my = 0, cx = 0, cy = 0;

  if (hero && depthEls.length && !reduceMotion) {
    hero.addEventListener("mousemove", e => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("mouseleave", () => { mx = 0; my = 0; });

    // gentle device tilt on phones
    window.addEventListener("deviceorientation", e => {
      if (e.gamma == null) return;
      mx = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
      my = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60));
    });

    (function loop() {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      depthEls.forEach(el => {
        const d = parseFloat(el.dataset.depth);
        const tx = -cx * d * 60;
        const ty = -cy * d * 40;
        if (el.classList.contains("hero-content")) {
          el.style.transform = `translate3d(${tx}px, calc(${ty}px + var(--sy, 0px)), 0) rotateY(${cx * 8}deg) rotateX(${-cy * 8}deg)`;
        } else {
          el.style.transform = `translate3d(${tx}px, calc(${ty}px + var(--sy, 0px)), 0)`;
        }
      });
      requestAnimationFrame(loop);
    })();
  } else {
    depthEls.forEach(el => { el.style.transform = "translate3d(0, var(--sy, 0px), 0)"; });
  }

  /* ---------- Home hero: rotating places ---------- */
  const scenes = $$(".scene");
  if (scenes.length) {
    const nameEl = $("#sceneName");
    const dotsWrap = $(".scene-dots");
    let idx = 0, timer;

    scenes.forEach((s, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Show " + s.dataset.name);
      b.addEventListener("click", () => { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    const dots = $$("button", dotsWrap);

    function go(i) {
      scenes[idx].classList.remove("active");
      dots[idx].classList.remove("active");
      idx = (i + scenes.length) % scenes.length;
      scenes[idx].classList.add("active");
      dots[idx].classList.add("active");
      nameEl.classList.add("swap");
      setTimeout(() => {
        nameEl.textContent = scenes[idx].dataset.name;
        nameEl.classList.remove("swap");
      }, 400);
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(idx + 1), 6000);
    }
    scenes[0].classList.add("active");
    dots[0].classList.add("active");
    nameEl.textContent = scenes[0].dataset.name;
    restart();
  }

  /* ---------- 3D tilt cards ---------- */
  if (!isTouch && !reduceMotion) {
    $$(".tilt").forEach(card => {
      const max = parseFloat(card.dataset.tilt || 12);
      if (!$(".shine", card)) {
        const shine = document.createElement("div");
        shine.className = "shine";
        card.appendChild(shine);
      }
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateY(${(x - 0.5) * max * 2}deg) rotateX(${(0.5 - y) * max * 2}deg) scale(1.03)`;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const end = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const dur = 1800;
        (function step(t) {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Tours: filter + tap to flip ---------- */
  const filterBtns = $$(".filter-btn");
  if (filterBtns.length) {
    filterBtns.forEach(btn => btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      $$(".tour-card").forEach(card => {
        const show = f === "all" || card.dataset.cat.split(" ").includes(f);
        card.classList.toggle("hidden", !show);
      });
    }));
  }
  if (isTouch) {
    $$(".tour-card").forEach(card => card.addEventListener("click", e => {
      if (e.target.closest("a, button")) return;
      card.classList.toggle("flipped");
    }));
  }

  /* ---------- Home quick search -> booking page ---------- */
  const quick = $("#quickSearch");
  if (quick) quick.addEventListener("submit", e => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(quick));
    location.href = "booking.html?" + params.toString();
  });

  /* ---------- Booking ---------- */
  const bookingForm = $("#bookingForm");
  if (bookingForm) {
    const hotelSel = $("#hotel");
    const checkin = $("#checkin");
    const checkout = $("#checkout");
    const guests = $("#guests");
    const today = new Date().toISOString().split("T")[0];
    checkin.min = today;
    checkout.min = today;

    // Prefill from query string (home quick search / tour buttons)
    const q = new URLSearchParams(location.search);
    if (q.get("destination")) {
      const opt = Array.from(hotelSel.options).find(o => o.dataset.dest === q.get("destination"));
      if (opt) hotelSel.value = opt.value;
    }
    if (q.get("checkin")) checkin.value = q.get("checkin");
    if (q.get("checkout")) checkout.value = q.get("checkout");
    if (q.get("guests")) guests.value = q.get("guests");

    const roomMult = { standard: 1, deluxe: 1.4, suite: 2 };
    const fmt = n => "$" + Math.round(n).toLocaleString();

    function nights() {
      const a = new Date(checkin.value), b = new Date(checkout.value);
      const n = Math.round((b - a) / 86400000);
      return isNaN(n) || n < 1 ? 0 : n;
    }

    function update() {
      const opt = hotelSel.selectedOptions[0];
      const base = parseFloat(opt.dataset.price);
      const room = $("input[name=room]:checked", bookingForm).value;
      const g = parseInt(guests.value, 10) || 1;
      const n = nights();
      const rooms = Math.ceil(g / 2);
      const subtotal = base * roomMult[room] * rooms * n;
      const taxes = subtotal * 0.12;

      $("#sumHotel").textContent = opt.textContent.split(" — ")[0];
      $("#sumNights").textContent = n ? `${n} night${n > 1 ? "s" : ""}` : "Select dates";
      $("#sumRoom").textContent = `${room[0].toUpperCase() + room.slice(1)} × ${rooms}`;
      $("#sumGuests").textContent = g;
      $("#sumTaxes").textContent = fmt(taxes);
      $("#sumTotal").textContent = fmt(subtotal + taxes);
      const img = $("#sumImg");
      if (img.getAttribute("src") !== opt.dataset.img) {
        img.style.opacity = 0;
        setTimeout(() => { img.src = opt.dataset.img; img.style.opacity = 1; }, 250);
      }
    }

    checkin.addEventListener("change", () => {
      checkout.min = checkin.value;
      if (checkout.value && checkout.value <= checkin.value) checkout.value = "";
      update();
    });
    bookingForm.addEventListener("input", update);
    bookingForm.addEventListener("change", update);
    update();

    // "Book now" on hotel cards selects that hotel and scrolls to the form
    $$("[data-book]").forEach(btn => btn.addEventListener("click", () => {
      hotelSel.value = btn.dataset.book;
      update();
      $("#booking").scrollIntoView({ behavior: "smooth" });
    }));

    bookingForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!validate(bookingForm)) return;
      if (!nights()) {
        setError(checkout.closest(".field"), "Check-out must be after check-in");
        return;
      }
      $("#modalText").textContent =
        `Your stay at ${$("#sumHotel").textContent} for ${$("#sumNights").textContent} is reserved. Total: ${$("#sumTotal").textContent}. A confirmation has been sent to your email.`;
      openModal();
      bookingForm.reset();
      update();
    });
  }

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  function openModal() { modal.classList.add("open"); }
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) modal.classList.remove("open");
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") modal.classList.remove("open"); });
  }

  /* ---------- Form validation ---------- */
  function setError(field, msg) {
    field.classList.add("error");
    const err = $(".err", field);
    if (err) err.textContent = msg;
  }
  function validate(form) {
    let ok = true;
    $$(".field", form).forEach(f => {
      f.classList.remove("error");
      const err = $(".err", f);
      if (err) err.textContent = "";
      const input = $("input, select, textarea", f);
      if (!input || input.type === "radio") return;
      const v = input.value.trim();
      if (input.required && !v) { setError(f, "This field is required"); ok = false; }
      else if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError(f, "Enter a valid email"); ok = false; }
      else if (input.type === "tel" && v && !/^[+\d][\d\s()-]{6,}$/.test(v)) { setError(f, "Enter a valid phone number"); ok = false; }
      else if (input.minLength > 0 && v.length < input.minLength) { setError(f, `Please write at least ${input.minLength} characters`); ok = false; }
    });
    if (!ok) { const first = $(".field.error input, .field.error textarea, .field.error select", form); if (first) first.focus(); }
    return ok;
  }

  /* ---------- Contact ---------- */
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.setAttribute("novalidate", "");
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!validate(contactForm)) return;
      const name = $("#cname").value.trim().split(" ")[0];
      contactForm.reset();
      showToast(`✈ Thanks ${name}! Our travel experts will reply within 24 hours.`);
    });
  }
  if (bookingForm) bookingForm.setAttribute("novalidate", "");

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach(item => {
    const q = $(".faq-q", item), a = $(".faq-a", item);
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    });
  });
})();
