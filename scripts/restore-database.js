#!/usr/bin/env node

/**
 * Database Restore Script
 * 
 * Restores MongoDB database from backup file
 * 
 * Usage:
 *   node scripts/restore-database.js backup_droseonline_2025-10-27_14-30-00.tar.gz
 *   node scripts/restore-database.js latest
 * 
 * Options:
 *   - Provide backup filename
 *   - Use 'latest' to restore most recent backup
 *   - Use '--drop' flag to drop existing collections before restore
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuration
const CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline',
  backupDir: process.env.BACKUP_STORAGE_PATH || path.join(__dirname, '../backups'),
};

// Get backup filename from args
const args = process.argv.slice(2);
const backupFile = args[0];
const dropCollections = args.includes('--drop');

// Execute shell command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

// Get database name from URI
function getDatabaseName() {
  const match = CONFIG.mongoUri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'droseonline';
}

// Find latest backup
function findLatestBackup() {
  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup_') && f.endsWith('.tar.gz'))
    .map(f => ({
      name: f,
      path: path.join(CONFIG.backupDir, f),
      mtime: fs.statSync(path.join(CONFIG.backupDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  return files.length > 0 ? files[0].name : null;
}

// Confirm restore action
function confirmRestore(backupName) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n⚠️  WARNING: This will restore the database from backup');
    console.log(`   Backup: ${backupName}`);
    console.log(`   Database: ${getDatabaseName()}`);
    if (dropCollections) {
      console.log('   Mode: DROP existing collections before restore');
    } else {
      console.log('   Mode: Merge with existing data');
    }
    console.log('\n   This action may overwrite existing data!');
    
    rl.question('\n   Are you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Restore backup
async function restoreBackup(backupFilename) {
  console.log('🚀 Starting database restore...');
  console.log(`   Database: ${getDatabaseName()}`);
  console.log(`   Backup: ${backupFilename}`);
  
  const backupPath = path.join(CONFIG.backupDir, backupFilename);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  try {
    // Check if mongorestore is installed
    try {
      await executeCommand('mongorestore --version');
    } catch (error) {
      console.error('❌ mongorestore not found!');
      console.error('   Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools');
      process.exit(1);
    }
    
    // Extract backup
    console.log('⏳ Extracting backup...');
    const extractDir = path.join(CONFIG.backupDir, 'temp_restore');
    
    // Remove temp directory if exists
    if (fs.existsSync(extractDir)) {
      await executeCommand(`rm -rf "${extractDir}"`);
    }
    
    await executeCommand(`mkdir -p "${extractDir}"`);
    await executeCommand(`tar -xzf "${backupPath}" -C "${extractDir}"`);
    
    // Find extracted backup directory
    const extractedFiles = fs.readdirSync(extractDir);
    if (extractedFiles.length === 0) {
      throw new Error('No files found in backup archive');
    }
    
    const extractedBackupDir = path.join(extractDir, extractedFiles[0], getDatabaseName());
    
    if (!fs.existsSync(extractedBackupDir)) {
      throw new Error(`Database directory not found in backup: ${getDatabaseName()}`);
    }
    
    console.log('✅ Backup extracted');
    
    // Build mongorestore command
    let command;
    
    if (CONFIG.mongoUri.includes('mongodb+srv://') || CONFIG.mongoUri.includes('mongodb://')) {
      command = `mongorestore --uri="${CONFIG.mongoUri}"`;
    } else {
      throw new Error('Invalid MongoDB URI format');
    }
    
    // Add drop option if specified
    if (dropCollections) {
      command += ' --drop';
    }
    
    // Add database directory
    command += ` --db="${getDatabaseName()}" "${extractedBackupDir}"`;
    
    // Execute restore
    console.log('⏳ Restoring database...');
    if (dropCollections) {
      console.log('   (Dropping existing collections first)');
    }
    
    const startTime = Date.now();
    
    await executeCommand(command);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Database restored successfully in ${duration}s`);
    
    // Clean up temp directory
    console.log('⏳ Cleaning up...');
    await executeCommand(`rm -rf "${extractDir}"`);
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    
    // Clean up on error
    const extractDir = path.join(CONFIG.backupDir, 'temp_restore');
    if (fs.existsSync(extractDir)) {
      await executeCommand(`rm -rf "${extractDir}"`).catch(() => {});
    }
    
    throw error;
  }
}

// List available backups
function listAvailableBackups() {
  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup_') && f.endsWith('.tar.gz'))
    .map(f => {
      const filePath = path.join(CONFIG.backupDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  
  if (files.length > 0) {
    console.log('\n📋 Available backups:');
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
      console.log(`      Size: ${file.size}, Created: ${file.created}`);
    });
  } else {
    console.log('\n📋 No backups found');
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Drose Online - Database Restore Script');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check if backup directory exists
  if (!fs.existsSync(CONFIG.backupDir)) {
    console.error('❌ Backup directory not found:', CONFIG.backupDir);
    process.exit(1);
  }
  
  // If no backup file specified, show available backups
  if (!backupFile) {
    console.log('Usage: node scripts/restore-database.js <backup-file> [--drop]');
    console.log('   or: node scripts/restore-database.js latest [--drop]');
    listAvailableBackups();
    console.log('\nOptions:');
    console.log('   --drop  Drop existing collections before restore');
    console.log('\n═══════════════════════════════════════════════════════\n');
    process.exit(0);
  }
  
  try {
    // Determine which backup to restore
    let backupToRestore;
    
    if (backupFile === 'latest') {
      backupToRestore = findLatestBackup();
      if (!backupToRestore) {
        console.error('❌ No backups found');
        process.exit(1);
      }
      console.log(`Using latest backup: ${backupToRestore}`);
    } else {
      backupToRestore = backupFile;
    }
    
    // Confirm restore
    const confirmed = await confirmRestore(backupToRestore);
    
    if (!confirmed) {
      console.log('\n❌ Restore cancelled by user');
      console.log('═══════════════════════════════════════════════════════\n');
      process.exit(0);
    }
    
    // Perform restore
    await restoreBackup(backupToRestore);
    
    console.log('\n✅ Restore process completed successfully');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Restore process failed');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { restoreBackup, findLatestBackup, listAvailableBackups };

