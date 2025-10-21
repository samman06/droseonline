/**
 * Test Script: Verify Login Works After Profile Update
 * 
 * This script tests that users can still login after updating their profile,
 * ensuring password is not accidentally modified during profile updates.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_EMAIL = 'sarah.johnson@droseonline.com';
const TEST_PASSWORD = 'password123';

async function runTest() {
  console.log('🧪 Testing: Login After Profile Update\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Initial Login
    console.log('\n1️⃣  Step 1: Initial Login');
    console.log('   Email:', TEST_EMAIL);
    console.log('   Password:', TEST_PASSWORD);
    
    const loginResponse1 = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse1.data.success) {
      console.log('   ❌ Initial login failed');
      return;
    }

    console.log('   ✅ Initial login successful');
    const token = loginResponse1.data.data.token;
    const user = loginResponse1.data.data.user;
    console.log('   User:', user.firstName, user.lastName);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Update Profile
    console.log('\n2️⃣  Step 2: Update Profile');
    console.log('   Updating firstName...');
    
    const updateResponse = await axios.put(
      `${BASE_URL}/auth/profile`,
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: TEST_EMAIL,
        phone: '01150230001'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!updateResponse.data.success) {
      console.log('   ❌ Profile update failed');
      console.log('   Error:', updateResponse.data.message);
      return;
    }

    console.log('   ✅ Profile updated successfully');
    console.log('   Updated user:', updateResponse.data.data.user.firstName);

    // Step 3: Login Again (The Critical Test!)
    console.log('\n3️⃣  Step 3: Login Again (Critical Test)');
    console.log('   Testing if password still works...');
    
    const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse2.data.success) {
      console.log('   ❌ FAILED: Cannot login after profile update!');
      console.log('   Error:', loginResponse2.data.message);
      console.log('\n   🚨 PASSWORD WAS MODIFIED DURING PROFILE UPDATE!');
      return;
    }

    console.log('   ✅ SUCCESS: Login still works after profile update!');
    console.log('   User:', loginResponse2.data.data.user.firstName, loginResponse2.data.data.user.lastName);

    // Final Result
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TEST PASSED: Profile update does not affect password');
    console.log('✅ Users can login after updating their profile');
    console.log('=' .repeat(60));

  } catch (error) {
    console.log('\n❌ ERROR:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🚨 CRITICAL: Password was modified during profile update!');
      console.log('   User cannot login with original password');
    }
    
    console.log('\nFull error:', error.response?.data || error.message);
  }
}

// Run the test
console.log('Starting test in 2 seconds...\n');
setTimeout(runTest, 2000);

