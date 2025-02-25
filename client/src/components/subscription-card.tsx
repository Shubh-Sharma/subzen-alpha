import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { SiNetflix, SiSpotify, SiYoutube, SiAmazon, SiApple } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";
import SubscriptionForm from "./subscription-form";

const logoMap: Record<string, React.ElementType> = {
  "Netflix": SiNetflix,
  "Spotify": SiSpotify,
  "YouTube Premium": SiYoutube,
  "Amazon Prime": SiAmazon,
  "Apple One": SiApple,
};

export default function SubscriptionCard({
  subscription,
}: {
  subscription: Subscription;
}) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/subscriptions/${subscription.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription deleted",
        description: "The subscription has been removed from your account.",
      });
    },
  });

  const togglePauseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/subscriptions/${subscription.id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: subscription.isPaused ? "Subscription resumed" : "Subscription paused",
        description: subscription.isPaused 
          ? "You will continue to receive notifications for this subscription."
          : "You will not receive notifications for this subscription while it is paused.",
      });
    },
  });

  const Logo = logoMap[subscription.name] || Edit2;

  return (
    <Card className={subscription.isPaused ? "opacity-50" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Logo className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{subscription.name}</h3>
              <p className="text-sm text-muted-foreground">
                ₹{subscription.price} / {subscription.frequency.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={subscription.isPaused ? "secondary" : "default"}>
              {subscription.category}
            </Badge>
            <p className="text-sm">
              Next payment: {format(new Date(subscription.nextPayment), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <SubscriptionForm
                  subscription={subscription}
                  onSuccess={() => setIsEditing(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePauseMutation.mutate()}
              disabled={togglePauseMutation.isPending}
            >
              {subscription.isPaused ? (
                <PlayCircle className="h-4 w-4" />
              ) : (
                <PauseCircle className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}