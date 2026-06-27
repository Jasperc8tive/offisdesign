'use client';

import { useMutation } from '@tanstack/react-query';
import { marketingService } from '../api/services/marketing';

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (input: { email: string; source?: string; referrer?: string }) =>
      marketingService.subscribe(input),
  });
}
