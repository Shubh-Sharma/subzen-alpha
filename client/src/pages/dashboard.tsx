import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";
import MetricsCards from "@/components/metrics-cards";
import SpendingCharts from "@/components/spending-charts";
import SubscriptionCard from "@/components/subscription-card";
import SubscriptionForm from "@/components/subscription-form";
import type { Subscription } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const categories = ["All", "Entertainment", "News", "Food", "Health", "Software", "Other"];
  const filteredSubscriptions = selectedCategory && selectedCategory !== "All"
    ? subscriptions.filter(sub => sub.category === selectedCategory)
    : subscriptions;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">
              SubScout
            </h1>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user?.email}
              </span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <div className="overflow-x-auto -mx-4 px-4 pb-4 sm:overflow-x-visible sm:px-0 sm:pb-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[600px] sm:min-w-0">
              <MetricsCards subscriptions={subscriptions} />
            </div>
          </div>

          <SpendingCharts subscriptions={subscriptions} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs 
              defaultValue="All" 
              value={selectedCategory || "All"}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 sm:grid-cols-7">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Desktop Add Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button className="hidden sm:flex">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh]">
                <SubscriptionForm />
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground md:col-span-2 xl:col-span-3">
                No subscriptions found. Add your first subscription to get started!
              </div>
            ) : (
              filteredSubscriptions.map(subscription => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SubscriptionForm />
        </SheetContent>
      </Sheet>
    </div>
  );
}