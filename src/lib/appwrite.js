import { Account, Client, Databases, ID, Permission, Query, Role } from 'appwrite';

const env = import.meta.env;
export const appwriteConfig = {
  endpoint: env.VITE_APPWRITE_ENDPOINT || '',
  projectId: env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: env.VITE_APPWRITE_DB_ID || '',
  examsId: env.VITE_APPWRITE_EXAMS_COLLECTION_ID || '',
  attemptsId: env.VITE_APPWRITE_ATTEMPTS_COLLECTION_ID || '',
};

export const missingConfig = Object.entries(appwriteConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
export const isAppwriteConfigured = missingConfig.length === 0;

const client = new Client();
if (appwriteConfig.endpoint) client.setEndpoint(appwriteConfig.endpoint);
if (appwriteConfig.projectId) client.setProject(appwriteConfig.projectId);

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
