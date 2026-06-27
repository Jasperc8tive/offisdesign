import { PasswordService } from './password.service';
import { API_ENV } from '../config/config.module';

describe('PasswordService', () => {
  const env = { BCRYPT_ROUNDS: 8 } as never;
  const service = new PasswordService(env);

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('hunter2');
    expect(hash).not.toBe('hunter2');
    await expect(service.verify('hunter2', hash)).resolves.toBe(true);
    await expect(service.verify('wrong', hash)).resolves.toBe(false);
  });

  it('keeps API_ENV symbol exported', () => {
    expect(typeof API_ENV).toBe('symbol');
  });
});
