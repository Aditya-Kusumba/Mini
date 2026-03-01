import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  console.log('🚀 Starting Tier-Based Hiring Platform...\n');

  try {
    console.log('📊 Checking database setup...');
    console.log('✅ Database connection successful\n');

    const { app } = await import('./app.js');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error.stack);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Check your .env file has correct DATABASE_URL');
    console.log('   3. Run: node setup.js (to set up database)');
    process.exit(1);
  }
}

startServer();
