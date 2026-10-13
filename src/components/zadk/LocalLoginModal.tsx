import { useEffect, useState } from "react";
import { Mail, UserRound, X } from "lucide-react";

type Language = "ar" | "en" | "tr";

type Props = {
  open: boolean;
  language: Language;
  dark: boolean;
  onClose: () => void;
  onSubmit: (credentials: { name: string; email: string }) => Promise<void>;
};

const copy = {
  ar: {
    title: "تسجيل الدخول",
    subtitle: "احفظ بياناتك وتابع وجباتك من أي جهاز.",
    name: "الاسم",
    namePlaceholder: "اكتب اسمك",
    email: "البريد الإلكتروني",
    emailPlaceholder: "name@example.com",
    continue: "متابعة",
    cancel: "إلغاء",
    required: "أدخل الاسم والبريد الإلكتروني بشكل صحيح.",
    privacy: "تُحفظ هذه البيانات في هذا المتصفح وتُستخدم لإنشاء جلسة الحساب.",
  },
  en: {
    title: "Sign in",
    subtitle: "Save your details and keep your meals in sync.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "name@example.com",
    continue: "Continue",
    cancel: "Cancel",
    required: "Enter a valid name and email address.",
    privacy: "These details are saved in this browser and used to create your account session.",
  },
  tr: {
    title: "Giriş yap",
    subtitle: "Bilgilerinizi kaydedin ve öğünlerinizi senkronize edin.",
    name: "Ad",
    namePlaceholder: "Adınız",
    email: "E-posta adresi",
    emailPlaceholder: "name@example.com",
    continue: "Devam et",
    cancel: "İptal",
    required: "Geçerli bir ad ve e-posta adresi girin.",
    privacy: "Bu bilgiler bu tarayıcıda saklanır ve hesap oturumunuzu oluşturmak için kullanılır.",
  },
} as const;

export function LocalLoginModal({ open, language, dark, onClose, onSubmit }: Props) {
  const t = copy[language];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const isRtl = language === "ar";

  useEffect(() => {
    if (!open) return;
    try {
      const saved = JSON.parse(localStorage.getItem("zadak-user-info-v1") ?? "null") as { name?: string; email?: string } | null;
      setName(saved?.name ?? "");
      setEmail(saved?.email ?? "");
    } catch {
      setName("");
      setEmail("");
    }
    setError("");
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError(t.required);
      return;
    }
    await onSubmit({ name: cleanName, email: cleanEmail });
  }

  return (
    <div className="zadak-modal-backdrop fixed inset-0 z-[70] grid place-items-center bg-[#10271f]/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="local-login-title" dir={isRtl ? "rtl" : "ltr"} className={`zadak-modal-panel relative w-full max-w-md rounded-[28px] p-6 shadow-2xl ${dark ? "bg-[#20312b] text-[#e8f5ec]" : "bg-white text-[#23342b]"}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={t.cancel} className={`absolute ${isRtl ? "left-4" : "right-4"} top-4 grid h-8 w-8 place-items-center rounded-full ${dark ? "bg-white/10" : "bg-black/5"}`}><X size={15} /></button>
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf6eb] text-[#16866f]"><UserRound size={22} /></div>
        <h2 id="local-login-title" className="text-2xl font-black">{t.title}</h2>
        <p className={`mt-2 text-sm leading-6 ${dark ? "text-[#b3c7ba]" : "text-[#738078]"}`}>{t.subtitle}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-bold">{t.name}<span className="relative mt-2 block"><UserRound size={15} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8aa294] ${isRtl ? "right-3" : "left-3"}`} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} autoComplete="name" autoFocus className={`h-12 w-full rounded-xl border px-10 text-sm outline-none focus:ring-2 focus:ring-[#70b99a] ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`} /></span></label>
          <label className="block text-xs font-bold">{t.email}<span className="relative mt-2 block"><Mail size={15} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8aa294] ${isRtl ? "right-3" : "left-3"}`} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} autoComplete="email" className={`h-12 w-full rounded-xl border px-10 text-sm outline-none focus:ring-2 focus:ring-[#70b99a] ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`} /></span></label>
          {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
          <p className={`text-[10px] leading-5 ${dark ? "text-[#9db4a8]" : "text-[#829087]"}`}>{t.privacy}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={`rounded-full px-4 py-3 text-xs font-bold ${dark ? "text-[#c2d4c7] hover:bg-white/5" : "text-[#718078] hover:bg-[#f4f7f2]"}`}>{t.cancel}</button>
            <button type="submit" className="rounded-full bg-[#087b69] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(8,123,105,.16)]">{t.continue}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
