/* ==========================================================================
   RETRO YOUTUBE — Content Script (DOM Manipulation)
   Adds dynamic retro elements that CSS alone can't achieve
   ========================================================================== */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // UTILS — Debounce helper to avoid MutationObserver overload
  // ---------------------------------------------------------------------------
  let debounceTimer = null;
  function debounce(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
  }

  // ---------------------------------------------------------------------------
  // 1. Add a retro "Broadcast Yourself" tagline next to the logo
  // ---------------------------------------------------------------------------
  function addBroadcastTagline() {
    const logo = document.querySelector("ytd-topbar-logo-renderer #logo");
    if (!logo || document.getElementById("retro-tagline")) return;

    const tagline = document.createElement("span");
    tagline.id = "retro-tagline";
    tagline.textContent = "Broadcast Yourself™";
    tagline.style.cssText = `
      font-family: Arial, sans-serif;
      font-size: 10px;
      font-style: italic;
      color: #666;
      margin-left: 6px;
      position: relative;
      top: 4px;
      letter-spacing: 0.3px;
      white-space: nowrap;
    `;
    logo.parentNode.insertBefore(tagline, logo.nextSibling);
  }

  // ---------------------------------------------------------------------------
  // 2. Add a classic top navigation bar
  // ---------------------------------------------------------------------------
  function addRetroNavBar() {
    if (document.getElementById("retro-nav-bar")) return;

    const masthead = document.querySelector("#masthead-container");
    if (!masthead) return;

    const nav = document.createElement("div");
    nav.id = "retro-nav-bar";
    nav.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0;
      background: linear-gradient(to bottom, #f7f7f7, #e5e5e5);
      border-bottom: 1px solid #c0c0c0;
      padding: 0 16px;
      font-family: Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      height: 30px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      position: relative;
      z-index: 1000;
    `;

    const links = [
      { text: "Home", href: "/" },
      { text: "Videos", href: "/feed/trending" },
      { text: "Channels", href: "/feed/channels" },
      { text: "Subscriptions", href: "/feed/subscriptions" },
      { text: "History", href: "/feed/history" },
    ];

    links.forEach((item, i) => {
      const a = document.createElement("a");
      a.textContent = item.text;
      a.href = item.href;
      a.style.cssText = `
        padding: 6px 14px;
        color: #333;
        text-decoration: none;
        border-right: 1px solid #ccc;
        ${i === 0 ? "border-left: 1px solid #ccc;" : ""}
        height: 100%;
        display: flex;
        align-items: center;
      `;
      a.addEventListener("mouseenter", () => {
        a.style.background = "linear-gradient(to bottom, #eee, #ddd)";
      });
      a.addEventListener("mouseleave", () => {
        a.style.background = "transparent";
      });
      nav.appendChild(a);
    });

    masthead.parentNode.insertBefore(nav, masthead.nextSibling);
  }

  // ---------------------------------------------------------------------------
  // 3. Add star ratings below video cards on browse/search pages
  // ---------------------------------------------------------------------------
  function addStarRatings() {
    const titles = document.querySelectorAll(
      "ytd-rich-item-renderer #video-title, ytd-video-renderer #video-title"
    );

    titles.forEach((title) => {
      const parent = title.closest(
        "ytd-rich-item-renderer, ytd-video-renderer"
      );
      if (!parent || parent.querySelector(".retro-stars")) return;

      const starsContainer = document.createElement("div");
      starsContainer.className = "retro-stars";
      starsContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1px;
        margin-top: 2px;
        font-size: 12px;
      `;

      // Random rating between 3 and 5 stars for visual variety
      const rating = Math.floor(Math.random() * 3) + 3;
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.textContent = i <= rating ? "★" : "☆";
        star.style.color = i <= rating ? "#e6a800" : "#ccc";
        starsContainer.appendChild(star);
      }

      const ratingText = document.createElement("span");
      ratingText.textContent = ` ${rating}.0`;
      ratingText.style.cssText = `
        font-size: 10px;
        color: #666;
        margin-left: 4px;
        font-family: Arial, sans-serif;
      `;
      starsContainer.appendChild(ratingText);

      const meta =
        parent.querySelector("#metadata, #metadata-line") ||
        title.parentNode;
      if (meta) {
        meta.appendChild(starsContainer);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Style view counts with retro badge look
  // ---------------------------------------------------------------------------
  function styleViewCounts() {
    const viewSpans = document.querySelectorAll(
      "#metadata-line span.ytd-video-meta-block"
    );
    viewSpans.forEach((span) => {
      if (span.dataset.retroStyled) return;
      if (span.textContent.includes("view")) {
        span.style.cssText = `
          background: #eee;
          border: 1px solid #ccc;
          border-radius: 2px;
          padding: 1px 5px;
          font-size: 10px;
          font-family: Arial, sans-serif;
          color: #555;
        `;
        span.dataset.retroStyled = "true";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. WATCH PAGE — Interactive Star Rating Bar
  //    Classic 5-star horizontal bar below the video title, with hover effects
  // ---------------------------------------------------------------------------
  function addWatchPageRatingBar() {
    // Only on watch pages
    if (!location.pathname.startsWith("/watch")) return;
    if (document.getElementById("retro-watch-rating-bar")) return;

    // Find insertion point — below the title, above the action buttons
    const titleContainer = document.querySelector(
      "ytd-watch-metadata #title, #above-the-fold #title"
    );
    if (!titleContainer) return;

    const bar = document.createElement("div");
    bar.id = "retro-watch-rating-bar";

    // "Rate this video:" label
    const label = document.createElement("span");
    label.className = "retro-rate-label";
    label.textContent = "Rate this video:";
    bar.appendChild(label);

    // Star track
    const starTrack = document.createElement("div");
    starTrack.className = "retro-star-track";

    let currentRating = 0;

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = "☆";
      star.style.color = "#ccc";
      star.dataset.value = i;

      star.addEventListener("mouseenter", () => {
        // Highlight up to this star
        const stars = starTrack.querySelectorAll("span");
        stars.forEach((s) => {
          const v = parseInt(s.dataset.value);
          s.textContent = v <= i ? "★" : "☆";
          s.style.color = v <= i ? "#e6a800" : "#ccc";
        });
      });

      star.addEventListener("mouseleave", () => {
        // Reset to current rating
        const stars = starTrack.querySelectorAll("span");
        stars.forEach((s) => {
          const v = parseInt(s.dataset.value);
          s.textContent = v <= currentRating ? "★" : "☆";
          s.style.color = v <= currentRating ? "#e6a800" : "#ccc";
        });
      });

      star.addEventListener("click", () => {
        currentRating = i;
        const stars = starTrack.querySelectorAll("span");
        stars.forEach((s) => {
          const v = parseInt(s.dataset.value);
          s.textContent = v <= currentRating ? "★" : "☆";
          s.style.color = v <= currentRating ? "#e6a800" : "#ccc";
        });
        // Update the text
        ratingText.textContent = `${currentRating}/5 — Thanks for rating!`;
        ratingText.style.color = "#2a7a2a";

        // Show toast
        showRetroToast("⭐", `You rated this video ${currentRating}/5 stars!`);

        // Reset text after 3s
        setTimeout(() => {
          ratingText.textContent = `${currentRating}/5`;
          ratingText.style.color = "#666";
        }, 3000);
      });

      starTrack.appendChild(star);
    }
    bar.appendChild(starTrack);

    // Rating text
    const ratingText = document.createElement("span");
    ratingText.className = "retro-rating-text";
    ratingText.textContent = "Not yet rated";
    bar.appendChild(ratingText);

    // Separator + ratings count (fake but nostalgic)
    const sep = document.createElement("span");
    sep.style.cssText = `
      width: 1px; height: 14px; background: #ccc; margin: 0 4px;
    `;
    bar.appendChild(sep);

    const totalRatings = document.createElement("span");
    totalRatings.className = "retro-rating-text";
    const fakeCount = Math.floor(Math.random() * 50000) + 5000;
    totalRatings.textContent = `${fakeCount.toLocaleString()} ratings`;
    bar.appendChild(totalRatings);

    // Insert after the title
    titleContainer.parentNode.insertBefore(bar, titleContainer.nextSibling);
  }

  // ---------------------------------------------------------------------------
  // 6. TOAST NOTIFICATION SYSTEM
  //    Classic "Added to queue" / feedback popups
  // ---------------------------------------------------------------------------
  function showRetroToast(icon, message) {
    // Remove existing toast if any
    const existing = document.getElementById("retro-toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "retro-toast-notification";

    const iconSpan = document.createElement("span");
    iconSpan.className = "retro-toast-icon";
    iconSpan.textContent = icon;
    toast.appendChild(iconSpan);

    const textSpan = document.createElement("span");
    textSpan.className = "retro-toast-text";
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    const closeBtn = document.createElement("span");
    closeBtn.className = "retro-toast-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => toast.remove());
    toast.appendChild(closeBtn);

    document.body.appendChild(toast);

    // Auto-remove after animation completes (3.4s total)
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3500);
  }

  // ---------------------------------------------------------------------------
  // 7. Intercept YouTube's native actions to show retro toasts
  // ---------------------------------------------------------------------------
  function hookActionButtons() {
    // Hook "Save" / "Add to playlist" buttons
    const saveButtons = document.querySelectorAll(
      'ytd-button-renderer[button-renderer] a[aria-label*="Save"], ' +
      'button[aria-label*="Save"], ' +
      'button[aria-label*="save"], ' +
      '#top-level-buttons-computed ytd-button-renderer'
    );

    saveButtons.forEach((btn) => {
      if (btn.dataset.retroHooked) return;
      btn.dataset.retroHooked = "true";
      btn.addEventListener("click", () => {
        setTimeout(() => {
          showRetroToast("📋", "Added to queue — Classic style!");
        }, 300);
      });
    });

    // Hook the "Share" button
    const shareButtons = document.querySelectorAll(
      'button[aria-label*="Share"], button[aria-label*="share"]'
    );
    shareButtons.forEach((btn) => {
      if (btn.dataset.retroHooked) return;
      btn.dataset.retroHooked = "true";
      btn.addEventListener("click", () => {
        setTimeout(() => {
          showRetroToast("🔗", "Share link copied — Send it to your friends on MySpace!");
        }, 300);
      });
    });

    // Hook "Subscribe" button
    const subButtons = document.querySelectorAll(
      "#subscribe-button button, ytd-subscribe-button-renderer button"
    );
    subButtons.forEach((btn) => {
      if (btn.dataset.retroHooked) return;
      btn.dataset.retroHooked = "true";
      btn.addEventListener("click", () => {
        setTimeout(() => {
          showRetroToast("📺", "Subscribed! You'll receive email notifications.");
        }, 300);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Add a footer bar reminiscent of 2008 YouTube
  // ---------------------------------------------------------------------------
  function addRetroFooter() {
    if (document.getElementById("retro-footer")) return;

    const footer = document.createElement("div");
    footer.id = "retro-footer";
    footer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 28px;
      background: linear-gradient(to bottom, #f0f0f0, #ddd);
      border-top: 1px solid #bbb;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #666;
      z-index: 9999;
      padding: 0 20px;
    `;

    const items = [
      "© 2008 YouTube, LLC",
      "About",
      "Press & Blogs",
      "Copyright",
      "Creators & Partners",
      "Advertising",
      "Developers",
      "Terms",
      "Privacy",
      "Safety",
      "Send feedback",
    ];

    items.forEach((text, i) => {
      const span = document.createElement("span");
      if (i === 0) {
        span.textContent = text;
        span.style.fontWeight = "bold";
        span.style.color = "#999";
      } else {
        const a = document.createElement("a");
        a.textContent = text;
        a.href = "#";
        a.style.cssText = `color: #0033cc; text-decoration: none;`;
        a.addEventListener("mouseenter", () => {
          a.style.textDecoration = "underline";
        });
        a.addEventListener("mouseleave", () => {
          a.style.textDecoration = "none";
        });
        a.addEventListener("click", (e) => e.preventDefault());
        span.appendChild(a);
      }
      footer.appendChild(span);
    });

    document.body.appendChild(footer);
  }

  // ---------------------------------------------------------------------------
  // 9. Remove the retro watch-page elements on navigation (SPA cleanup)
  // ---------------------------------------------------------------------------
  function cleanupWatchElements() {
    const ratingBar = document.getElementById("retro-watch-rating-bar");
    if (ratingBar && !location.pathname.startsWith("/watch")) {
      ratingBar.remove();
    }
  }

  // ---------------------------------------------------------------------------
  // 11. Replace the modern logo with the classic PNG logo
  // ---------------------------------------------------------------------------
  function replaceLogo() {
    const logoContainers = document.querySelectorAll("ytd-topbar-logo-renderer #logo, #logo-icon-container");
    logoContainers.forEach(container => {
      if (container.querySelector(".retro-logo-img")) return;
      
      const svgs = container.querySelectorAll("svg, yt-icon");
      if (svgs.length > 0) {
        svgs.forEach(svg => svg.style.display = "none");
        
        const img = document.createElement("img");
        img.src = chrome.runtime.getURL("logo.png");
        img.className = "retro-logo-img";
        img.style.height = "32px";
        img.style.marginLeft = "12px";
        img.style.marginTop = "0px";
        container.appendChild(img);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Master initializer
  // ---------------------------------------------------------------------------
  function initRetro() {
    addBroadcastTagline();
    addRetroNavBar();
    addStarRatings();
    styleViewCounts();
    addRetroFooter();
    addWatchPageRatingBar();
    hookActionButtons();
    replaceLogo();
    cleanupWatchElements();
  }

  // Initial run — slight delay to let YouTube's dynamic content load
  setTimeout(initRetro, 1500);

  // Debounced MutationObserver — avoids excessive re-runs
  const observer = new MutationObserver(() => {
    debounce(() => {
      addBroadcastTagline();
      addRetroNavBar();
      addStarRatings();
      styleViewCounts();
      addRetroFooter();
      addWatchPageRatingBar();
      hookActionButtons();
      replaceLogo();
    }, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also re-run on YouTube's SPA navigation events
  window.addEventListener("yt-navigate-finish", () => {
    setTimeout(initRetro, 800);
  });

  // Show a welcome toast on first load
  setTimeout(() => {
    showRetroToast("🕹️", "Retro YouTube activated — Welcome back to 2008!");
  }, 2500);
})();

