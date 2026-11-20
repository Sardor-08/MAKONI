import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal-document'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati | MAKONI',
  description: 'MAKONI platformasida shaxsiy ma’lumotlar qanday yig‘ilishi, ishlatilishi va himoya qilinishi haqida.',
  alternates: { canonical: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Maxfiylik siyosati"
      description="Ushbu siyosat MAKONI’dan foydalanganingizda qanday ma’lumotlar qayta ishlanishi va ularni boshqarish usullarini tushuntiradi."
      updatedAt="20-noyabr 2026"
    >
      <LegalSection title="1. Qamrov va mas’uliyat">
        <p>MAKONI — O‘zbekistonda ko‘chmas mulk e’lonlarini ko‘rish va joylashtirish uchun platforma. Ushbu siyosat MAKONI sayti, akkaunt va e’lon joylash funksiyalaridan foydalanishga taalluqli.</p>
        <p>Maxfiylik bo‘yicha savollar yoki ma’lumotlaringizga oid so‘rovlar uchun <a href="mailto:nozimturdiyev78@gmail.com">nozimturdiyev78@gmail.com</a> manziliga yozishingiz mumkin.</p>
      </LegalSection>

      <LegalSection title="2. Qanday ma’lumotlarni olamiz">
        <ul>
          <li><strong>Akkaunt ma’lumotlari:</strong> ism, email manzili, profil rasmi va akkaunt yaratilgan yoki yangilangan vaqt.</li>
          <li><strong>Kirish va xavfsizlik ma’lumotlari:</strong> sessiya ma’lumotlari, IP manzil va brauzer qurilmasi haqidagi user-agent ma’lumoti.</li>
          <li><strong>E’lon ma’lumotlari:</strong> mulk turi, sotuv yoki ijara turi, narx, xonalar va maydon, hudud, tuman, e’lon sarlavhasi hamda yuklangan rasmlar.</li>
          <li><strong>To‘lovga oid yuborilgan ma’lumotlar:</strong> to‘lov arizasi bilan birga kiritilgan to‘lovchi ismi, telefon raqami, ixtiyoriy to‘lov izohi va kvitansiya rasmi.</li>
          <li><strong>Texnik foydalanish ma’lumotlari:</strong> sayt barqarorligi va ishlashini tushunishga yordam beradigan tahliliy ma’lumotlar.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Ma’lumotlardan foydalanish">
        <p>Ma’lumotlar akkaunt yaratish va unga kirish, e’lonlarni joylashtirish va boshqarish, to‘lov arizalarini ko‘rib chiqish, foydalanuvchi murojaatlariga javob berish, xavfsizlikni ta’minlash hamda xizmatni ishlatish va yaxshilash maqsadlarida qo‘llanadi.</p>
        <p>Google orqali kirishni tanlaganingizda, Google akkauntingizni tasdiqlash uchun zarur ma’lumotlarni Google’dan olamiz. Google ma’lumotlaridan Google’ning o‘z qoidalari ham foydalanishni boshqaradi.</p>
      </LegalSection>

      <LegalSection title="4. Ommaga ko‘rinadigan ma’lumotlar">
        <p>Joylashtirilgan va e’lon qilishga tasdiqlangan mulk e’lonlari, jumladan e’lon matni, narxi, hududi va rasmlari, saytga kirgan boshqa odamlarga ko‘rinishi mumkin. E’lon matni yoki rasmlarga oshkor qilinishini istamagan shaxsiy ma’lumotlaringizni kiritmang.</p>
      </LegalSection>

      <LegalSection title="5. Cookies va xizmat ko‘rsatuvchilar">
        <p>Akkauntga xavfsiz kirish va sessiyani saqlash uchun zarur cookies ishlatiladi. Sayt hostingi va tahlili, ma’lumotlar bazasi, fayllarni saqlash, email yuborish hamda Google orqali kirish kabi funksiyalar tegishli xizmat ko‘rsatuvchilar yordamida ishlashi mumkin. Ular ma’lumotlarni faqat xizmatni taqdim etish uchun zarur doirada qayta ishlaydi.</p>
        <p>Saytdan foydalanish ma’lumotlari Vercel Analytics orqali o‘lchanishi mumkin. Akkaunt ma’lumotlari Neon ma’lumotlar bazasida, yuklangan fayllar esa Vercel Blob’da saqlanishi mumkin. Email xabarlari Resend orqali yuborilishi mumkin.</p>
      </LegalSection>

      <LegalSection title="6. Saqlash, xavfsizlik va o‘chirish">
        <p>Ma’lumotlar akkauntingiz va xizmatni taqdim etish uchun kerak bo‘lgan muddat davomida, shuningdek xavfsizlik, nizolarni hal qilish yoki qonuniy majburiyatlarni bajarish zarur bo‘lgan hollarda saqlanishi mumkin. Internet orqali uzatish yoki saqlashning hech bir usuli mutlaq xavfsizlikni kafolatlamaydi; ma’lumotlarni himoya qilish uchun tegishli texnik va tashkiliy choralar ko‘riladi.</p>
        <p>Ma’lumotlaringizni ko‘rib chiqish, tuzatish yoki o‘chirish bo‘yicha so‘rov yuborish uchun <a href="mailto:nozimturdiyev78@gmail.com">nozimturdiyev78@gmail.com</a> ga murojaat qiling. Ayrim yozuvlarni qonuniy yoki xavfsizlik sabablariga ko‘ra saqlash talab qilinishi mumkin.</p>
      </LegalSection>

      <LegalSection title="7. Siyosatdagi o‘zgarishlar">
        <p>Ushbu siyosat xizmat yoki qonunchilik talablari o‘zgarganda yangilanishi mumkin. Yangilangan matn shu sahifada e’lon qilinadi va yuqorida oxirgi yangilangan sana ko‘rsatiladi.</p>
      </LegalSection>
    </LegalDocument>
  )
}
