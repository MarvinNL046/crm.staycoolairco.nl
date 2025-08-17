#!/usr/bin/env node

/**
 * CRM Facturatie Systeem Setup - Hive Mind Swarm
 * 
 * Dit script:
 * 1. Zet de database op met het SQL schema
 * 2. Spawnt een gespecialiseerde hive-mind swarm voor facturatie ontwikkeling
 * 3. Coördineert agents om het complete facturatiesysteem te bouwen
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ANSI color codes voor mooie terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functies voor console output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  swarm: (msg) => console.log(`${colors.magenta}🐝${colors.reset} ${msg}`)
};

// ASCII Art Header
const showHeader = () => {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  ${colors.bright}  _____ _   ___     _____ _   _  ____ _____ _   _ ____  ___ ${colors.cyan} ║
║  ${colors.bright} / ___| | | |_ _|   |  ___| \\ | |/ ___|_   _| | | |  _ \\|_ _|${colors.cyan} ║
║  ${colors.bright}| |   | |_| || |    | |_  |  \\| | |     | | | | | | |_) || | ${colors.cyan} ║
║  ${colors.bright}| |___|  _  || |    |  _| | |\\  | |___  | | | |_| |  _ < | | ${colors.cyan} ║
║  ${colors.bright} \\____|_| |_|___|   |_|   |_| \\_|\\____| |_|  \\___/|_| \\_\\___|${colors.cyan} ║
║                                                               ║
║  ${colors.yellow}     🚀 Hive Mind Swarm Facturatie Systeem Setup 🚀         ${colors.cyan} ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);
};

// Configuratie
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  sqlPath: path.join(__dirname, 'setup-database.sql'),
  swarmObjective: 'Build Complete CRM Invoicing System with Quote-to-Invoice workflow integration'
};

// Supabase client initialiseren
const getSupabaseClient = () => {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Supabase configuratie ontbreekt! Check je .env bestand.');
  }
  return createClient(config.supabaseUrl, config.supabaseServiceKey);
};

// SQL script uitvoeren in Supabase
async function executeSQLInSupabase() {
  log.step('Database schema installeren in Supabase...');
  
  try {
    const supabase = getSupabaseClient();
    const sqlContent = await fs.readFile(config.sqlPath, 'utf8');
    
    // Split SQL in individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.length < 10) continue;
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Check if it's a "already exists" error which we can ignore
          if (error.message.includes('already exists')) {
            log.warning(`Object bestaat al, skip: ${statement.substring(0, 50)}...`);
          } else {
            log.error(`SQL Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Als exec_sql niet bestaat, probeer direct query
        try {
          await supabase.from('_dummy_').select().limit(0); // Test connection
          log.warning('Direct SQL execution niet ondersteund, gebruik Supabase Dashboard SQL editor');
          return false;
        } catch (e) {
          errorCount++;
        }
      }
    }
    
    log.success(`Database setup compleet! (${successCount} statements uitgevoerd, ${errorCount} errors)`);
    return errorCount === 0;
    
  } catch (error) {
    log.error(`Database setup gefaald: ${error.message}`);
    return false;
  }
}

// Spawn de hive-mind swarm voor facturatie
async function spawnInvoicingSwarm() {
  log.swarm('Spawning Hive Mind Facturatie Swarm...');
  
  const tasks = [
    {
      name: 'Database Schema Design',
      description: 'Design and implement invoice/quote database structure with relationships',
      agents: ['system-architect', 'backend-dev'],
      priority: 'critical'
    },
    {
      name: 'API Development', 
      description: 'Build REST APIs for quotes, invoices, payments, and products',
      agents: ['api-architect', 'backend-dev', 'tester'],
      priority: 'high'
    },
    {
      name: 'Frontend Components',
      description: 'Create React components for invoice/quote creation and management',
      agents: ['frontend-dev', 'ui-designer', 'reviewer'],
      priority: 'high'
    },
    {
      name: 'Deals Integration',
      description: 'Integrate invoicing with existing Deals pipeline for quote tracking',
      agents: ['integration-specialist', 'backend-dev'],
      priority: 'high'
    },
    {
      name: 'PDF Generation',
      description: 'Implement PDF generation for professional invoices and quotes',
      agents: ['backend-dev', 'pdf-specialist'],
      priority: 'medium'
    },
    {
      name: 'Email Integration',
      description: 'Setup email sending for quotes/invoices with tracking',
      agents: ['email-specialist', 'backend-dev'],
      priority: 'medium'
    },
    {
      name: 'Testing & QA',
      description: 'Comprehensive testing of invoice workflow and calculations',
      agents: ['qa-engineer', 'tester', 'reviewer'],
      priority: 'high'
    }
  ];
  
  const swarmCommand = [
    'npx', 'claude-flow@alpha', 'hive-mind', 'spawn',
    config.swarmObjective,
    '--agents', '8',
    '--topology', 'hierarchical',
    '--auto-spawn',
    '--mode', 'development',
    '--framework', 'nextjs',
    '--style', 'systematic'
  ];
  
  return new Promise((resolve, reject) => {
    const swarmProcess = spawn(swarmCommand[0], swarmCommand.slice(1), {
      stdio: 'inherit',
      shell: true
    });
    
    swarmProcess.on('error', (error) => {
      log.error(`Swarm spawn error: ${error.message}`);
      reject(error);
    });
    
    swarmProcess.on('exit', (code) => {
      if (code === 0) {
        log.success('Hive Mind Swarm succesvol gestart!');
        resolve();
      } else {
        reject(new Error(`Swarm process exited with code ${code}`));
      }
    });
  });
}

// Progress monitoring
async function monitorProgress() {
  log.info('Monitoring swarm progress...');
  
  const checkInterval = setInterval(async () => {
    try {
      // Check swarm status via claude-flow
      const { stdout } = await execPromise('npx claude-flow@alpha hive-mind status --json');
      const status = JSON.parse(stdout);
      
      if (status.progress) {
        const progressBar = '█'.repeat(Math.floor(status.progress / 5)) + 
                          '░'.repeat(20 - Math.floor(status.progress / 5));
        process.stdout.write(`\r${colors.cyan}Progress: [${progressBar}] ${status.progress}%${colors.reset}`);
        
        if (status.progress >= 100) {
          clearInterval(checkInterval);
          console.log('\n');
          log.success('Facturatie systeem volledig geïmplementeerd!');
        }
      }
    } catch (error) {
      // Swarm might not be ready yet
    }
  }, 5000);
  
  // Stop monitoring after 30 minutes
  setTimeout(() => clearInterval(checkInterval), 30 * 60 * 1000);
}

// Helper om exec te promisify
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
};

// Main functie
async function main() {
  showHeader();
  
  try {
    // Stap 1: Check dependencies
    log.step('Checking dependencies...');
    try {
      await execPromise('npx claude-flow@alpha --version');
      log.success('Claude Flow gevonden');
    } catch (error) {
      log.error('Claude Flow niet geïnstalleerd. Run: npm install -g claude-flow@alpha');
      process.exit(1);
    }
    
    // Stap 2: Database setup
    log.step('Setting up database schema...');
    const dbSuccess = await executeSQLInSupabase();
    
    if (!dbSuccess) {
      log.warning('Database setup had enkele problemen. Check Supabase Dashboard.');
      log.info('Tip: Voer het SQL script handmatig uit in Supabase SQL Editor voor beste resultaten.');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Doorgaan met swarm spawn? (y/n): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        process.exit(0);
      }
    }
    
    // Stap 3: Spawn swarm
    await spawnInvoicingSwarm();
    
    // Stap 4: Monitor progress
    await monitorProgress();
    
    // Stap 5: Final instructions
    console.log(`
${colors.green}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              ✅ FACTURATIE SYSTEEM SETUP COMPLEET! ✅         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Wat is er aangemaakt:${colors.reset}
  • Database tabellen voor quotes, invoices, payments, products
  • Hive Mind swarm met 8 gespecialiseerde agents
  • API endpoints worden nu ontwikkeld
  • Frontend componenten in ontwikkeling
  • Deals integratie wordt geïmplementeerd

${colors.bright}Volgende stappen:${colors.reset}
  1. Check de swarm status:
     ${colors.cyan}npx claude-flow@alpha hive-mind status${colors.reset}
     
  2. Monitor de voortgang:
     ${colors.cyan}npx claude-flow@alpha hive-mind monitor${colors.reset}
     
  3. Resume de sessie indien nodig:
     ${colors.cyan}npx claude-flow@alpha hive-mind resume [session-id]${colors.reset}
     
  4. Start de development server:
     ${colors.cyan}npm run dev${colors.reset}

${colors.yellow}Let op:${colors.reset} De swarm draait op de achtergrond. 
Je kunt de terminal sluiten, de agents blijven werken!

${colors.bright}Happy Invoicing! 🎉${colors.reset}
`);
    
  } catch (error) {
    log.error(`Setup gefaald: ${error.message}`);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

// Start de setup
if (require.main === module) {
  main();
}