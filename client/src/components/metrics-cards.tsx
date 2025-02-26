import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CreditCard, BarChart3, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import type { Subscription } from "@shared/schema";

function calculateMonthlySpending(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    const price = parseFloat(sub.price.toString());
    if (sub.isPaused) return total;

    switch (sub.frequency) {
      case "Weekly":
        return total + (price * 4);
      case "Monthly":
        return total + price;
      case "Quarterly":
        return total + (price / 3);
      case "Yearly":
        return total + (price / 12);
      default:
        return total;
    }
  }, 0);
}

function calculateYearlySpending(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    const price = parseFloat(sub.price.toString());
    if (sub.isPaused) return total;

    switch (sub.frequency) {
      case "Weekly":
        return total + (price * 52);
      case "Monthly":
        return total + (price * 12);
      case "Quarterly":
        return total + (price * 4);
      case "Yearly":
        return total + price;
      default:
        return total;
    }
  }, 0);
}

export default function MetricsCards({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const monthlySpending = calculateMonthlySpending(subscriptions);
  const yearlySpending = calculateYearlySpending(subscriptions);
  const activeSubscriptions = subscriptions.filter(sub => !sub.isPaused);
  const upcomingPayments = subscriptions.filter(sub => {
    const paymentDate = new Date(sub.nextPayment);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return !sub.isPaused && paymentDate <= sevenDaysFromNow;
  });

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlySpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Active subscriptions
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yearly Spending</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{yearlySpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Projected annual cost
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
          <p className="text-xs text-muted-foreground">
            Total subscriptions tracked
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingPayments.length}</div>
          <p className="text-xs text-muted-foreground">
            Due in the next 7 days
          </p>
        </CardContent>
      </Card>
    </>
  );
}