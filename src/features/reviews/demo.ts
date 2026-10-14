/** Temporary, explicitly labelled design examples. Never use in structured data. */
export interface Review {
  id: string;
  author: string;
  companion: string;
  rating: number;
  text: string;
}

export const demoReviews: readonly Review[] = [
  {
    id: "demo-1",
    author: "Марія",
    companion: "та Боня",
    rating: 5,
    text: "Люблю, коли речі для собаки обирають із такою турботою. Усе приємне на дотик, а Боня вже готова до нових пригод разом.",
  },
  {
    id: "demo-2",
    author: "Олена",
    companion: "та Тедді",
    rating: 5,
    text: "Знайшли саме те, що шукали для наших прогулянок. Особливо сподобалося, що можна уважно роздивитися товар і спокійно обрати.",
  },
  {
    id: "demo-3",
    author: "Андрій",
    companion: "та Міллі",
    rating: 4,
    text: "Приємна маленька знахідка для нашого щоденного життя. Міллі задоволена, а я вже придивляюся до наступної покупки.",
  },
  {
    id: "demo-4",
    author: "Ірина",
    companion: "та Чарлі",
    rating: 5,
    text: "Красиві речі, які хочеться використовувати щодня. Люблю магазини, де відчувається увага і до собак, і до їхніх людей.",
  },
];

export function reviewSummary(reviews: readonly Pick<Review, "rating">[]) {
  const count = reviews.length;
  return {
    count,
    average: count
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
      : 0,
  };
}
