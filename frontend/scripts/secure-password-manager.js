#!/usr/bin/env node

/**
 * Secure Password Manager for Test Configuration
 * 
 * This script helps manage secure test passwords by:
 * 1. Generating cryptographically secure passwords
 * 2. Validating password strength
 * 3. Updating environment variables
 * 4. Rotating passwords regularly
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Password generation configuration
const PASSWORD_CONFIG = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: true // Exclude similar characters like 0, O, 1, l, etc.
};

// Generate a cryptographically secure password
const generateSecurePassword = (length = PASSWORD_CONFIG.length) => {
  const charset = (() => {
    let chars = '';
    
    if (PASSWORD_CONFIG.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (PASSWORD_CONFIG.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (PASSWORD_CONFIG.includeNumbers) chars += '0123456789';
    if (PASSWORD_CONFIG.includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (PASSWORD_CONFIG.excludeSimilar) {
      chars = chars.replace(/[0O1lI]/g, ''); // Remove similar characters
    }
    
    return chars;
  })();
  
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noWeakPatterns: !/(password|123456|test|admin|qwerty)/i.test(password),
    noRepeatingChars: !/(.)\1{2,}/.test(password)
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  return {
    isValid: passedChecks >= 6,
    score: Math.round((passedChecks / totalChecks) * 100),
    checks,
    passedChecks,
    totalChecks
  };
};

// Generate all required test passwords
const generateAllTestPasswords = () => {
  const passwordTypes = ['DEFAULT', 'WRONG', 'CORRECT', 'DIFFERENT'];
  const passwords = {};
  
  passwordTypes.forEach(type => {
    let password;
    let validation;
    
    // Generate password until it meets strength requirements
    do {
      password = generateSecurePassword();
      validation = validatePasswordStrength(password);
    } while (!validation.isValid);
    
    passwords[`TEST_${type}_PASSWORD`] = password;
    console.log(`✅ Generated ${type} password (strength: ${validation.score}%)`);
  });
  
  return passwords;
};

// Update .env file with new passwords
const updateEnvFile = (passwords) => {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envExamplePath)) {
    // Use env.example as template
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // Update or add password variables
  Object.entries(passwords).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  });
  
  // Write updated content
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated ${envPath}`);
};

// Main function
const main = () => {
  console.log('🔐 Secure Password Manager for Test Configuration\n');
  
  try {
    // Generate secure passwords
    console.log('Generating secure test passwords...');
    const passwords = generateAllTestPasswords();
    
    // Update .env file
    console.log('\nUpdating environment configuration...');
    updateEnvFile(passwords);
    
    console.log('\n🎉 Password generation completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated passwords in your .env file');
    console.log('2. Run your tests to ensure everything works correctly');
    console.log('3. Consider rotating these passwords regularly');
    console.log('4. Never commit the .env file to version control');
    
  } catch (error) {
    console.error('❌ Error generating passwords:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecurePassword,
  validatePasswordStrength,
  generateAllTestPasswords,
  updateEnvFile
};
