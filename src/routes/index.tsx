import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ZadkApp = lazy(() => import("@/components/zadk/ZadkApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "زادك AI — مساعد التغذية الذكي" },
      { name: "description", content: "صوّر وجبتك أو صفها، واحصل على تقدير غذائي واضح للسعرات والماكروز مع خطة تناسب هدفك." },
      { property: "og:title", content: "زادك AI — مساعد التغذية الذكي" },
      { property: "og:description", content: "تحليل الوجبات العربية بالذكاء الاصطناعي، تتبع السعرات والماء، وخطط تناسب هدفك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
