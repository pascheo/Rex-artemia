const bcrypt = require('bcryptjs');

const motDePasse = process.argv[2];

if (!motDePasse) {
  console.error('Usage : node generate-password.js <votre-mot-de-passe>');
  process.exit(1);
}

const hash = bcrypt.hashSync(motDePasse, 10);
console.log('\nHash bcrypt généré :');
console.log(hash);
console.log('\nCopiez cette valeur dans docker-compose.yml sous DSI_PASSWORD_HASH.');
