import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (!process.env[key.trim()]) process.env[key.trim()] = value;
  }
});

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const quizId = process.argv[2] || 'af87d006-129b-40bc-89cb-4dccdb65509c';
  const doc = await db.collection('quizzes').doc(quizId).get();
  const data = doc.data();

  console.log('Quiz title:', data?.title);
  console.log('Quiz stats:', data?.stats);

  // Raw visualBuilderData
  console.log('\nRaw visualBuilderData:');
  console.log(JSON.stringify(data?.visualBuilderData, null, 2));

  // Legacy format
  console.log('\nLegacy leadGen:', data?.leadGen);
}
main();
