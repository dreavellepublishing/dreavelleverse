
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
        terms: [
          /\bexplicit sex\b/i,
          /\bsexual intercourse\b/i,
          /\bsexual assault\b/i,
          /\bsex scene\b/i,
          /\bpanggagahasa\b/i,
          /\bginahasa\b/i,
          /\bsekswal na pang-aabuso\b/i,
          /\bsekswal na karahasan\b/i
        ]
      },
      {
        name: "Graphic violence",
        terms: [
          /\bgore\b/i,
          /\bdismember(?:ed|ment)?\b/i,
          /\bgraphic violence\b/i,
          /\bbrutal torture\b/i,
          /\bkarumal-dumal na pagpatay\b/i,
          /\bmalubhang karahasan\b/i,
          /\bpinagpuputol ang katawan\b/i,
          /\bmatinding pagpapahirap\b/i
        ]
      },
      {
        name: "Abuse",
        terms: [
          /\bdomestic abuse\b/i,
          /\bchild abuse\b/i,
          /\bphysical abuse\b/i,
          /\bsexual abuse\b/i,
          /\bpang-aabuso\b/i,
          /\binaabuso\b/i,
          /\bkarahasan sa tahanan\b/i,
          /\bpananakit sa bata\b/i,
          /\bsekswal na pang-aabuso\b/i
        ]
      },
      {
        name: "Self-harm themes",
        terms: [
          /\bself[- ]harm\b/i,
          /\bsuicid(?:e|al)\b/i,
          /\bcutting myself\b/i,
          /\bpagpapakamatay\b/i,
          /\bmagpakamatay\b/i,
          /\bnagpakamatay\b/i,
          /\bsaktan ang sarili\b/i,
          /\bpananakit sa sarili\b/i
        ]
      },
      {
        name: "Substance use",
        terms: [
          /\bdrug overdose\b/i,
          /\bheroin\b/i,
          /\bcocaine\b/i,
          /\bsubstance abuse\b/i,
          /\bilegal na droga\b/i,
          /\bpag-abuso sa droga\b/i,
          /\blabis na paggamit ng droga\b/i
        ]
      },
      {
        name: "Disturbing content",
        terms: [
          /\bkidnapping\b/i,
          /\bhostage\b/i,
          /\btrafficking\b/i,
          /\bpsychological torture\b/i,
          /\bpagdukot\b/i,
          /\bkinidnap\b/i,
          /\bpagpapahirap\b/i,
          /\bhuman trafficking\b/i,
          /\bkalakalan ng tao\b/i
        ]
      },
      {
        name: "Strong language",
        terms: [
          /\bfuck(?:ing|ed)?\b/i,
          /\bmotherfucker\b/i,
          /\bputang ina\b/i,
          /\bputangina\b/i,
          /\bpunyeta\b/i,
          /\bgago\b/i,
          /\btangina\b/i
        ]
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

    // Let writers review and apply suggested warning categories.
    const suggestionBox = document.createElement("div");
    suggestionBox.style.marginTop = "12px";
    panel.append(suggestionBox);

    const categoryNames = [
      "Sexual content",
      "Graphic violence",
      "Abuse",
      "Self-harm themes",
      "Disturbing content",
      "Substance use",
      "Strong language"
    ];

    const updateSuggestions = () => {
      suggestionBox.replaceChildren();

      const content = area.value || "";
      const matches = rules
        .filter(rule =>
          rule.terms.some(pattern => pattern.test(content))
        )
        .map(rule => rule.name)
        .filter(name => categoryNames.includes(name));

      if (!matches.length) return;

      const heading = document.createElement("p");
      heading.textContent =
        "Suggested warnings (review before applying):";
      suggestionBox.append(heading);

      const applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.textContent = "Apply Suggested Categories";
      applyButton.style.cssText =
        "padding:10px 14px;background:#873491;color:white;border:0;border-radius:8px;cursor:pointer;";

      applyButton.addEventListener("click", () => {
        const labels = [
          ...document.querySelectorAll("label")
        ];

        let applied = 0;

        for (const category of matches) {
          const label = labels.find(item =>
            item.textContent.trim().toLowerCase() ===
            category.toLowerCase()
          );

          if (!label) continue;

          const checkbox =
            label.querySelector('input[type="checkbox"]') ||
            (label.htmlFor
              ? document.getElementById(label.htmlFor)
              : null);

          if (!checkbox || checkbox.type !== "checkbox") continue;

          checkbox.checked = true;
          checkbox.dispatchEvent(
            new Event("change", {bubbles: true})
          );
          applied++;
        }

        const status = document.createElement("p");
        status.textContent = applied
          ? `${applied} suggested categories selected. Review and click Save Content Warnings to save them.`
          : "Could not find the matching warning checkboxes. No settings were changed.";
        suggestionBox.append(status);
      });

      suggestionBox.append(applyButton);
    };

    area.addEventListener("input", () => {
      setTimeout(updateSuggestions, 1300);
    });

    scanButton.addEventListener("click", updateSuggestions);

    panel.append(
      heading,
      description,
      scanButton,
      result,
      autoStatus,
      suggestionBox
    );
    area.insertAdjacentElement("afterend", panel);
     
    // Remind writers about detected warnings before publishing.
    // Advisory only: does not change saved settings or block publishing.
    const publishingReminder = (event) => {
      const button = event.target.closest(
  ".publish-chapter-button, #publish-chapter-button, #schedule-chapter-button"
);
if (!button) return;

      const label = (button.textContent || "").trim().toLowerCase();

      if (!/^(publish chapter|schedule chapter)$/.test(label)) {
        return;
      }

      const detected = rules.filter(rule =>
        rule.terms.some(pattern =>
          pattern.test(area.value || "")
        )
      );

      if (!detected.length) return;

      const selectedWarnings = [
        ...document.querySelectorAll('input[type="checkbox"]:checked')
      ].map(input =>
        (input.closest("label")?.textContent || "").trim().toLowerCase()
      );

      const missing = detected.filter(rule =>
        !selectedWarnings.includes(rule.name.toLowerCase())
      );

      if (!missing.length) return;

      const message =
        "The content scanner detected possible mature themes:\n\n" +
        missing.map(rule => "• " + rule.name).join("\n") +
        "\n\nPlease review your Chapter Content Warnings. " +
        "Press OK to continue or Cancel to review them first.";

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("click", publishingReminder, true);

  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
