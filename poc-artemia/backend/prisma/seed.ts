import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Ensure collection is open
  await prisma.collectionConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isOpen: true },
  });

  // Create admin account
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@cd78.fr';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin2024!';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminHash,
      nom: 'Administrateur DSI',
      direction: 'Direction des Systèmes d\'Information',
      role: Role.ADMIN,
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create 5 test users from different directions
  const testUsers = [
    { email: 'marie.dupont@cd78.fr', nom: 'Marie Dupont', direction: 'DRH - Direction des Ressources Humaines' },
    { email: 'pierre.martin@cd78.fr', nom: 'Pierre Martin', direction: 'DAF - Direction des Affaires Financières' },
    { email: 'sophie.bernard@cd78.fr', nom: 'Sophie Bernard', direction: 'DGAS - Direction Générale Adjointe des Services' },
    { email: 'thomas.leroy@cd78.fr', nom: 'Thomas Leroy', direction: 'Direction Numérique' },
    { email: 'claire.moreau@cd78.fr', nom: 'Claire Moreau', direction: 'Direction Sociale' },
  ];

  const createdUsers: { id: string; email: string }[] = [];
  for (const u of testUsers) {
    const hash = await bcrypt.hash('Test2024!', 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash, role: Role.USER },
    });
    createdUsers.push({ id: user.id, email: user.email });
    console.log(`User created: ${user.email}`);
  }

  // Create 3 pre-filled responses
  const responseData = [
    {
      userIndex: 0, // Marie Dupont - DRH
      casUsage: 'Rédaction d\'offres d\'emploi et analyse de CV pour les recrutements de la direction',
      scores: {
        A1: 4, A2: 3, A3: 4,
        B1: 3, B2: 4, B3: 4,
        C1: 3, C2: 4, C3: 2,
        D1: 3, D2: 3, D3: 2, D4: 2, D5: 3, D6: 3,
        E1: 2, E2: 3,
        F1: 3, F2: 4, F3: 3,
      },
      openG1: 'La rapidité de génération des offres d\'emploi est impressionnante. En quelques minutes, j\'obtiens une première version que je n\'ai plus qu\'à affiner. Le gain de temps est réel, surtout en période de fort recrutement.',
      openG2: 'Le principal frein est la question de la confidentialité des données RH. Nos agents sont légitimement inquiets de soumettre des informations sensibles sur les candidats à un système d\'IA. Il faudra un cadre juridique clair.',
      openG3: 'Sur quelques CV atypiques (reconversions professionnelles, parcours internationaux), l\'IA a eu tendance à sous-évaluer les compétences transférables. Elle reste trop littérale dans l\'analyse.',
      openG4: 'Oui, je recommande le déploiement, en commençant par les tâches à faible sensibilité : rédaction de communications RH, FAQ internes, synthèses de procédures. Un déploiement progressif avec formation est indispensable.',
    },
    {
      userIndex: 1, // Pierre Martin - DAF
      casUsage: 'Analyse de marchés publics, aide à la rédaction de cahiers des charges et synthèse de rapports financiers',
      scores: {
        A1: 3, A2: 3, A3: 3,
        B1: 4, B2: 4, B3: 3,
        C1: 2, C2: 3, C3: 2,
        D1: 4, D2: 3, D3: 3, D4: 3, D5: 2, D6: 3,
        E1: 1, E2: 2,
        F1: 2, F2: 3, F3: 2,
      },
      openG1: 'L\'interface est très bien conçue, la prise en main est immédiate. La capacité à résumer de longs documents financiers en quelques secondes est un vrai plus pour la préparation des réunions budgétaires.',
      openG2: 'La conformité réglementaire est mon principal frein. Dans le domaine des marchés publics, une erreur d\'interprétation peut avoir des conséquences juridiques. L\'IA manque parfois de précision sur les références législatives.',
      openG3: 'J\'ai constaté des erreurs factuelles sur des références au Code de la commande publique. L\'IA confond parfois des articles ou cite des versions obsolètes des textes. Cela nécessite une vérification systématique.',
      openG4: 'Déploiement conditionnel. L\'outil est utile pour les tâches rédactionnelles et de synthèse, mais doit être accompagné d\'une charte d\'utilisation stricte et d\'une formation sur ses limites, surtout en contexte juridique.',
    },
    {
      userIndex: 3, // Thomas Leroy - Direction Numérique
      casUsage: 'Rédaction de documentation technique, aide au débogage de scripts, synthèse de spécifications fonctionnelles',
      scores: {
        A1: 4, A2: 4, A3: 4,
        B1: 4, B2: 4, B3: 4,
        C1: 4, C2: 4, C3: 3,
        D1: 4, D2: 4, D3: 3, D4: 4, D5: 3, D6: 4,
        E1: 3, E2: 3,
        F1: 4, F2: 4, F3: 4,
      },
      openG1: 'Tout. La solution est techniquement excellente. La qualité des réponses sur les sujets IT est remarquable : documentation, code, architecture système. Le gain de productivité est immédiat et mesurable. C\'est clairement l\'outil qui manquait à nos équipes.',
      openG2: 'Peu de freins techniques de mon côté. Le principal obstacle sera culturel et organisationnel : convaincre les agents moins technophiles et les managers prudents. Il faudra des cas d\'usage bien documentés et des retours d\'expérience internes.',
      openG3: 'Très peu d\'incidents. Sur des questions très spécifiques à notre infrastructure (versions logicielles propriétaires, configurations internes), l\'IA manque parfois de contexte, mais c\'est prévisible et gérable.',
      openG4: 'Je recommande fortement le déploiement. C\'est une opportunité de modernisation majeure pour la DSI et l\'ensemble des services du Département. Je propose de commencer par un déploiement ciblé DSI + 2-3 directions pilotes avant généralisation.',
    },
  ];

  for (const rd of responseData) {
    const user = createdUsers[rd.userIndex];
    if (!user) continue;
    await prisma.response.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        casUsage: rd.casUsage,
        scores: rd.scores,
        openG1: rd.openG1,
        openG2: rd.openG2,
        openG3: rd.openG3,
        openG4: rd.openG4,
      },
    });
    console.log(`Response created for: ${user.email}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
