import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Subscription } from "@shared/schema";

const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(316, 70%, 50%)",
  "hsl(12, 76%, 61%)",
  "hsl(45, 100%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(201, 96%, 32%)",
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
  const categoryData = calculateCategorySpending(subscriptions);
  const monthlyData = calculateMonthlyTrend(subscriptions);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, "Amount"]}
                />
                <Bar dataKey="amount" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
