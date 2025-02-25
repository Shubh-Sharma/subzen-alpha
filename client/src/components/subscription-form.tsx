import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { insertSubscriptionSchema, type InsertSubscription, type Subscription } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SubscriptionFormData = Omit<InsertSubscription, 'notificationsEnabled' | 'isPaused'> & {
  notificationsEnabled: boolean;
  isPaused: boolean;
};

export default function SubscriptionForm({
  subscription,
  onSuccess,
}: {
  subscription?: Subscription;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(insertSubscriptionSchema),
    defaultValues: subscription ? {
      name: subscription.name,
      category: subscription.category as InsertSubscription['category'],
      price: subscription.price.toString(),
      frequency: subscription.frequency as InsertSubscription['frequency'],
      nextPayment: new Date(subscription.nextPayment).toISOString().split('T')[0],
      notificationsEnabled: subscription.notificationsEnabled ?? true,
      isPaused: subscription.isPaused ?? false,
    } : {
      name: "",
      category: "Entertainment",
      price: "",
      frequency: "Monthly",
      nextPayment: new Date().toISOString().split("T")[0],
      notificationsEnabled: true,
      isPaused: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const res = await apiRequest(
        subscription ? "PATCH" : "POST",
        subscription ? `/api/subscriptions/${subscription.id}` : "/api/subscriptions",
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: subscription ? "Subscription updated" : "Subscription added",
        description: subscription
          ? "Your subscription has been updated successfully."
          : "Your new subscription has been added successfully.",
      });
      onSuccess?.();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["Entertainment", "News", "Food", "Health", "Software", "Other"].map(
                    (category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Frequency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Weekly", "Monthly", "Quarterly", "Yearly"].map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nextPayment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Payment Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationsEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Enable Notifications</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {subscription ? "Update Subscription" : "Add Subscription"}
        </Button>
      </form>
    </Form>
  );
}