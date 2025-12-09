const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Material = require('../models/Material');
const Course = require('../models/Course');
const Group = require('../models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkMaterials() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allMaterials = await Material.find({})
      .populate('uploadedBy', 'fullName role')
      .populate('course', 'name code')
      .populate('groups', 'name code')
      .sort({ uploadedAt: -1 });
    
    console.log(`📊 TOTAL MATERIALS IN DB: ${allMaterials.length}\n`);

    if (allMaterials.length === 0) {
      console.log('❌ NO MATERIALS FOUND!\n');
      console.log('💡 Materials need to be created manually or via seed script\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Analysis
    let issues = [];
    const stats = {
      total: allMaterials.length,
      byType: {},
      byCategory: {},
      missingUploader: 0,
      missingFile: 0,
      missingCourse: 0,
      missingGroup: 0,
      brokenReferences: 0
    };

    console.log('🔍 ANALYZING MATERIALS...\n');

    for (const material of allMaterials) {
      // Count by type
      stats.byType[material.type] = (stats.byType[material.type] || 0) + 1;
      
      // Count by category
      if (material.category) {
        stats.byCategory[material.category] = (stats.byCategory[material.category] || 0) + 1;
      }

      // Check for issues
      if (!material.uploadedBy) {
        stats.missingUploader++;
        issues.push(`Material "${material.title}" has no uploader`);
      }

      if (!material.file && !material.link) {
        stats.missingFile++;
        issues.push(`Material "${material.title}" has no file or link`);
      }

      if (material.course && !material.course.name) {
        stats.brokenReferences++;
        issues.push(`Material "${material.title}" has broken course reference`);
      }

      if (material.groups) {
        material.groups.forEach(g => {
          if (!g || !g.name) {
            stats.brokenReferences++;
            issues.push(`Material "${material.title}" has broken group reference`);
          }
        });
      }
    }

    // Display Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Total Materials: ${stats.total}`);
    console.log('');

    console.log('📑 BY TYPE:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log('');

    if (Object.keys(stats.byCategory).length > 0) {
      console.log('📂 BY CATEGORY:');
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
      console.log('');
    }

    // Display Issues
    if (issues.length > 0) {
      console.log(`⚠️  ISSUES FOUND (${issues.length}):\n`);
      console.log(`   Missing Uploader: ${stats.missingUploader}`);
      console.log(`   Missing File/Link: ${stats.missingFile}`);
      console.log(`   Broken References: ${stats.brokenReferences}`);
      console.log('');

      if (issues.length <= 20) {
        console.log('📝 DETAILED ISSUES:');
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      } else {
        console.log(`📝 Showing first 20 issues:`);
        issues.slice(0, 20).forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
        console.log(`   ... and ${issues.length - 20} more`);
      }
      console.log('');
    } else {
      console.log('✅ NO ISSUES FOUND - All materials are valid!\n');
    }

    // Sample materials
    if (allMaterials.length > 0) {
      console.log('📋 SAMPLE MATERIALS (First 5):');
      allMaterials.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title}`);
        console.log(`      Type: ${m.type}`);
        console.log(`      Category: ${m.category || 'N/A'}`);
        console.log(`      Uploader: ${m.uploadedBy?.fullName || 'Unknown'} (${m.uploadedBy?.role || 'N/A'})`);
        console.log(`      Course: ${m.course?.name || 'N/A'}`);
        console.log(`      Groups: ${m.groups?.length || 0}`);
        console.log(`      Has File: ${m.file ? 'Yes' : 'No'}`);
        console.log(`      Has Link: ${m.link ? 'Yes' : 'No'}`);
        console.log(`      Uploaded: ${m.uploadedAt?.toLocaleString() || 'N/A'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMaterials();

