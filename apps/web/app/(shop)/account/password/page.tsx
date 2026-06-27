'use client';

import { useState } from 'react';
import { Alert, Button, Card, CardBody, FormField, Heading, Input, Stack } from '@offisdesign/ui';
import { useChangePassword } from '../../../../lib/hooks';
import { toast } from '../../../../lib/providers';
import { ApiError } from '../../../../lib/api/errors';

export default function PasswordChangePage() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success('Password changed. Please sign in again.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  return (
    <Stack gap={4}>
      <Heading level={2}>Change password</Heading>
      <Card>
        <CardBody>
          <form onSubmit={submit}>
            <Stack gap={4}>
              {error && <Alert variant="error">{error}</Alert>}
              <FormField label="Current password" htmlFor="cur" required>
                <Input
                  id="cur"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <FormField label="New password" htmlFor="new" required>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNext(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm new password" htmlFor="conf" required>
                <Input
                  id="conf"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </FormField>
              <Button type="submit" loading={changePassword.isPending}>
                Change password
              </Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Stack>
  );
}
