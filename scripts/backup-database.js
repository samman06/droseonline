#!/usr/bin/env node

/**
 * Automated Database Backup Script
 * 
 * Features:
 * - Backs up MongoDB database to compressed file
 * - Stores backups with timestamp
 * - Cleans up old backups (retention policy)
 * - Can be run manually or via cron job
 * - Supports local and remote storage
 * 
 * Usage:
 *   node scripts/backup-database.js
 * 
 * Cron Example (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/backup-database.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline',
  backupDir: process.env.BACKUP_STORAGE_PATH || path.join(__dirname, '../backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  enabled: process.env.BACKUP_ENABLED === 'true',
};

// Extract database name from MongoDB URI
function getDatabaseName() {
  const match = CONFIG.mongoUri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'droseonline';
}

// Format date for backup filename
function getBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `backup_${getDatabaseName()}_${timestamp}`;
}

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`✅ Created backup directory: ${CONFIG.backupDir}`);
  }
}

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

// Perform backup
async function performBackup() {
  console.log('🚀 Starting database backup...');
  console.log(`   Database: ${getDatabaseName()}`);
  console.log(`   Backup directory: ${CONFIG.backupDir}`);
  
  const backupName = getBackupFilename();
  const backupPath = path.join(CONFIG.backupDir, backupName);
  
  try {
    // Check if mongodump is installed
    try {
      await executeCommand('mongodump --version');
    } catch (error) {
      console.error('❌ mongodump not found!');
      console.error('   Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools');
      process.exit(1);
    }
    
    // Build mongodump command
    let command;
    
    if (CONFIG.mongoUri.includes('mongodb+srv://')) {
      // MongoDB Atlas or SRV connection
      command = `mongodump --uri="${CONFIG.mongoUri}" --out="${backupPath}"`;
    } else if (CONFIG.mongoUri.includes('mongodb://')) {
      // Standard MongoDB connection
      const dbName = getDatabaseName();
      const hostMatch = CONFIG.mongoUri.match(/mongodb:\/\/([^/]+)/);
      const host = hostMatch ? hostMatch[1] : 'localhost:27017';
      
      command = `mongodump --host="${host}" --db="${dbName}" --out="${backupPath}"`;
    } else {
      throw new Error('Invalid MongoDB URI format');
    }
    
    // Execute backup
    console.log('⏳ Creating backup...');
    const startTime = Date.now();
    
    await executeCommand(command);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Backup created successfully in ${duration}s`);
    
    // Compress backup
    console.log('⏳ Compressing backup...');
    const compressCommand = `tar -czf "${backupPath}.tar.gz" -C "${CONFIG.backupDir}" "${backupName}"`;
    await executeCommand(compressCommand);
    
    // Remove uncompressed backup
    await executeCommand(`rm -rf "${backupPath}"`);
    
    // Get backup file size
    const stats = fs.statSync(`${backupPath}.tar.gz`);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup compressed: ${sizeMB} MB`);
    console.log(`   File: ${backupName}.tar.gz`);
    
    return `${backupPath}.tar.gz`;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

// Clean up old backups
async function cleanOldBackups() {
  console.log('\n🧹 Cleaning old backups...');
  console.log(`   Retention policy: ${CONFIG.retentionDays} days`);
  
  try {
    const files = fs.readdirSync(CONFIG.backupDir);
    const now = Date.now();
    const maxAge = CONFIG.retentionDays * 24 * 60 * 60 * 1000;
    
    let deleted = 0;
    
    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.tar.gz')) {
        continue;
      }
      
      const filePath = path.join(CONFIG.backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
        console.log(`   Deleted: ${file} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
      }
    }
    
    if (deleted === 0) {
      console.log('   No old backups to delete');
    } else {
      console.log(`✅ Deleted ${deleted} old backup(s)`);
    }
    
  } catch (error) {
    console.error('⚠️  Error cleaning old backups:', error.message);
  }
}

// List existing backups
function listBackups() {
  try {
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
      console.log('\n📋 Existing backups:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
        console.log(`      Size: ${file.size}, Created: ${file.created}`);
      });
      console.log(`\n   Total: ${files.length} backup(s)`);
    } else {
      console.log('\n📋 No existing backups found');
    }
  } catch (error) {
    console.error('⚠️  Error listing backups:', error.message);
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Drose Online - Database Backup Script');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check if backups are enabled
  if (!CONFIG.enabled && process.env.BACKUP_ENABLED !== undefined) {
    console.log('⚠️  Backups are disabled in configuration');
    console.log('   Set BACKUP_ENABLED=true in .env to enable');
    process.exit(0);
  }
  
  try {
    // Ensure backup directory exists
    ensureBackupDir();
    
    // Perform backup
    await performBackup();
    
    // Clean old backups
    await cleanOldBackups();
    
    // List all backups
    listBackups();
    
    console.log('\n✅ Backup process completed successfully');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Backup process failed');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { performBackup, cleanOldBackups, listBackups };

