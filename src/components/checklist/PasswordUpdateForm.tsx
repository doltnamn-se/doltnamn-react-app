import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Eye, EyeOff } from "lucide-react";

interface PasswordUpdateFormProps {
  onComplete: () => void;
  className?: string;
  buttonClassName?: string;
  buttonText?: string;
  showCurrentPassword?: boolean;
  showSuccessToast?: boolean;
  showSuccessAnimation?: boolean;
}

export const PasswordUpdateForm = ({ 
  onComplete, 
  className = "lg:w-[75%] xl:w-1/2",
  buttonClassName = "w-full",
  buttonText,
  showCurrentPassword = false,
  showSuccessToast = false,
  showSuccessAnimation = false
}: PasswordUpdateFormProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPasswordField, setShowCurrentPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const requirements = [
    {
      id: 1,
      label: language === 'en' ? "At least 12 characters" : "Minst 12 tecken",
      validate: (pass: string) => pass.length >= 12,
    },
    {
      id: 2,
      label: language === 'en' ? "A lowercase character" : "Ett gemener-tecken",
      validate: (pass: string) => /[a-z]/.test(pass),
    },
    {
      id: 3,
      label: language === 'en' ? "A capital letter" : "Ett versaltecken",
      validate: (pass: string) => /[A-Z]/.test(pass),
    },
    {
      id: 4,
      label: language === 'en' ? "A number or a symbol" : "Ett nummer eller en symbol",
      validate: (pass: string) => /[0-9!@#$%^&*(),.?":{}|<>]/.test(pass),
    },
    // Only show the "different from current password" requirement when showCurrentPassword is true
    ...(showCurrentPassword ? [{
      id: 5,
      label: language === 'en' ? "Different from current password" : "Annorlunda än nuvarande lösenord",
      validate: (pass: string) => {
        if (!currentPassword || !pass) return false;
        return pass !== currentPassword;
      },
    }] : []),
  ];

  const allRequirementsMet = requirements.every(req => req.validate(newPassword));

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setShowPassword(false);
    setShowCurrentPasswordField(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!allRequirementsMet) {
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('error.password.requirements'),
        });
        setIsLoading(false);
        return;
      }

      if (showCurrentPassword) {
        console.log("Verifying current password...");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: (await supabase.auth.getUser()).data.user?.email || '',
          password: currentPassword,
        });

        if (signInError) {
          console.error("Current password verification failed:", signInError);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('error.current.password'),
          });
          setIsLoading(false);
          return;
        }
        console.log("Current password verified successfully");
      }

      console.log("Attempting to update password...");
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword
      });

      if (error) {
        console.error("Password update error:", error);
        if (error.message.includes('same_password')) {
          toast({
            variant: "destructive",
            title: t('error'),
            description: language === 'en' ? 
              "New password must be different from current password" : 
              "Nytt lösenord måste vara annorlunda än nuvarande lösenord",
          });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      console.log("Password updated successfully, updating checklist progress...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session');

      const { error: updateError } = await supabase
        .from('customer_checklist_progress')
        .update({ password_updated: true })
        .eq('customer_id', session.user.id);

      if (updateError) {
        console.error("Error updating checklist progress:", updateError);
        throw updateError;
      }

      console.log("Checklist progress updated successfully");
      if (showSuccessToast) {
        toast({
          title: t('success'),
          description: t('password.updated'),
        });
      }
      
      resetForm();
      onComplete();
    } catch (error) {
      console.error('Error in password update flow:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('error.password.update'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className={`w-full ${className}`}>
        {showCurrentPassword && (
          <div className="relative mb-8">
            <Input
              type={showCurrentPasswordField ? "text" : "password"}
              placeholder={t('current.password')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-12 border-0 border-b border-[#e0e0e0] dark:border-[#3a3a3b] rounded-none font-medium text-[#000000A6] dark:text-[#FFFFFFA6] placeholder:text-[#000000A6] dark:placeholder:text-[#FFFFFFA6] placeholder:font-medium text-2xl pl-0 pr-10 bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPasswordField(!showCurrentPasswordField)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#000000A6] dark:text-[#FFFFFFA6] hover:text-[#000000] dark:hover:text-[#FFFFFF] focus:outline-none"
            >
              {showCurrentPasswordField ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t('new.password')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-12 border-0 border-b border-[#e0e0e0] dark:border-[#3a3a3b] rounded-none font-medium text-[#000000A6] dark:text-[#FFFFFFA6] placeholder:text-[#000000A6] dark:placeholder:text-[#FFFFFFA6] placeholder:font-medium text-2xl pl-0 pr-10 bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#000000A6] dark:text-[#FFFFFFA6] hover:text-[#000000] dark:hover:text-[#FFFFFF] focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {requirements.map((req) => {
          const isValid = req.validate(newPassword);
          return (
            <div
              key={req.id}
              className="flex items-center gap-2"
            >
              <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 ${
                isValid 
                  ? "border-[#219653] bg-[#219653]" 
                  : "border-[#e0e0e0] dark:border-[#3a3a3b] bg-white dark:bg-[#1c1c1e]"
              }`}>
                {isValid && (
                  <Check className="h-3 w-3 text-white stroke-[4]" />
                )}
              </div>
              <span className="text-sm font-medium text-[#000000A6] dark:text-[#FFFFFFA6]">
                {req.label}
              </span>
            </div>
          );
        })}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || !allRequirementsMet} 
        className={`h-12 ${buttonClassName}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <span
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              showSuccessAnimation ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {isLoading ? t('updating.password') : buttonText || t('update.password')}
          </span>
          
          <Check 
            className={`absolute inset-0 m-auto h-6 w-6 transition-opacity duration-200 ${
              showSuccessAnimation ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </Button>
    </form>
  );
};
