import { useEffect, useState } from "react";
import { KeyRound, Mail, UserRound, X } from "lucide-react";
import { loginLocal, registerLocal } from "@/hooks/useAuth";

type Language = "ar" | "en" | "tr";
type Mode = "register" | "login";

type Props = {
  open: boolean;
  language: Language;
  dark: boolean;
  onClose: () => void;
  onSubmit: (credentials: { name: string; email: string }) => Promise<void>;
};

const copy = {
  ar: {
    register: "إنشاء حساب", login: "تسجيل الدخول",
    subtitle: "احفظ بياناتك وتابع وجباتك على هذا الجهاز.",
    name: "الاسم", namePlaceholder: "اكتب اسمك", email: "البريد الإلكتروني", password: "كلمة المرور", passwordPlaceholder: "6 أحرف على الأقل",
    submitRegister: "إنشاء الحساب", submitLogin: "دخول", cancel: "إلغاء",
    invalid: "أدخل بيانات صحيحة (الاسم حرفان على الأقل، وكلمة المرور 6 أحرف).",
    exists: "هذا البريد مسجّل مسبقاً، سجّل الدخول بدلاً من ذلك.",
    not_found: "لا يوجد حساب بهذا البريد، أنشئ حساباً أولاً.",
    wrong_password: "كلمة المرور غير صحيحة.",
    privacy: "تُحفظ بيانات الحساب في هذا المتصفح فقط.",
  },
  en: {
    register: "Sign up", login: "Log in",
    subtitle: "Save your details and keep your meals on this device.",
    name: "Name", namePlaceholder: "Your name", email: "Email address", password: "Password", passwordPlaceholder: "At least 6 characters",
    submitRegister: "Create account", submitLogin: "Log in", cancel: "Cancel",
    invalid: "Enter valid details (name 2+ chars, password 6+ chars).",
    exists: "This email is already registered — log in instead.",
    not_found: "No account with this email — sign up first.",
    wrong_password: "Incorrect password.",
    privacy: "Account details are stored in this browser only.",
  },
  tr: {
    register: "Kayıt ol", login: "Giriş yap",
    subtitle: "Bilgilerinizi kaydedin ve öğünlerinizi bu cihazda tutun.",
    name: "Ad", namePlaceholder: "Adınız", email: "E-posta adresi", password: "Şifre", passwordPlaceholder: "En az 6 karakter",
    submitRegister: "Hesap oluştur", submitLogin: "Giriş yap", cancel: "İptal",
    invalid: "Geçerli bilgiler girin (ad 2+, şifre 6+ karakter).",
    exists: "Bu e-posta zaten kayıtlı — giriş yapın.",
    not_found: "Bu e-postayla hesap yok — önce kayıt olun.",
    wrong_password: "Şifre yanlış.",
    privacy: "Hesap bilgileri yalnızca bu tarayıcıda saklanır.",
  },
} as const;

export function LocalLoginModal({ open, language, dark, onClose, onSubmit }: Props) {
  const t = copy[language];
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRtl = language === "ar";

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError("");
  }, [open, mode]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if ((mode === "register" && cleanName.length < 2) || !/^\S+@\S+\.\S+$/.test(cleanEmail) || password.length < 6) {
      setError(t.invalid);
      return;
    }
    setBusy(true);
    try {
      const result = mode === "register" ? await registerLocal(cleanName, cleanEmail, password) : await loginLocal(cleanEmail, password);
      if (!result.ok) { setError(t[result.error]); return; }
      await onSubmit(result.user);
    } finally {
      setBusy(false);
    }
  }

  const inputCls = `h-12 w-full rounded-xl border px-10 text-sm outline-none focus:ring-2 focus:ring-[#70b99a] ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`;
  const iconCls = `pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8aa294] ${isRtl ? "right-3" : "left-3"}`;

  return (
    <div className="zadak-modal-backdrop fixed inset-0 z-[70] grid place-items-center bg-[#10271f]/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="local-login-title" dir={isRtl ? "rtl" : "ltr"} className={`zadak-modal-panel relative w-full max-w-md rounded-[28px] p-6 shadow-2xl ${dark ? "bg-[#20312b] text-[#e8f5ec]" : "bg-white text-[#23342b]"}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={t.cancel} className={`absolute ${isRtl ? "left-4" : "right-4"} top-4 grid h-8 w-8 place-items-center rounded-full ${dark ? "bg-white/10" : "bg-black/5"}`}><X size={15} /></button>
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf6eb] text-[#16866f]"><UserRound size={22} /></div>
        <h2 id="local-login-title" className="text-2xl font-black">{mode === "register" ? t.register : t.login}</h2>
        <p className={`mt-2 text-sm leading-6 ${dark ? "text-[#b3c7ba]" : "text-[#738078]"}`}>{t.subtitle}</p>
        <div role="tablist" className={`mt-5 grid grid-cols-2 gap-1 rounded-full p-1 ${dark ? "bg-white/5" : "bg-[#f1f6f1]"}`}>
          {(["register", "login"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full py-2.5 text-xs font-bold transition-colors ${mode === m ? "bg-[#087b69] text-white shadow" : dark ? "text-[#c2d4c7]" : "text-[#5f6f66]"}`}>{t[m]}</button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "register" && <label className="block text-xs font-bold">{t.name}<span className="relative mt-2 block"><UserRound size={15} className={iconCls} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoComplete="name" className={inputCls} /></span></label>}
          <label className="block text-xs font-bold">{t.email}<span className="relative mt-2 block"><Mail size={15} className={iconCls} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" className={inputCls} /></span></label>
          <label className="block text-xs font-bold">{t.password}<span className="relative mt-2 block"><KeyRound size={15} className={iconCls} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} autoComplete={mode === "register" ? "new-password" : "current-password"} className={inputCls} /></span></label>
          {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
          <p className={`text-[10px] leading-5 ${dark ? "text-[#9db4a8]" : "text-[#829087]"}`}>{t.privacy}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={`rounded-full px-4 py-3 text-xs font-bold ${dark ? "text-[#c2d4c7] hover:bg-white/5" : "text-[#718078] hover:bg-[#f4f7f2]"}`}>{t.cancel}</button>
            <button type="submit" disabled={busy} className="rounded-full bg-[#087b69] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(8,123,105,.16)] disabled:opacity-60">{mode === "register" ? t.submitRegister : t.submitLogin}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
