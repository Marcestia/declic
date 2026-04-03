document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");
const heroMedia = document.querySelector(".hero__media");
const serviceCards = document.querySelectorAll(".service-card");
const canvas = document.getElementById("embers-canvas");
const contactForm = document.getElementById("contact-form");
const contactFormStatus = document.getElementById("contact-form-status");
const promoBandRail = document.querySelector(".promo-band__rail");

if (prefersReducedMotion) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  reveals.forEach((element) => revealObserver.observe(element));
}

if (heroMedia && !prefersReducedMotion) {
  let ticking = false;

  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.12, 60);
    const scale = 1.08 + Math.min(window.scrollY * 0.00012, 0.03);
    heroMedia.style.transform = `translateY(${offset}px) scale(${scale})`;
    ticking = false;
  };

  updateParallax();

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateParallax);
      }
    },
    { passive: true }
  );
}

if (promoBandRail) {
  const promoTracks = promoBandRail.querySelectorAll(".promo-band__track");

  if (promoTracks.length >= 2) {
    let promoFrameId = 0;
    let promoTrackWidth = 0;
    let promoOffset = 0;

    const getPromoSpeed = () => {
      if (window.innerWidth <= 640) {
        return 0.7;
      }

      if (window.innerWidth <= 1080) {
        return 0.9;
      }

      return 1.15;
    };

    const measurePromoBand = () => {
      promoTrackWidth = promoTracks[0].getBoundingClientRect().width;
      if (!promoTrackWidth) {
        return;
      }

      promoOffset = -promoTrackWidth;
      promoBandRail.style.transform = `translate3d(${promoOffset}px, 0, 0)`;
    };

    const animatePromoBand = () => {
      promoOffset += getPromoSpeed();

      if (!promoTrackWidth) {
        promoFrameId = window.requestAnimationFrame(animatePromoBand);
        return;
      }

      if (promoOffset >= 0) {
        promoOffset = -promoTrackWidth;
      }

      promoBandRail.style.transform = `translate3d(${promoOffset}px, 0, 0)`;
      promoFrameId = window.requestAnimationFrame(animatePromoBand);
    };

    promoBandRail.style.animation = "none";
    measurePromoBand();
    animatePromoBand();

    window.addEventListener("resize", measurePromoBand);
    window.addEventListener("load", measurePromoBand);
    document.fonts?.ready.then(measurePromoBand).catch(() => {});
    window.addEventListener("beforeunload", () => window.cancelAnimationFrame(promoFrameId));
  }
}

if (!prefersReducedMotion) {
  serviceCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--rotate-x", `${(-y * 8).toFixed(2)}deg`);
      card.style.setProperty("--rotate-y", `${(x * 10).toFixed(2)}deg`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
    });
  });
}

if (contactForm) {
  const submitButton = contactForm.querySelector(".contact-form__submit");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    if (contactFormStatus) {
      contactFormStatus.textContent = "Envoi en cours...";
      contactFormStatus.classList.remove("is-success", "is-error");
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Envoi impossible pour le moment.");
      }

      contactForm.reset();

      if (contactFormStatus) {
        contactFormStatus.textContent =
          result.message || "Message envoyé. Nous revenons vers vous rapidement.";
        contactFormStatus.classList.add("is-success");
      }
    } catch (error) {
      if (contactFormStatus) {
        contactFormStatus.textContent =
          error instanceof Error ? error.message : "Envoi impossible pour le moment.";
        contactFormStatus.classList.add("is-error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (canvas && !prefersReducedMotion) {
  const context = canvas.getContext("2d");
  const particles = [];
  let animationFrameId = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const createParticle = (freshStart = false) => ({
    x: Math.random() * width,
    y: freshStart ? height + Math.random() * height * 0.25 : Math.random() * height,
    speedX: (Math.random() - 0.5) * 0.35,
    speedY: -(0.3 + Math.random() * 0.95),
    radius: 0.8 + Math.random() * 2.4,
    alpha: 0.16 + Math.random() * 0.5,
    hue: 18 + Math.random() * 18,
  });

  const resizeCanvas = () => {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    const count = Math.min(95, Math.max(36, Math.floor(width / 18)));
    for (let index = 0; index < count; index += 1) {
      particles.push(createParticle());
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.alpha -= 0.0009;

      if (particle.y < -20 || particle.alpha <= 0) {
        Object.assign(particle, createParticle(true));
      }

      const glow = context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 6
      );

      glow.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${particle.alpha})`);
      glow.addColorStop(0.35, `hsla(${particle.hue}, 100%, 55%, ${particle.alpha * 0.45})`);
      glow.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);

      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * 6, 0, Math.PI * 2);
      context.fill();
    });

    animationFrameId = window.requestAnimationFrame(draw);
  };

  resizeCanvas();
  draw();

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(animationFrameId));
}
