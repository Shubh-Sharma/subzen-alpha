import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";
import MetricsCards from "@/components/metrics-cards";
import SpendingCharts from "@/components/spending-charts";
import SubscriptionCard from "@/components/subscription-card";
import SubscriptionForm from "@/components/subscription-form";
import type { Subscription } from "@shared/schema";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const categories = ["All", "Entertainment", "News", "Food", "Health", "Software", "Other"];
  const filteredSubscriptions = selectedCategory && selectedCategory !== "All"
    ? subscriptions.filter(sub => sub.category === selectedCategory)
    : subscriptions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            SubScout
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <MetricsCards subscriptions={subscriptions} />
          
          <SpendingCharts subscriptions={subscriptions} />

          <div className="flex items-center justify-between">
            <Tabs 
              defaultValue="All" 
              value={selectedCategory || "All"}
              onValueChange={setSelectedCategory}
            >
              <TabsList>
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <SubscriptionForm />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}
