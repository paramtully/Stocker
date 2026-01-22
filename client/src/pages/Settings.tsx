import { useQuery, useMutation } from "@tanstack/react-query";
import { AddStockForm } from "@/components/AddStockForm";
import { EmailSettingsForm } from "@/components/EmailSettingsForm";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface EmailSettings {
  email: string;
  enabled: boolean;
  deliveryHour: number;
}

export default function Settings() {
  const { data: emailSettings, isLoading: emailLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/settings/email"],
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (settings: { enabled: boolean; deliveryHour: number }) => {
      return apiRequest("PUT", "/api/settings/email", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email"] });
    },
  });

  const handleSaveEmailSettings = (settings: { enabled: boolean; deliveryHour: number }) => {
    updateEmailMutation.mutate(settings);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your portfolio and email notification preferences
        </p>
      </div>

      <AddStockForm />

      {emailLoading ? (
        <Skeleton className="h-64" />
      ) : emailSettings ? (
        <EmailSettingsForm
          email={emailSettings.email}
          enabled={emailSettings.enabled}
          deliveryHour={emailSettings.deliveryHour}
          onSave={handleSaveEmailSettings}
        />
      ) : null}
    </div>
  );
}
