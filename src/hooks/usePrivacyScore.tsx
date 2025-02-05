
import { useGuideData } from "@/hooks/useGuideData";
import { useIncomingUrls } from "@/hooks/useIncomingUrls";
import { useChecklistProgress } from "@/hooks/useChecklistProgress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAddressData } from "@/components/address/hooks/useAddressData";

export const usePrivacyScore = () => {
  const { getGuides } = useGuideData();
  const { incomingUrls } = useIncomingUrls();
  const { checklistProgress } = useChecklistProgress();
  const { addressData } = useAddressData();
  const allGuides = getGuides();

  const { data: subscriptionPlan } = useQuery({
    queryKey: ['subscription-plan'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: customer } = await supabase
        .from('customers')
        .select('subscription_plan')
        .eq('id', session.user.id)
        .single();

      return customer?.subscription_plan;
    }
  });

  const calculateScore = () => {
    console.log('Calculating privacy score with:', {
      allGuides,
      incomingUrls,
      subscriptionPlan,
      completedGuides: checklistProgress?.completed_guides,
      addressData
    });

    // Initialize weights based on subscription plan
    let weights = {
      guides: subscriptionPlan === '1_month' ? 0.5 : 0.333,
      address: subscriptionPlan === '1_month' ? 0.5 : 0.333,
      urls: subscriptionPlan === '1_month' ? 0 : 0.333
    };

    console.log('Using weights:', weights);

    // Check if there's an active address
    const hasActiveAddress = Boolean(
      addressData?.street_address && 
      !addressData?.deleted_at && 
      (!addressData?.address_history?.length || 
        addressData.address_history[addressData.address_history.length - 1]?.deleted_at)
    );

    console.log('Active address check:', {
      hasAddress: Boolean(addressData?.street_address),
      notDeleted: !addressData?.deleted_at,
      historyLength: addressData?.address_history?.length,
      lastHistoryEntry: addressData?.address_history?.[addressData?.address_history?.length - 1],
      hasActiveAddress
    });

    // Calculate individual scores with detailed logging
    const scores = {
      guides: allGuides.length > 0 ? 
        ((checklistProgress?.completed_guides?.length || 0) / allGuides.length) : 1,
      address: hasActiveAddress ? 1 : 0,
      urls: calculateUrlScore()
    };

    console.log('Individual scores before weighting:', scores);

    // Calculate weighted total with detailed logging
    const totalScore = Object.keys(weights).reduce((total, key) => {
      const weightedScore = scores[key as keyof typeof scores] * weights[key as keyof typeof weights];
      console.log(`${key} weighted score:`, weightedScore);
      return total + weightedScore;
    }, 0);

    console.log('Final total score:', totalScore);

    return {
      total: Math.round(totalScore * 100),
      individual: {
        guides: Math.round(scores.guides * 100),
        address: Math.round(scores.address * 100),
        urls: Math.round(scores.urls * 100)
      }
    };
  };

  const calculateUrlScore = () => {
    if (subscriptionPlan === '1_month') return 1; // Not applicable for 1-month plan
    if (!incomingUrls?.length) return 1; // No URLs submitted is considered complete

    console.log('Calculating URL score with:', {
      incomingUrls,
      completedCount: incomingUrls.filter(url => url.status === 'removal_approved').length
    });

    // Calculate based on URL statuses
    const completedUrls = incomingUrls.filter(url => 
      url.status === 'removal_approved'
    ).length;

    return completedUrls / incomingUrls.length;
  };

  return { calculateScore };
};
