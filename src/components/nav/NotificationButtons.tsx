import { MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NotificationIcon } from "../notifications/NotificationIcon";
import { NotificationList } from "../notifications/NotificationList";
import { useNavigate } from "react-router-dom";

export const NotificationButtons = () => {
  const { notifications = [], unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: checklistProgress } = useQuery({
    queryKey: ['checklist-progress-notifications'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('customer_checklist_progress')
        .select('*')
        .eq('customer_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching checklist progress:', error);
        return null;
      }

      return data;
    }
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklist-items-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('Error fetching checklist items:', error);
        return [];
      }

      return data;
    }
  });

  // Get the current timestamp for checklist notifications
  const now = new Date().toISOString();

  const checklistNotifications = checklistItems.map((item, index) => {
    let isCompleted = false;
    if (checklistProgress) {
      switch (index) {
        case 0:
          isCompleted = checklistProgress.password_updated || false;
          break;
        case 1:
          isCompleted = (checklistProgress.selected_sites?.length || 0) > 0;
          break;
        case 2:
          isCompleted = (checklistProgress.removal_urls?.length || 0) > 0;
          break;
        case 3:
          isCompleted = !!(checklistProgress.address && checklistProgress.personal_number);
          break;
      }
    }

    const stepTitle = index === 0 ? 'step.1.title' :
                     index === 1 ? 'step.2.title' :
                     index === 2 ? 'step.3.title' :
                     'step.4.title';

    const timestamp = checklistProgress?.updated_at || now;

    return {
      id: `checklist-${item.id}`,
      title: `${t('checklist')}: ${t(stepTitle)}`,
      message: isCompleted ? t('completed') : t('pending.completion'),
      read: isCompleted,
      created_at: timestamp,
      type: 'checklist'
    };
  });

  const allNotifications = [...notifications, ...checklistNotifications];
  const totalUnreadCount = unreadCount + checklistNotifications.filter(n => !n.read).length;

  const handleSettingsClick = () => {
    navigate('/settings', { state: { defaultTab: 'notifications' } });
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#000000A6] hover:text-[#000000] dark:text-[#FFFFFFA6] dark:hover:text-[#FFFFFF] h-8 w-8 flex items-center justify-center hover:bg-transparent dark:hover:bg-transparent hover:bg-transparent"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('messages')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-transparent dark:hover:bg-transparent"
              >
                <NotificationIcon unreadCount={totalUnreadCount} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('notifications')}</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="end" className="w-80 dark:bg-[#1c1c1e] dark:border-[#232325]">
          <div className="flex items-center justify-between px-4 py-2">
            <h4 className="font-medium text-black dark:text-[#FFFFFF]">{t('notifications.title')}</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="h-8 text-xs"
                >
                  {t('notifications.mark.all.read')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSettingsClick}
                className="h-8 w-8 text-[#000000A6] hover:text-[#000000] dark:text-[#FFFFFFA6] dark:hover:text-[#FFFFFF] hover:bg-transparent dark:hover:bg-transparent"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <DropdownMenuSeparator className="dark:border-[#232325]" />
          
          <NotificationList 
            notifications={allNotifications}
            onMarkAsRead={markAsRead}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};