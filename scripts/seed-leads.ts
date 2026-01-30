/**
 * Seed script to populate Firestore with realistic Brazilian lead data
 *
 * Usage:
 *   1. Make sure you have FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local
 *   2. Run: npx tsx scripts/seed-leads.ts <quizId>
 *
 * Example:
 *   npx tsx scripts/seed-leads.ts abc123-quiz-id
 */

import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove surrounding quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    });
  } catch {
    console.warn('Could not load .env.local, using existing environment variables');
  }
}

loadEnv();

// Brazilian first names
const FIRST_NAMES = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Igor', 'Julia', 'Kaique', 'Larissa', 'Marcos', 'Natalia', 'Otavio', 'Patricia',
  'Rafael', 'Sabrina', 'Thiago', 'Vanessa', 'William', 'Yasmin', 'Lucas', 'Marina',
  'Pedro', 'Renata', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Giovanna',
  'Henrique', 'Isabela', 'Joao', 'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Olivia',
  'Paulo', 'Raquel', 'Sergio', 'Tatiana', 'Vinicius', 'Amanda', 'Bruna', 'Caio',
  'Debora', 'Enzo', 'Flavia', 'Guilherme', 'Heloisa', 'Ivan', 'Juliana', 'Kevin',
  'Livia', 'Matheus', 'Nathalia', 'Otavio', 'Priscila', 'Ricardo', 'Sofia', 'Tiago',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Goncalves', 'Santana', 'Teixeira', 'Castro', 'Araujo', 'Correia', 'Pinto', 'Monteiro',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'uol.com.br',
  'terra.com.br', 'bol.com.br', 'icloud.com', 'live.com', 'protonmail.com',
];

// DDD codes from major Brazilian cities
const DDD_CODES = ['11', '21', '31', '41', '51', '61', '71', '81', '91', '19', '27', '47', '48', '85'];

// Outcome IDs - you'll need to update these to match your quiz
const DEFAULT_OUTCOMES = [
  { id: 'outcome-1', title: 'Perfil Conservador' },
  { id: 'outcome-2', title: 'Perfil Moderado' },
  { id: 'outcome-3', title: 'Perfil Arrojado' },
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function generateEmail(name: string): string {
  const firstName = name.split(' ')[0].toLowerCase();
  const lastName = name.split(' ')[1]?.toLowerCase() || '';
  const domain = randomElement(EMAIL_DOMAINS);
  const variants = [
    `${firstName}.${lastName}`,
    `${firstName}${lastName}`,
    `${firstName}_${lastName}`,
    `${firstName}${randomInt(1, 99)}`,
    `${firstName}.${lastName}${randomInt(1, 99)}`,
  ];
  const base = randomElement(variants)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  return `${base}@${domain}`;
}

function generatePhone(): string {
  const ddd = randomElement(DDD_CODES);
  const prefix = randomInt(9, 9); // Mobile phones start with 9
  const number = randomInt(10000000, 99999999);
  return `(${ddd}) ${prefix}${number.toString().slice(0, 4)}-${number.toString().slice(4)}`;
}

function generateCompanyName(): string {
  const prefixes = ['Tech', 'Digital', 'Global', 'Smart', 'Prime', 'Top', 'Elite', 'Pro', 'Max', 'Ultra'];
  const suffixes = ['Solutions', 'Systems', 'Group', 'Labs', 'Corp', 'Hub', 'Works', 'Studio', 'Agency', 'Co'];
  const types = ['Consultoria', 'Marketing', 'Tecnologia', 'Servicos', 'Comercio', 'Industria'];

  const variant = randomInt(1, 3);
  if (variant === 1) {
    return `${randomElement(prefixes)} ${randomElement(suffixes)}`;
  } else if (variant === 2) {
    return `${randomElement(LAST_NAMES)} ${randomElement(types)}`;
  }
  return `${randomElement(prefixes)}${randomElement(LAST_NAMES)}`;
}

function generateDate(daysAgo: number): number {
  const now = Date.now();
  const msAgo = daysAgo * 24 * 60 * 60 * 1000;
  const randomOffset = Math.random() * msAgo;
  return now - randomOffset;
}

interface LeadData {
  id: string;
  quizId: string;
  userId: string | null;
  startedAt: number;
  completedAt?: number;
  lastUpdatedAt: number;
  currentQuestionId?: string;
  answers: Record<string, string>;
  fieldResponses: Array<{
    fieldId: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'number' | 'textarea';
    value: string;
    stepId: string;
  }>;
  lead: {
    name?: string;
    email?: string;
    phone?: string;
  };
  resultOutcomeId?: string;
  status: 'started' | 'completed' | 'abandoned';
  isOwnerAttempt: boolean;
}

function generateLeadData(
  quizId: string,
  outcomes: Array<{ id: string; title: string }>,
  daysAgo: number,
  fieldConfig: {
    nameFieldId: string;
    emailFieldId: string;
    phoneFieldId?: string;
    companyFieldId?: string;
    stepId: string;
  }
): LeadData {
  const name = generateName();
  const email = generateEmail(name);
  const phone = generatePhone();
  const company = generateCompanyName();

  const startedAt = generateDate(daysAgo);
  const status = Math.random() > 0.15 ? 'completed' : (Math.random() > 0.5 ? 'started' : 'abandoned');
  const completedAt = status === 'completed' ? startedAt + randomInt(60000, 300000) : undefined;

  const fieldResponses: LeadData['fieldResponses'] = [
    {
      fieldId: fieldConfig.nameFieldId,
      label: 'Nome completo',
      type: 'text',
      value: name,
      stepId: fieldConfig.stepId,
    },
    {
      fieldId: fieldConfig.emailFieldId,
      label: 'E-mail',
      type: 'email',
      value: email,
      stepId: fieldConfig.stepId,
    },
  ];

  if (fieldConfig.phoneFieldId && Math.random() > 0.1) {
    fieldResponses.push({
      fieldId: fieldConfig.phoneFieldId,
      label: 'Telefone',
      type: 'phone',
      value: phone,
      stepId: fieldConfig.stepId,
    });
  }

  if (fieldConfig.companyFieldId && Math.random() > 0.3) {
    fieldResponses.push({
      fieldId: fieldConfig.companyFieldId,
      label: 'Empresa',
      type: 'text',
      value: company,
      stepId: fieldConfig.stepId,
    });
  }

  return {
    id: randomUUID(),
    quizId,
    userId: null,
    startedAt,
    completedAt,
    lastUpdatedAt: completedAt || startedAt,
    answers: {},
    fieldResponses,
    lead: {
      name,
      email,
      phone: fieldConfig.phoneFieldId ? phone : undefined,
    },
    resultOutcomeId: status === 'completed' ? randomElement(outcomes).id : undefined,
    status,
    isOwnerAttempt: false,
  };
}

async function initializeFirebase() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
  }

  // Parse the service account key (handle double-encoding)
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
    // Handle if it's double-stringified
    if (typeof serviceAccount === 'string') {
      serviceAccount = JSON.parse(serviceAccount);
    }
  } catch {
    // Try base64 decode
    const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.firestore();
}

async function getQuizData(db: admin.firestore.Firestore, quizId: string) {
  const quizDoc = await db.collection('quizzes').doc(quizId).get();

  if (!quizDoc.exists) {
    throw new Error(`Quiz with ID ${quizId} not found`);
  }

  const quizData = quizDoc.data();

  // Extract outcomes from visualBuilderData
  const outcomes = quizData?.visualBuilderData?.outcomes?.map((o: { id: string; name: string }) => ({
    id: o.id,
    title: o.name,
  })) || DEFAULT_OUTCOMES;

  // Extract field configuration from lead-gen step
  const steps = quizData?.visualBuilderData?.steps || [];
  const leadGenStep = steps.find((s: { type: string }) => s.type === 'lead-gen');

  let fieldConfig = {
    nameFieldId: 'field-name',
    emailFieldId: 'field-email',
    phoneFieldId: 'field-phone',
    companyFieldId: undefined as string | undefined,
    stepId: 'lead-gen-step',
  };

  if (leadGenStep) {
    fieldConfig.stepId = leadGenStep.id;
    const fieldsBlock = leadGenStep.blocks?.find((b: { type: string }) => b.type === 'fields');
    if (fieldsBlock?.config?.items) {
      const items = fieldsBlock.config.items;
      const nameField = items.find((f: { type: string; label?: string; id: string }) => f.type === 'text' && f.label?.toLowerCase().includes('nome'));
      const emailField = items.find((f: { type: string; id: string }) => f.type === 'email');
      const phoneField = items.find((f: { type: string; id: string }) => f.type === 'phone');
      const companyField = items.find((f: { type: string; label?: string; id: string }) =>
        f.type === 'text' && (f.label?.toLowerCase().includes('empresa') || f.label?.toLowerCase().includes('company'))
      );

      if (nameField) fieldConfig.nameFieldId = nameField.id;
      if (emailField) fieldConfig.emailFieldId = emailField.id;
      if (phoneField) fieldConfig.phoneFieldId = phoneField.id;
      if (companyField) fieldConfig.companyFieldId = companyField.id;
    }
  }

  return { outcomes, fieldConfig, quizData };
}

async function main() {
  const quizId = process.argv[2];

  if (!quizId) {
    console.error('Usage: npx tsx scripts/seed-leads.ts <quizId>');
    console.error('\nTo find your quiz ID:');
    console.error('1. Go to your dashboard');
    console.error('2. Click on a quiz');
    console.error('3. The ID is in the URL: /visual-builder/<quizId>');
    process.exit(1);
  }

  const LEAD_COUNT = parseInt(process.argv[3] || '75', 10);
  const DAYS_RANGE = parseInt(process.argv[4] || '30', 10);

  console.log('🌱 Seed Leads Script');
  console.log('====================');
  console.log(`Quiz ID: ${quizId}`);
  console.log(`Lead count: ${LEAD_COUNT}`);
  console.log(`Date range: last ${DAYS_RANGE} days\n`);

  try {
    console.log('📦 Initializing Firebase...');
    const db = await initializeFirebase();

    console.log('🔍 Fetching quiz data...');
    const { outcomes, fieldConfig } = await getQuizData(db, quizId);
    console.log(`   Found ${outcomes.length} outcomes`);
    console.log(`   Field config: name=${fieldConfig.nameFieldId}, email=${fieldConfig.emailFieldId}`);

    console.log('\n📝 Generating lead data...');
    const leads: LeadData[] = [];

    for (let i = 0; i < LEAD_COUNT; i++) {
      const daysAgo = Math.random() * DAYS_RANGE;
      leads.push(generateLeadData(quizId, outcomes, daysAgo, fieldConfig));
    }

    // Sort by startedAt descending (newest first)
    leads.sort((a, b) => b.startedAt - a.startedAt);

    console.log(`   Generated ${leads.length} leads`);
    console.log(`   - Completed: ${leads.filter(l => l.status === 'completed').length}`);
    console.log(`   - Started: ${leads.filter(l => l.status === 'started').length}`);
    console.log(`   - Abandoned: ${leads.filter(l => l.status === 'abandoned').length}`);

    console.log('\n💾 Saving to Firestore...');
    const batch = db.batch();

    for (const lead of leads) {
      const docRef = db.collection('quiz_attempts').doc(lead.id);
      batch.set(docRef, lead);
    }

    await batch.commit();
    console.log('✅ Successfully saved all leads!\n');

    // Show sample data
    console.log('📊 Sample leads created:');
    console.log('------------------------');
    leads.slice(0, 5).forEach((lead, i) => {
      const name = lead.lead.name || lead.fieldResponses.find(f => f.type === 'text')?.value || 'N/A';
      const email = lead.lead.email || lead.fieldResponses.find(f => f.type === 'email')?.value || 'N/A';
      const date = new Date(lead.startedAt).toLocaleDateString('pt-BR');
      console.log(`${i + 1}. ${name} <${email}> - ${date} (${lead.status})`);
    });
    console.log('...\n');

    console.log('🎉 Done! You can now view the leads at:');
    console.log(`   http://localhost:3500/dashboard/reports/${quizId}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
