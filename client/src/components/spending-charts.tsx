import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import type { Subscription } from "@shared/schema";

const COLORS = [
  "hsl(0, 0%, 85%)",
  "hsl(0, 0%, 75%)",
  "hsl(0, 0%, 65%)",
  "hsl(0, 0%, 55%)",
  "hsl(0, 0%, 45%)",
  "hsl(0, 0%, 35%)",
];

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyData {
  name: string;
  amount: number;
}

function calculateCategorySpending(subscriptions: Subscription[]): CategoryData[] {
  const categories = new Map<string, number>();

  subscriptions.forEach(sub => {
    if (sub.isPaused) return;

    const price = parseFloat(sub.price.toString());
    const monthlyPrice = (() => {
      switch (sub.frequency) {
        case "Weekly": return price * 4;
        case "Monthly": return price;
        case "Quarterly": return price / 3;
        case "Yearly": return price / 12;
        default: return 0;
      }
    })();

    const current = categories.get(sub.category) || 0;
    categories.set(sub.category, current + monthlyPrice);
  });

  return Array.from(categories.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function calculateMonthlyTrend(subscriptions: Subscription[]): MonthlyData[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    name: month,
    amount: calculateMonthlySpending(subscriptions),
  }));
}

function calculateMonthlySpending(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    if (sub.isPaused) return total;
    const price = parseFloat(sub.price.toString());
    switch (sub.frequency) {
      case "Weekly": return total + (price * 4);
      case "Monthly": return total + price;
      case "Quarterly": return total + (price / 3);
      case "Yearly": return total + (price / 12);
      default: return total;
    }
  }, 0);
}

export default function SpendingCharts({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const categoryData = calculateCategorySpending(subscriptions);
  const monthlyData = calculateMonthlyTrend(subscriptions);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Spending Analysis</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            <div className="flex-[0_0_100%] min-w-0">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      fill="#8884d8"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, "Monthly Spend"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex-[0_0_100%] min-w-0">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis 
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={window.innerWidth < 640 ? 1 : 0}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value}`}
                      tick={{ fontSize: 12 }}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, "Amount"]}
                    />
                    <Bar dataKey="amount" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}