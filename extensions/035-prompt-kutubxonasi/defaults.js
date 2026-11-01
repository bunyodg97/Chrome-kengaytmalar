var DEFAULT_PROMPTS = [
  { id: 1, cat: 'Yozish', title: 'Rasmiy xat', text: "{{kimga}} uchun {{mavzu}} haqida rasmiy xat yoz. Uslub: hurmatli, qisqa, aniq. Xat oxirida imzo uchun joy qoldir." },
  { id: 2, cat: 'Yozish', title: 'Matnni tahrirlash', text: "Quyidagi matndagi imlo, punktuatsiya va uslub xatolarini tuzat. Ma'nosini o'zgartirma. Avval tuzatilgan matnni ber, keyin asosiy o'zgarishlarni ro'yxat qil.\n\n{{matn}}" },
  { id: 3, cat: 'Yozish', title: "Telegram post", text: "{{mavzu}} haqida Telegram kanal uchun qiziqarli post yoz: jalb qiluvchi birinchi qator, 3–5 qisqa paragraf, oxirida savol yoki chaqiriq. Emojilar me'yorida." },
  { id: 4, cat: 'Tarjima', title: "O'zbekchaga tarjima", text: "Quyidagi matnni tabiiy o'zbek tiliga (lotin yozuvida) tarjima qil. So'zma-so'z emas, ma'no bo'yicha:\n\n{{matn}}" },
  { id: 5, cat: 'Dasturlash', title: 'Kodni tushuntirish', text: "Quyidagi kodni o'zbek tilida qadam-baqadam tushuntir: nima qiladi, qanday ishlaydi, qayerda xato chiqishi mumkin.\n\n```\n{{kod}}\n```" },
  { id: 6, cat: 'Dasturlash', title: 'Xatoni topish', text: "Bu kod {{muammo}}. Sababini top va tuzatilgan versiyasini ber. Faqat zarur o'zgarishlarni qil.\n\n```\n{{kod}}\n```" },
  { id: 7, cat: 'Dasturlash', title: 'Kod review', text: "Quyidagi kodni senior dasturchi sifatida ko'rib chiq: xatolar, xavfsizlik, tezlik, o'qilishi. Har bir muammo uchun qator va tavsiya ber.\n\n```\n{{kod}}\n```" },
  { id: 8, cat: 'Dasturlash', title: 'Test yozish', text: "Quyidagi funksiya uchun {{framework}} da to'liq unit testlar yoz: oddiy holatlar, chegaraviy holatlar va xatolar.\n\n```\n{{kod}}\n```" },
  { id: 9, cat: "O'qish", title: 'Qisqacha mazmun', text: "Quyidagi matnning qisqacha mazmunini yoz: 5 ta asosiy fikr va bir gaplik xulosa.\n\n{{matn}}" },
  { id: 10, cat: "O'qish", title: 'Oddiy tilda tushuntir', text: "{{mavzu}} ni 12 yoshli bolaga tushuntirgandek oddiy tilda, misollar bilan tushuntir." },
  { id: 11, cat: 'Biznes', title: 'Mahsulot tavsifi', text: "{{mahsulot}} uchun Uzum/OLX'ga mos sotuvchi tavsif yoz: sarlavha (60 belgigacha), 5 ta afzallik, texnik xususiyatlar, kafolat haqida bir gap." },
  { id: 12, cat: 'Biznes', title: 'Mijozga javob', text: "Mijoz shunday yozdi: «{{xabar}}». Unga xushmuomala, qisqa va muammoni hal qiladigan javob yoz." }
];
