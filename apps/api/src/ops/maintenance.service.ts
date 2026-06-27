import { Injectable } from '@nestjs/common';
import { SettingsService } from './settings.service';

const KEY = 'system.maintenance';

interface MaintenanceState {
  enabled: boolean;
  message?: string;
  /** ISO timestamp the mode was enabled at, for UI display. */
  since?: string;
}

@Injectable()
export class MaintenanceService {
  constructor(private readonly settings: SettingsService) {}

  async getState(): Promise<MaintenanceState> {
    const row = await this.settings
      .get(KEY)
      .catch(() => ({ value: { enabled: false } as MaintenanceState }));
    return (row.value as MaintenanceState) ?? { enabled: false };
  }

  async setState(state: MaintenanceState, actorId?: string) {
    await this.settings.upsert(
      {
        key: KEY,
        value: state,
        isPublic: true,
      },
      actorId,
    );
    return state;
  }
}
