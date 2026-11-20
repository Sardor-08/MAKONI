import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal-document'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari | MAKONI',
  description: 'MAKONI ko‘chmas mulk platformasidan foydalanish shartlari va foydalanuvchi majburiyatlari.',
  alternates: { canonical: '/terms-of-service' },
}

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Foydalanish shartlari"
      description="MAKONI’dan foydalanish orqali quyidagi shartlar bilan tanishganingizni va ularga rioya qilishingizni tasdiqlaysiz."
      updatedAt="20-noyabr 2026"
    >
      <LegalSection title="1. MAKONI xizmati">
        <p>MAKONI ko‘chmas mulkni sotish yoki ijaraga berish bo‘yicha e’lonlarni ko‘rish va joylashtirishga yordam beruvchi onlayn platformadir. MAKONI xaridor, sotuvchi, ijaraga beruvchi yoki ijarachining vakili emas va foydalanuvchilar o‘rtasidagi bitimning tomoni hisoblanmaydi.</p>
      </LegalSection>

      <LegalSection title="2. Akkaunt va foydalanuvchi javobgarligi">
        <p>Akkaunt ochishda to‘g‘ri ma’lumot bering, akkauntga kirish vositalarini himoya qiling va akkauntingiz orqali bajarilgan amallar uchun javobgar bo‘ling. Akkauntingizga ruxsatsiz kirish aniqlansa, imkon qadar tez MAKONI’ga xabar bering.</p>
      </LegalSection>

      <LegalSection title="3. E’lonlar va taqiqlangan foydalanish">
        <p>E’lon joylashtirgan foydalanuvchi undagi ma’lumotlar, narx, mulk tavsifi, rasm va aloqa ma’lumotlarining aniqligi hamda ulardan foydalanish huquqiga ega ekanligi uchun javob beradi. E’lonlar amaldagi qonunlarga mos bo‘lishi kerak.</p>
        <p>Soxta, chalg‘ituvchi, noqonuniy yoki boshqa shaxslarning huquqlarini buzuvchi materiallarni joylashtirish, platforma xavfsizligiga xalaqit berish yoki xizmatdan suiiste’mol qilish taqiqlanadi. MAKONI qoidalarni buzgan yoki tekshirishga muhtoj e’lonni cheklashi, tahrirlashni so‘rashi yoki olib tashlashi mumkin.</p>
      </LegalSection>

      <LegalSection title="4. Tariflar va to‘lov arizalari">
        <p>E’lonni joylashtirishda mavjud tarif va unga tegishli shartlar ekranda ko‘rsatiladi. To‘lov arizasini yuborish uchun foydalanuvchidan to‘lovchi ismi, telefon raqami va to‘lov kvitansiyasi talab qilinishi mumkin. Ariza MAKONI tomonidan ko‘rib chiqiladi; ariza yuborish e’lon darhol chop etilishini anglatmaydi.</p>
        <p>To‘lovdan oldin ko‘rsatilgan summa va tarif shartlarini tekshiring. To‘lov bo‘yicha savollarni <a href="mailto:nozimturdiyev78@gmail.com">nozimturdiyev78@gmail.com</a> manziliga yuboring.</p>
      </LegalSection>

      <LegalSection title="5. Bitimni mustaqil tekshirish">
        <p>MAKONI e’londagi mulk hujjatlari, mulk egasining vakolati, mulkning holati yoki bitim shartlarini mustaqil ravishda kafolatlamaydi. Pul o‘tkazish yoki bitim tuzishdan oldin mulkni, hujjatlarni, shaxsni va barcha muhim shartlarni mustaqil tekshiring.</p>
      </LegalSection>

      <LegalSection title="6. Kontentdan foydalanish va xizmatning mavjudligi">
        <p>O‘zingiz joylashtirgan kontentga bo‘lgan huquqlar sizda qoladi. E’lonni MAKONI’da chop etish orqali uni xizmatni uzluksiz ko‘rsatish maqsadida saqlash va e’lonni namoyish qilish uchun zarur darajada foydalanishga ruxsat berasiz. MAKONI’da ko‘rsatilgan brend, dizayn va dasturiy materiallar tegishli huquq egalariga tegishli.</p>
        <p>MAKONI xizmatni yangilashi, vaqtincha to‘xtatishi yoki ayrim funksiyalarni o‘zgartirishi mumkin. Xizmat doimo uzluksiz ishlashiga kafolat berilmaydi.</p>
      </LegalSection>

      <LegalSection title="7. Shartlarning yangilanishi va murojaatlar">
        <p>Shartlar yangilanishi mumkin; amaldagi matn shu sahifada e’lon qilinadi. Yangilanganidan keyin MAKONI’dan foydalanishda davom etish yangi shartlarga rozilik bildirilganini anglatadi.</p>
        <p>Shartlar yoki platforma bo‘yicha savollar uchun <a href="mailto:nozimturdiyev78@gmail.com">nozimturdiyev78@gmail.com</a> orqali bog‘laning.</p>
      </LegalSection>
    </LegalDocument>
  )
}
