const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Announcement = require('./models/Announcement');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function publishAnnouncements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all draft announcements
    const drafts = await Announcement.find({ status: 'draft' });
    
    if (drafts.length === 0) {
      console.log('❌ No draft announcements found!\n');
      process.exit(0);
    }

    console.log(`📝 Found ${drafts.length} draft announcements\n`);
    console.log('📢 Publishing announcements...\n');

    let published = 0;
    const now = new Date();

    for (const announcement of drafts) {
      announcement.status = 'published';
      
      // Set publishAt to now if not set
      if (!announcement.publishAt) {
        announcement.publishAt = now;
      }
      
      // Set expiresAt to 30 days from now if not set
      if (!announcement.expiresAt) {
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + 30);
        announcement.expiresAt = expiryDate;
      }

      await announcement.save();
      published++;
      console.log(`✅ Published: ${announcement.title}`);
      console.log(`   Priority: ${announcement.priority}`);
      console.log(`   Type: ${announcement.type}`);
      console.log(`   Audience: ${announcement.audience}`);
      console.log(`   Publish Date: ${announcement.publishAt.toLocaleString()}`);
      console.log(`   Expires: ${announcement.expiresAt.toLocaleString()}`);
      console.log('');
    }

    console.log(`\n🎉 Successfully published ${published} announcements!\n`);

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

publishAnnouncements();

