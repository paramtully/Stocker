import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailSettingsFormProps {
  email: string;
  enabled: boolean;
  deliveryHour: number;
  onSave: (settings: { enabled: boolean; deliveryHour: number }) => void;
}

export function EmailSettingsForm({
  email,
  enabled: initialEnabled,
  deliveryHour: initialHour,
  onSave,
}: EmailSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [deliveryHour, setDeliveryHour] = useState(initialHour);
  const { toast } = useToast();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const handleSave = () => {
    onSave({ enabled, deliveryHour });
    toast({
      title: "Settings saved",
      description: enabled
        ? `Daily email will be sent at ${formatHour(deliveryHour)}`
        : "Daily email notifications disabled",
    });
  };

  return (
    <Card data-testid="card-email-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Settings
        </CardTitle>
        <CardDescription>
          Configure your daily stock news summary email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="email-enabled" className="text-base font-medium">
              Daily Email Summary
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive AI-generated stock news summaries
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            data-testid="switch-email-enabled"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Email Address</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <Mail className="h-4 w-4" />
            {email}
            <span className="ml-auto text-xs text-green-600 dark:text-green-400">Verified</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery-time" className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Delivery Time
          </Label>
          <Select
            value={deliveryHour.toString()}
            onValueChange={(value) => setDeliveryHour(parseInt(value))}
            disabled={!enabled}
          >
            <SelectTrigger id="delivery-time" data-testid="select-delivery-time">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {formatHour(hour)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="w-full" data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
