
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

export const InAppPreferences = () => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label className="text-sm font-medium text-[#000000] dark:text-[#FFFFFF]">
          {t('settings.inapp.notifications')}
        </label>
        <p className="text-sm text-[#000000A6] dark:text-[#FFFFFFA6]">
          {t('settings.inapp.notifications.description')}
        </p>
      </div>
      <Switch
        checked={true}
        disabled={true}
        className="data-[state=checked]:bg-[#c3caf5] data-[state=unchecked]:bg-gray-200 cursor-not-allowed"
      />
    </div>
  );
};
