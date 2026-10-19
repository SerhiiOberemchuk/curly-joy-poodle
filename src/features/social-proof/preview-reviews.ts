import "server-only";
import type { Product } from "@/features/catalog/types";
import {
  modelKeyOf,
  type PublishedReview,
} from "@/features/reviews/crm-reviews";

// DEVELOPMENT ONLY: sample reviews to see the home review block locally while
// the CRM has none published. `home-reviews.tsx` loads this file only under
// `next dev`; a production build never contains or shows it. Edit freely.
const samples = [
  { authorName: "Олена", rating: 5, verifiedPurchase: true, submittedAt: "2026-10-16T09:00:00Z", title: "Найкраща покупка", body: "Користуємося щодня вже місяць, і все як нове. Пудель Бублик у захваті, а я — від того, як легко з цим впоратися навіть після прогулянки під дощем і по калюжах у парку. Окреме дякую за турботливе пакування й записку." },
  { authorName: "Ірина", rating: 5, verifiedPurchase: true, submittedAt: "2026-10-14T12:30:00Z", title: null, body: "Дуже якісно, приємно тримати в руках. Все відповідає опису." },
  { authorName: "Марко", rating: 4, verifiedPurchase: false, submittedAt: "2026-10-12T18:10:00Z", title: "Гарно, але є нюанс", body: "Виглядає чудово, але для нашої такси трохи завелике. Раджу уважно звіряти розміри." },
  { authorName: "Світлана", rating: 5, verifiedPurchase: true, submittedAt: "2026-10-09T08:45:00Z", title: null, body: "Замовляла вдруге — все так само чудово. Дякую за швидку відповідь у Direct!" },
  { authorName: "Андрій", rating: 5, verifiedPurchase: false, submittedAt: "2026-10-06T15:20:00Z", title: null, body: "Швидка доставка, все відповідає опису." },
  { authorName: "Юлія", rating: 4, verifiedPurchase: true, submittedAt: "2026-10-03T10:00:00Z", title: "Зручно в поїздках", body: "Брали з собою в подорож до Карпат — дуже стало в пригоді. Мінус одна зірка за ціну доставки." },
  { authorName: "Тарас", rating: 5, verifiedPurchase: true, submittedAt: "2026-09-27T17:05:00Z", title: null, body: "Собака задоволений, я теж. Візьмемо ще." },
  { authorName: "Наталія", rating: 3, verifiedPurchase: false, submittedAt: "2026-09-18T11:40:00Z", title: null, body: "Якість добра, але колір трохи відрізняється від фото." },
];

/** The samples spread over the first catalog products, so the cards link to real pages. */
export function previewReviews(products: readonly Product[]): PublishedReview[] {
  const shown = products.slice(0, 4);
  return samples.map((sample, index) => {
    const product = shown.length ? shown[index % shown.length] : null;
    return {
      ...sample,
      id: `preview-${index}`,
      reply: null,
      status: "published",
      modelKey: product ? modelKeyOf(product.id) : "preview",
      product: { id: product?.id ?? "preview", name: product?.title ?? "Товар" },
    };
  });
}
