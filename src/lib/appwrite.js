import { Account, Client, Databases, ID, Permission, Query, Role } from 'appwrite';

export const appwriteConfig = {
  endpoint: 'https://sgp.cloud.appwrite.io/v1',
  projectId: '6b09078c001931acb59b',
  databaseId: import.meta.env.VITE_APPWRITE_DB_ID || '',
  examsId: import.meta.env.VITE_APPWRITE_EXAMS_COLLECTION_ID || '',
  attemptsId: import.meta.env.VITE_APPWRITE_ATTEMPTS_COLLECTION_ID || '',
};

export const missingConfig = Object.entries(appwriteConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
export const isAppwriteConfigured = missingConfig.length === 0;

export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Permission, Query, Role };

export function ensureAppwriteConfig() {
  if (!isAppwriteConfigured) {
    throw new Error(`Appwrite configuration is incomplete. Set: ${missingConfig.join(', ')}.`);
  }
}

export function currentStudentId(user) {
  return user?.email?.split('@')[0]?.trim().toLowerCase() || '';
}
