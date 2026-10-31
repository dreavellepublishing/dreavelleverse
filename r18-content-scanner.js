
/* DreavelleVerse R18 content screening
   Advisory only — not automated moderation.
*/
(() => {
  const start = () => {
    const area = document.querySelector(".chapter-writing-area");
    if (!area || document.getElementById("dv-r18-scanner")) return;

    const rules = [
      {
        name: "Sexual content",
        terms: [/\bexplicit sex\b/i, /\bsexual intercourse\b/i, /\bsexual assault\b/i, /\bsex scene\b/i]
      },
      {
        name: "Graphic violence",
        terms: [/\bgore\b/i, /\bdismember(?:ed|ment)?\b/i, /\bgraphic violence\b/i, /\bbrutal torture\b/i]
      },
      {
        name: "Abuse",
        terms: [/\bdomestic abuse\b/i, /\bchild abuse\b/i, /\bphysical abuse\b/i, /\bsexual abuse\b/i]
      },
      {
        name: "Self-harm themes",
        terms: [/\bself[- ]harm\b/i, /\bsuicid(?:e|al)\b/i, /\bcutting myself\b/i]
      },
      {
        name: "Substance use",
        terms: [/\bdrug overdose\b/i, /\bheroin\b/i, /\bcocaine\b/i, /\bsubstance abuse\b/i]
      },
      {
        name: "Disturbing content",
        terms: [/\bkidnapping\b/i, /\bhostage\b/i, /\btrafficking\b/i, /\bpsychological torture\b/i]
      },
      {
        name: "Strong language",
        terms: [/\bfuck(?:ing|ed)?\b/i, /\bmotherfucker\b/i]
      }
    ];

    const panel = document.createElement("section");
    panel.id = "dv-r18-scanner";
    panel.style.cssText =
      "padding:18px;margin:18px 0;border:1px solid #d9b5e0;border-radius:12px;background:#fff;";

    const heading = document.createElement("h3");
    heading.textContent = "🔎 Content Warning Check";

    const description = document.createElement("p");
    description.textContent =
      "Check your chapter for possible mature themes before publishing. This is a basic keyword screening tool and may miss content.";

    const scanButton = document.createElement("button");
    scanButton.type = "button";
    scanButton.textContent = "Scan Chapter";
    scanButton.style.cssText =
      "padding:11px 16px;background:#873491;color:white;border:0;border-radius:8px;cursor:pointer;";

    const result = document.createElement("div");
    result.setAttribute("role", "status");
    result.style.marginTop = "12px";

    scanButton.addEventListener("click", () => {
      const content = area.value || "";
      result.replaceChildren();

      if (!content.trim()) {
        result.textContent = "Write your chapter before scanning.";
        return;
      }

      const matches = rules.filter(rule =>
        rule.terms.some(pattern => pattern.test(content))
      );

      const summary = document.createElement("p");

      if (!matches.length) {
        summary.textContent =
          "No listed keywords were detected. This does not mean the chapter is free from mature content. Please review your chapter manually.";
        result.append(summary);
        return;
      }

      summary.textContent =
        "Possible mature themes detected. Please review your R18 warning settings:";
      result.append(summary);

      const list = document.createElement("ul");
      matches.forEach(match => {
        const item = document.createElement("li");
        item.textContent = match.name;
        list.append(item);
      });
      result.append(list);

      const reminder = document.createElement("p");
      reminder.textContent =
        "This scan does not automatically mark your chapter R18 or change its publication status.";
      result.append(reminder);
    });

    // Automatically scan after the writer pauses typing.
    let autoScanTimer;

    const autoStatus = document.createElement("p");
    autoStatus.style.cssText =
      "font-size:13px;color:#666;margin-top:8px;";
    autoStatus.textContent =
      "Automatic content screening is active.";

    const scheduleScan = () => {
      clearTimeout(autoScanTimer);

      autoStatus.textContent =
        "Checking chapter content...";

      autoScanTimer = setTimeout(() => {
        if (area.value.trim()) {
          scanButton.click();
          autoStatus.textContent =
            "Automatic check completed. Review any warnings above.";
        } else {
          result.replaceChildren();
          autoStatus.textContent =
            "Start writing to check for mature themes.";
        }
      }, 1200);
    };

    area.addEventListener("input", scheduleScan);

    // Scan existing chapter content when the writer opens it.
    // The editor may load saved content asynchronously.
    let lastContent = area.value;
    const initialCheck = setInterval(() => {
      if (area.value !== lastContent) {
        lastContent = area.value;
        scheduleScan();
      }
    }, 1500);

    // Stop checking after the initial loading period.
    setTimeout(() => clearInterval(initialCheck), 12000);

 panel.append(heading, description, scanButton, result, autoStatus);
    area.insertAdjacentElement("afterend", panel);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
