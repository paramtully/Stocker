import { EmailSettingsForm } from "../EmailSettingsForm";
import { Toaster } from "@/components/ui/toaster";

export default function EmailSettingsFormExample() {
  return (
    <div className="p-4 max-w-md">
      <EmailSettingsForm
        email="user@example.com"
        enabled={true}
        deliveryHour={8}
        onSave={(settings) => console.log("Settings saved:", settings)}
      />
      <Toaster />
    </div>
  );
}
