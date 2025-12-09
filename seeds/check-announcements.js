const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Announcement = require('./models/Announcement');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkAnnouncements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all announcements
    const allAnnouncements = await Announcement.find({})
      .populate('author', 'fullName role')
      .sort({ createdAt: -1 });
    
    console.log(`📊 TOTAL ANNOUNCEMENTS IN DB: ${allAnnouncements.length}\n`);

    if (allAnnouncements.length === 0) {
      console.log('❌ NO ANNOUNCEMENTS FOUND!');
      console.log('\n💡 Run seed script to create announcements:');
      console.log('   node seeds/seed-courses-assignments-announcements.js\n');
      process.exit(0);
    }

    // Group by status
    const byStatus = {};
    allAnnouncements.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    console.log('📈 BY STATUS:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    // Check published and active
    const now = new Date();
    const publishedQuery = {
      status: 'published',
      publishAt: { $lte: now },
      $or: [
        { expiresAt: { $gte: now } },
        { expiresAt: null }
      ]
    };

    const published = await Announcement.find(publishedQuery);
    console.log(`✅ PUBLISHED & ACTIVE: ${published.length}\n`);

    if (published.length > 0) {
      console.log('📝 PUBLISHED ANNOUNCEMENTS:');
      published.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title}`);
        console.log(`      Status: ${a.status}`);
        console.log(`      Priority: ${a.priority}`);
        console.log(`      Type: ${a.type}`);
        console.log(`      Audience: ${a.audience}`);
        console.log(`      Published: ${a.publishAt?.toLocaleString() || 'N/A'}`);
        console.log(`      Expires: ${a.expiresAt?.toLocaleString() || 'Never'}`);
        console.log(`      Pinned: ${a.isPinned ? 'Yes' : 'No'}`);
        console.log(`      Author: ${a.author?.fullName || 'Unknown'} (${a.author?.role || 'N/A'})`);
        console.log('');
      });
    }

    // Check drafts
    const drafts = await Announcement.find({ status: 'draft' });
    if (drafts.length > 0) {
      console.log(`📄 DRAFTS: ${drafts.length}`);
      drafts.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title} (by ${a.author?.fullName || 'Unknown'})`);
      });
      console.log('');
    }

    // Check scheduled
    const scheduled = await Announcement.find({ 
      status: 'scheduled',
      publishAt: { $gt: now }
    });
    if (scheduled.length > 0) {
      console.log(`⏰ SCHEDULED (Future): ${scheduled.length}`);
      scheduled.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title} - Publish on: ${a.publishAt.toLocaleString()}`);
      });
      console.log('');
    }

    // Check expired
    const expired = await Announcement.find({
      status: 'published',
      expiresAt: { $lt: now }
    });
    if (expired.length > 0) {
      console.log(`❌ EXPIRED: ${expired.length}`);
      expired.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title} - Expired: ${a.expiresAt.toLocaleString()}`);
      });
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAnnouncements();

