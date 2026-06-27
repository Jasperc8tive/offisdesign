'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services/customer';

export const customerKeys = {
  addresses: () => ['customer', 'addresses'] as const,
  sessions: () => ['customer', 'sessions'] as const,
};

export function useRegister() {
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      marketingOptIn?: boolean;
    }) => customerService.register(input),
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => customerService.verifyEmail(token) });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => customerService.requestPasswordReset(email),
  });
}

export function useCompletePasswordReset() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      customerService.completePasswordReset(token, password),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerService.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'me'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => customerService.changePassword(currentPassword, newPassword),
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: customerKeys.addresses(),
    queryFn: () => customerService.listAddresses(),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => customerService.addAddress(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.addresses() }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      customerService.updateAddress(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.addresses() }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.addresses() }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: customerKeys.sessions(),
    queryFn: () => customerService.listSessions(),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.sessions() }),
  });
}
