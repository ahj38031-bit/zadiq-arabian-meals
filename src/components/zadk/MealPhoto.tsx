import { useQuery } from "@tanstack/react-query";
import { getMealPhotoUrl } from "@/lib/meal-photos.functions";

export function MealPhoto({ imageKey, className }: { imageKey: string | null | undefined; className?: string }) {
  const { data } = useQuery({
    queryKey: ["zadk", "photo", imageKey],
    queryFn: () => getMealPhotoUrl({ data: { key: imageKey! } }),
    enabled: Boolean(imageKey),
    staleTime: 1000 * 60 * 60 * 5,
    retry: false,
  });
  if (!imageKey || !data?.url) return null;
  return <img src={data.url} alt="" loading="lazy" className={className} />;
}
