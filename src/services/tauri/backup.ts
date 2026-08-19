import { safeInvoke } from "./client";
import { ImportSummary } from "@/types/backup";

export const backupService = {
  async exportBackup(passphrase?: string, includeCredentials = true): Promise<string> {
    return safeInvoke<string>("export_backup_data", {
      passphrase: passphrase && passphrase.trim().length > 0 ? passphrase : null,
      includeCredentials,
    });
  },

  async importBackup(rawData: string, passphrase?: string): Promise<ImportSummary> {
    return safeInvoke<ImportSummary>("import_backup_data", {
      rawData,
      passphrase: passphrase && passphrase.trim().length > 0 ? passphrase : null,
    });
  },
};
