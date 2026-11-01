const GROUPS = {
  "O'zbek": "ʻ ʼ Oʻ oʻ Gʻ gʻ Ў ў Қ қ Ғ ғ Ҳ ҳ « » „ “ ” — – № …",
  "Belgilar": "© ® ™ ° § ¶ • · † ‡ ※ ¦ | ¬ ~ ^ ‰ ′ ″ @ & # ✓ ✔ ✗ ✘ ★ ☆ ♥ ♦ ♣ ♠ ☐ ☑ ☒ ☎ ✉ ⌘ ⌥ ⇧ ⏎ ⌫",
  "Matematik": "± × ÷ ≈ ≠ ≤ ≥ ∞ √ ∛ ∑ ∏ ∫ ∂ ∆ π µ Ω α β γ θ λ σ φ ° ½ ⅓ ⅔ ¼ ¾ ⅛ ¹ ² ³ ⁴ ⁿ ₀ ₁ ₂ ₃ ∈ ∉ ⊂ ∪ ∩ ∅ ∀ ∃ ∧ ∨",
  "Valyuta": "so'm $ € ₽ £ ¥ ₸ ₩ ₹ ₺ ₴ ¢ ₿",
  "Strelkalar": "← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ⇔ ↖ ↗ ↘ ↙ ➜ ➤ ▶ ◀ ▲ ▼ ↩ ↪ ⟵ ⟶ ⤴ ⤵",
  "Emojilar": "😀 😂 😊 😍 🥰 😎 🤔 😢 😭 😡 👍 👎 👏 🙏 💪 🤝 👋 ❤️ 🔥 ⭐ ✨ 🎉 🎂 🎁 ✅ ❌ ⚠️ ❓ ❗ 💯 📌 📎 📞 📱 💻 📷 🕒 📅 🚗 🏠 🌙 ☀️ 🌧 🇺🇿",
  "Ramkalar": "─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ╔ ╗ ╚ ╝ ■ □ ▪ ▫ ● ○ ◆ ◇ ░ ▒ ▓ █"
};
const NAMES = { 'ʻ': "o'zbek ochiq (oʻ, gʻ)", 'ʼ': "tutuq belgisi (ma'no)", '№': 'raqam nomer', '©': 'copyright mualliflik', '°': 'gradus daraja', '—': 'uzun tire', '–': "o'rta tire", '«': 'qo\'shtirnoq', '»': 'qo\'shtirnoq', '×': "ko'paytirish", '÷': "bo'lish", '≈': 'taxminan', '±': 'plyus minus', '½': 'yarim', '…': "ko'p nuqta", '✓': 'belgi ok', '€': 'yevro', '₽': 'rubl', '→': "o'ng strelka", '•': 'nuqta bullet' };
