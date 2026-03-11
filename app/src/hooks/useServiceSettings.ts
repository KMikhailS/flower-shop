import { useQuery } from '@tanstack/react-query';
import { fetchDeliveryAmount, fetchPostcardAmount, fetchWorkTime } from '../api/client';

export const useServiceAmounts = (initData?: string, enabled: boolean = true) => {
  return useQuery<{ deliveryAmount: number; postcardAmount: number }>({
    queryKey: ['service-amounts', initData],
    queryFn: async () => {
      const [deliveryAmount, postcardAmount] = await Promise.all([
        fetchDeliveryAmount(initData as string),
        fetchPostcardAmount(initData as string),
      ]);
      return { deliveryAmount, postcardAmount };
    },
    enabled: Boolean(initData) && enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useWorkTime = (initData?: string, enabled: boolean = true) => {
  return useQuery<{ work_time_from: string; work_time_to: string }>({
    queryKey: ['work-time', initData],
    queryFn: () => fetchWorkTime(initData as string),
    enabled: Boolean(initData) && enabled,
    staleTime: 10 * 60 * 1000,
  });
};
