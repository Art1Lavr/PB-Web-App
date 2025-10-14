// server.js - Serveur Express adapté pour NBA API Free Data
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// MONGODB CONNECTION
// ==========================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ==========================================
// MONGOOSE MODELS
// ==========================================

// Player Model (adapté à l'API)
const playerSchema = new mongoose.Schema({
  apiPlayerId: String,
  name: String,
  displayName: String,
  shortName: String,
  team: String,
  teamId: String,
  position: String,
  jersey: String,
  image: String,
  imageUrl: String,
  // Stats
  points: Number,
  assists: Number,
  rebounds: Number,
  lastUpdated: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

// Team Model (adapté à l'API ESPN)
const teamSchema = new mongoose.Schema({
  apiTeamId: String,
  name: String,
  shortName: String,
  abbrev: String,
  logo: String,
  logoDark: String,
  href: String,
  conference: String,
  division: String,
  // Stats
  wins: Number,
  losses: Number,
  lastUpdated: { type: Date, default: Date.now }
});

const Team = mongoose.model('Team', teamSchema);

// Game Model (adapté à l'API)
const gameSchema = new mongoose.Schema({
  apiGameId: String,
  date: Date,
  dateFormatted: String,
  status: String,
  homeTeam: {
    id: String,
    name: String,
    abbrev: String,
    logo: String,
    score: Number
  },
  awayTeam: {
    id: String,
    name: String,
    abbrev: String,
    logo: String,
    score: Number
  },
  venue: String,
  lastUpdated: { type: Date, default: Date.now }
});

const Game = mongoose.model('Game', gameSchema);

// ==========================================
// RAPIDAPI SERVICE
// ==========================================
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'nba-api-free-data.p.rapidapi.com';

const rapidApiAxios = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  }
});

// Fonction pour récupérer les données de RapidAPI
async function fetchFromRapidAPI(endpoint) {
  try {
    console.log(`Fetching from RapidAPI: ${endpoint}`);
    const response = await rapidApiAxios.get(endpoint);
    
    if (response.data && response.data.status === 'success') {
      return response.data.response;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error(`Error fetching from RapidAPI (${endpoint}):`, error.message);
    throw error;
  }
}

// ==========================================
// ROUTES - PLAYERS
// ==========================================

// GET all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ name: 1 });
    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching players',
      error: error.message
    });
  }
});

// GET player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching player',
      error: error.message
    });
  }
});

// Search players by name
app.get('/api/players/search/:name', async (req, res) => {
  try {
    const players = await Player.find({
      $or: [
        { name: { $regex: req.params.name, $options: 'i' } },
        { displayName: { $regex: req.params.name, $options: 'i' } }
      ]
    }).limit(10);
    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching players',
      error: error.message
    });
  }
});

// GET top 10 players (by points)
app.get('/api/players/top/10', async (req, res) => {
  try {
    const players = await Player.find()
      .sort({ points: -1 })
      .limit(10);
    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top players',
      error: error.message
    });
  }
});

// ==========================================
// ROUTES - TEAMS
// ==========================================

// GET all teams
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
});

// GET team by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
      error: error.message
    });
  }
});

// GET random 10 teams (for homepage)
app.get('/api/teams/random/10', async (req, res) => {
  try {
    const teams = await Team.aggregate([{ $sample: { size: 10 } }]);
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching random teams',
      error: error.message
    });
  }
});

// ==========================================
// ROUTES - GAMES
// ==========================================

// GET all games
app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ date: -1 });
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching games',
      error: error.message
    });
  }
});

// GET latest games (last 10)
app.get('/api/games/latest', async (req, res) => {
  try {
    const games = await Game.find()
      .sort({ date: -1 })
      .limit(10);
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest games',
      error: error.message
    });
  }
});

// GET games by date
app.get('/api/games/date/:date', async (req, res) => {
  try {
    const games = await Game.find({
      dateFormatted: req.params.date
    }).sort({ date: 1 });
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching games by date',
      error: error.message
    });
  }
});

// ==========================================
// ADMIN ROUTES - Populate Database
// ==========================================

// Populate teams from RapidAPI
app.post('/api/admin/populate-teams', async (req, res) => {
  try {
    console.log('Fetching teams from RapidAPI...');
    
    // Les 6 divisions NBA
    const divisions = [
      { name: 'Atlantic', endpoint: '/nba-atlantic-team-list', conference: 'East' },
      { name: 'Central', endpoint: '/nba-central-team-list', conference: 'East' },
      { name: 'Southeast', endpoint: '/nba-southeast-team-list', conference: 'East' },
      { name: 'Northwest', endpoint: '/nba-northwest-team-list', conference: 'West' },
      { name: 'Pacific', endpoint: '/nba-pacific-team-list', conference: 'West' },
      { name: 'Southwest', endpoint: '/nba-southwest-team-list', conference: 'West' }
    ];
    
    let allTeams = [];
    
    // Récupérer les équipes de chaque division
    for (const division of divisions) {
      console.log(`Fetching ${division.name} division...`);
      try {
        const data = await fetchFromRapidAPI(division.endpoint);
        
        if (data.teamList && data.teamList.length > 0) {
          const teamsWithDivision = data.teamList.map(team => ({
            ...team,
            divisionName: division.name,
            conferenceName: division.conference
          }));
          allTeams.push(...teamsWithDivision);
          console.log(`Found ${data.teamList.length} teams in ${division.name}`);
        }
        
        // Attendre 500ms entre chaque requête pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching ${division.name}:`, error.message);
      }
    }
    
    if (allTeams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No teams found in API response'
      });
    }

    // Clear existing teams
    await Team.deleteMany({});
    console.log('Cleared old teams');
    
    // Insert new teams
    const teamsToInsert = allTeams.map(team => ({
      apiTeamId: team.id,
      name: team.name,
      shortName: team.shortName,
      abbrev: team.abbrev,
      logo: team.logo,
      logoDark: team.logoDark,
      href: team.href,
      conference: team.conferenceName,
      division: team.divisionName,
      wins: 0,
      losses: 0
    }));

    await Team.insertMany(teamsToInsert);

    console.log(`Successfully populated ${teamsToInsert.length} teams`);
    res.json({
      success: true,
      message: `Successfully populated ${teamsToInsert.length} teams from all 6 divisions`,
      count: teamsToInsert.length,
      breakdown: {
        Atlantic: allTeams.filter(t => t.divisionName === 'Atlantic').length,
        Central: allTeams.filter(t => t.divisionName === 'Central').length,
        Southeast: allTeams.filter(t => t.divisionName === 'Southeast').length,
        Northwest: allTeams.filter(t => t.divisionName === 'Northwest').length,
        Pacific: allTeams.filter(t => t.divisionName === 'Pacific').length,
        Southwest: allTeams.filter(t => t.divisionName === 'Southwest').length
      }
    });
  } catch (error) {
    console.error('Error populating teams:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error populating teams',
      error: error.message
    });
  }
});

// Populate players from RapidAPI
app.post('/api/admin/populate-players', async (req, res) => {
  try {
    console.log('Fetching players from RapidAPI...');
    
    // Essayer différents endpoints possibles
    let data;
    try {
      data = await fetchFromRapidAPI('/players');
    } catch (e1) {
      try {
        data = await fetchFromRapidAPI('/nba/players');
      } catch (e2) {
        return res.status(404).json({
          success: false,
          message: 'Players endpoint not found. Check API documentation.',
          error: e2.message
        });
      }
    }
    
    if (!data.playerList || data.playerList.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No players found in API response'
      });
    }

    // Clear existing players
    await Player.deleteMany({});
    console.log('Cleared old players');
    
    // Insert new players
    const playersToInsert = data.playerList.map(player => ({
      apiPlayerId: player.id,
      name: player.name || player.displayName,
      displayName: player.displayName,
      shortName: player.shortName,
      team: player.team?.name || 'Free Agent',
      teamId: player.team?.id,
      position: player.position,
      jersey: player.jersey,
      image: player.image,
      imageUrl: player.headshot,
      points: 0,
      assists: 0,
      rebounds: 0
    }));

    await Player.insertMany(playersToInsert);

    console.log(`Successfully populated ${playersToInsert.length} players`);
    res.json({
      success: true,
      message: `Successfully populated ${playersToInsert.length} players`,
      count: playersToInsert.length
    });
  } catch (error) {
    console.error('Error populating players:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error populating players',
      error: error.message
    });
  }
});

// Populate games from RapidAPI
app.post('/api/admin/populate-games', async (req, res) => {
  try {
    console.log('Fetching games from RapidAPI...');
    
    // Essayer différents endpoints possibles
    let data;
    try {
      data = await fetchFromRapidAPI('/games');
    } catch (e1) {
      try {
        data = await fetchFromRapidAPI('/schedule');
      } catch (e2) {
        try {
          // Essayer avec une date
          const today = new Date().toISOString().split('T')[0];
          data = await fetchFromRapidAPI(`/games?date=${today}`);
        } catch (e3) {
          return res.status(404).json({
            success: false,
            message: 'Games endpoint not found. Check API documentation.',
            error: e3.message
          });
        }
      }
    }
    
    if (!data.gameList || data.gameList.length === 0) {
      return res.json({
        success: true,
        message: 'No games found',
        count: 0
      });
    }

    // Clear existing games
    await Game.deleteMany({});
    console.log('Cleared old games');

    // Insert new games
    const gamesToInsert = data.gameList.map(game => ({
      apiGameId: game.id,
      date: new Date(game.date),
      dateFormatted: game.dateFormatted,
      status: game.status,
      homeTeam: {
        id: game.homeTeam?.id,
        name: game.homeTeam?.name,
        abbrev: game.homeTeam?.abbrev,
        logo: game.homeTeam?.logo,
        score: game.homeTeam?.score || 0
      },
      awayTeam: {
        id: game.awayTeam?.id,
        name: game.awayTeam?.name,
        abbrev: game.awayTeam?.abbrev,
        logo: game.awayTeam?.logo,
        score: game.awayTeam?.score || 0
      },
      venue: game.venue
    }));

    await Game.insertMany(gamesToInsert);

    console.log(`Successfully populated ${gamesToInsert.length} games`);
    res.json({
      success: true,
      message: `Successfully populated ${gamesToInsert.length} games`,
      count: gamesToInsert.length
    });
  } catch (error) {
    console.error('Error populating games:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error populating games',
      error: error.message
    });
  }
});

// Test endpoint pour voir les données brutes de l'API
app.get('/api/admin/test-api/:endpoint', async (req, res) => {
  try {
    const data = await fetchFromRapidAPI(`/${req.params.endpoint}`);
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing API',
      error: error.message
    });
  }
});

// ==========================================
// ROOT ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Ball Don\'t Lie - NBA Analytics API',
    version: '1.0.0',
    apiHost: RAPIDAPI_HOST,
    endpoints: {
      players: {
        getAll: 'GET /api/players',
        getById: 'GET /api/players/:id',
        search: 'GET /api/players/search/:name',
        top10: 'GET /api/players/top/10'
      },
      teams: {
        getAll: 'GET /api/teams',
        getById: 'GET /api/teams/:id',
        random10: 'GET /api/teams/random/10'
      },
      games: {
        getAll: 'GET /api/games',
        getLatest: 'GET /api/games/latest',
        getByDate: 'GET /api/games/date/:date'
      },
      admin: {
        populateTeams: 'POST /api/admin/populate-teams',
        populatePlayers: 'POST /api/admin/populate-players',
        populateGames: 'POST /api/admin/populate-games',
        testApi: 'GET /api/admin/test-api/:endpoint'
      }
    }
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Ball Don\'t Lie - NBA Analytics Backend');
  console.log('==========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Documentation at http://localhost:${PORT}`);
  console.log(`API Key: ${RAPIDAPI_KEY ? 'Configured' : 'Missing'}`);
  console.log(`API Host: ${RAPIDAPI_HOST}`);
  console.log('==========================================\n');
});