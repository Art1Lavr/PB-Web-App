// test-backend.js - Script de test complet pour le backend NBA Analytics
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`SUCCESS: ${message}`, 'green');
}

function logError(message) {
  log(`ERROR: ${message}`, 'red');
}

function logInfo(message) {
  log(`INFO: ${message}`, 'cyan');
}

function logTest(message) {
  log(`\nTEST: ${message}`, 'yellow');
}

// Fonction pour tester un endpoint GET
async function testGet(endpoint, description) {
  logTest(description);
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    logSuccess(`Status: ${response.status}`);
    
    if (response.data) {
      if (response.data.success !== undefined) {
        logInfo(`Success: ${response.data.success}`);
      }
      if (response.data.count !== undefined) {
        logInfo(`Count: ${response.data.count}`);
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        logInfo(`Data length: ${response.data.data.length}`);
        if (response.data.data.length > 0) {
          logInfo(`First item: ${JSON.stringify(response.data.data[0], null, 2).substring(0, 200)}...`);
        }
      }
    }
    return { success: true, data: response.data };
  } catch (error) {
    logError(`Status: ${error.response?.status || 'No response'}`);
    logError(`Message: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester un endpoint POST
async function testPost(endpoint, description, data = {}) {
  logTest(description);
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data);
    logSuccess(`Status: ${response.status}`);
    
    if (response.data) {
      if (response.data.success !== undefined) {
        logInfo(`Success: ${response.data.success}`);
      }
      if (response.data.count !== undefined) {
        logInfo(`Count: ${response.data.count}`);
      }
      if (response.data.message) {
        logInfo(`Message: ${response.data.message}`);
      }
      if (response.data.breakdown) {
        logInfo(`Breakdown: ${JSON.stringify(response.data.breakdown)}`);
      }
    }
    return { success: true, data: response.data };
  } catch (error) {
    logError(`Status: ${error.response?.status || 'No response'}`);
    logError(`Message: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function runTests() {
  log('\n========================================', 'blue');
  log('NBA ANALYTICS BACKEND - TESTS', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Connexion au serveur
  logTest('1. Connexion au serveur');
  try {
    const response = await axios.get(BASE_URL);
    logSuccess('Serveur accessible');
    logInfo(`Message: ${response.data.message}`);
    results.passed++;
  } catch (error) {
    logError('Serveur non accessible');
    logError('Assure-toi que le serveur tourne avec: node server.js');
    results.failed++;
    return; // Arrêter si le serveur n'est pas accessible
  }
  results.total++;

  // Test 2: GET /api/teams
  results.total++;
  const teamsTest = await testGet('/api/teams', '2. GET /api/teams - Toutes les équipes');
  if (teamsTest.success && teamsTest.data.count > 0) {
    results.passed++;
  } else {
    results.failed++;
    logError('Aucune équipe trouvée. Lance: curl -X POST http://localhost:3001/api/admin/populate-teams');
  }

  // Test 3: GET /api/teams/random/10
  results.total++;
  const randomTeamsTest = await testGet('/api/teams/random/10', '3. GET /api/teams/random/10 - 10 équipes aléatoires');
  if (randomTeamsTest.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: GET /api/players
  results.total++;
  const playersTest = await testGet('/api/players', '4. GET /api/players - Tous les joueurs');
  if (playersTest.success) {
    results.passed++;
    if (playersTest.data.count === 0) {
      logInfo('Aucun joueur. Pour peupler: curl -X POST http://localhost:3001/api/admin/populate-players');
    }
  } else {
    results.failed++;
  }

  // Test 5: GET /api/players/top/10
  results.total++;
  const topPlayersTest = await testGet('/api/players/top/10', '5. GET /api/players/top/10 - Top 10 joueurs');
  if (topPlayersTest.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: GET /api/players/search/LeBron
  results.total++;
  const searchTest = await testGet('/api/players/search/LeBron', '6. GET /api/players/search/LeBron - Recherche joueur');
  if (searchTest.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: GET /api/games/latest
  results.total++;
  const gamesTest = await testGet('/api/games/latest', '7. GET /api/games/latest - Derniers matches');
  if (gamesTest.success) {
    results.passed++;
    if (gamesTest.data.count === 0) {
      logInfo('Aucun match. Pour peupler: curl -X POST http://localhost:3001/api/admin/populate-games');
    }
  } else {
    results.failed++;
  }

  // Test 8: Endpoint inexistant (devrait retourner 404)
  results.total++;
  logTest('8. GET /api/invalid - Endpoint inexistant (devrait échouer)');
  try {
    await axios.get(`${BASE_URL}/api/invalid`);
    logError('Devrait retourner 404');
    results.failed++;
  } catch (error) {
    if (error.response?.status === 404) {
      logSuccess('404 retourné correctement');
      results.passed++;
    } else {
      logError('Mauvais code erreur');
      results.failed++;
    }
  }

  // Résumé
  log('\n========================================', 'blue');
  log('RESULTATS DES TESTS', 'blue');
  log('========================================', 'blue');
  log(`Total: ${results.total}`, 'cyan');
  log(`Passes: ${results.passed}`, 'green');
  log(`Echecs: ${results.failed}`, 'red');
  
  if (results.failed === 0) {
    log('\nTOUS LES TESTS PASSES!', 'green');
  } else {
    log(`\n${results.failed} test(s) ont echoue`, 'red');
  }
  
  log('\n========================================\n', 'blue');

  // Recommandations
  if (teamsTest.data?.count === 0) {
    log('RECOMMANDATION:', 'yellow');
    log('Peuple la base de donnees avec:', 'yellow');
    log('curl -X POST http://localhost:3001/api/admin/populate-teams\n', 'cyan');
  }
}

// Lancer les tests
runTests().catch(error => {
  logError(`Erreur fatale: ${error.message}`);
  process.exit(1);
});