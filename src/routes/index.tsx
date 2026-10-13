import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import zadakOgAsset from "@/assets/zadak-og.png.asset.json";

const SITE_ORIGIN = "https://zadiq-arabian-meals.lovable.app";
const ogImage = `${SITE_ORIGIN}${zadakOgAsset.url}`;



const ZadkApp = lazy(() => import("@/components/zadk/ZadkApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "زادك AI — مساعد التغذية الذكي" },
      { name: "description", content: "صوّر وجبتك أو صفها، واحصل على تقدير غذائي واضح للسعرات والماكروز مع خطة تناسب هدفك." },
      { property: "og:title", content: "زادك AI — مساعد التغذية الذكي" },
      { property: "og:description", content: "تحليل الوجبات العربية بالذكاء الاصطناعي، تتبع السعرات والماء، وخطط تناسب هدفك." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "شعار زادك AI — مساعدك الشخصي للتغذية" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },

    ],
  }),
  component: Index,
});

function Splash() {
  return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">زادك AI</div>;
}

function Index() {
  return (
    <ClientOnly fallback={<Splash />}>
      <Suspense fallback={<Splash />}>
        <ZadkApp />
      </Suspense>
    </ClientOnly>
  );
}
