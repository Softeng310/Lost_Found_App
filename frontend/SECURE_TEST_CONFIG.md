# Secure Test Configuration

This document explains how to securely configure test credentials for the Lost & Found App test suite.

## 🔒 Security Overview

The test suite has been updated to use secure configuration management to prevent hardcoded passwords from being committed to version control.

## 📁 Configuration Files

### 1. Test Configuration (`src/config/test-config.js`)
- **Purpose**: Centralized test credentials and data
- **Status**: ❌ **NOT COMMITTED** (added to .gitignore)
- **Content**: Test passwords, emails, and user data

### 2. Environment Variables (`.env`)
- **Purpose**: Store actual test credentials
- **Status**: ❌ **NOT COMMITTED** (added to .gitignore)
- **Content**: Real test passwords and sensitive data

### 3. Environment Example (`env.example`)
- **Purpose**: Template for environment variables
- **Status**: ✅ **COMMITTED** (safe to share)
- **Content**: Example structure without real credentials

## 🚀 Setup Instructions

### Step 1: Create Environment File
```bash
# Copy the example file
cp env.example .env

# Edit .env with your actual test credentials
nano .env
```

### Step 2: Set Secure Test Passwords
```bash
# In your .env file, set strong test passwords:
TEST_DEFAULT_PASSWORD=your_secure_test_password_here
TEST_WRONG_PASSWORD=your_wrong_test_password_here
TEST_CORRECT_PASSWORD=your_correct_test_password_here
TEST_DIFFERENT_PASSWORD=your_different_test_password_here
TEST_EMAIL=test@example.com
TEST_USER_NAME=Test User
```

### Step 3: Create Test Configuration
```bash
# The test-config.js file will be created automatically
# It reads from environment variables with secure fallbacks
```

## 🔧 Configuration Details

### Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `TEST_DEFAULT_PASSWORD` | Default test password | `testPassword123!` |
| `TEST_WRONG_PASSWORD` | Wrong password for error tests | `wrongTestPassword456!` |
| `TEST_CORRECT_PASSWORD` | Correct password for success tests | `correctTestPassword789!` |
| `TEST_DIFFERENT_PASSWORD` | Different password for mismatch tests | `differentTestPassword012!` |
| `TEST_EMAIL` | Test email address | `test@example.com` |
| `TEST_USER_NAME` | Test user name | `Test User` |

### Test Data Factories
```javascript
// Create form data with secure credentials
import { createTestFormData, createTestLoginData } from './config/test-config';

const formData = createTestFormData(); // Uses environment variables
const loginData = createTestLoginData(); // Uses environment variables
```

## 🛡️ Security Best Practices

### ✅ Do's
- Use strong, unique passwords for testing
- Change test passwords regularly
- Use environment variables for all sensitive data
- Keep `.env` file out of version control
- Use different passwords for different test scenarios

### ❌ Don'ts
- Never commit real passwords to version control
- Don't use production passwords for testing
- Don't share `.env` files
- Don't use weak passwords like "password123"
- Don't hardcode credentials in test files

## 🔄 Password Rotation

### When to Change Passwords
- After any security incident
- When team members leave
- Quarterly as part of security maintenance
- When passwords are accidentally exposed

### How to Change Passwords
1. Update `.env` file with new passwords
2. Update any CI/CD environment variables
3. Notify team members of changes
4. Update documentation if needed

## 🧪 Running Tests

### Local Development
```bash
# Tests will automatically use environment variables
npm test

# Or run specific test files
npm test -- Login.test.js
npm test -- SignUp.test.js
```

### CI/CD Pipeline
```bash
# Set environment variables in your CI/CD system
export TEST_DEFAULT_PASSWORD="ci_test_password_123!"
export TEST_WRONG_PASSWORD="ci_wrong_password_456!"
# ... etc
```

## 🔍 Verification

### Check Configuration
```bash
# Verify environment variables are loaded
node -e "console.log('Test email:', process.env.TEST_EMAIL)"
```

### Test Security
```bash
# Ensure no hardcoded passwords in committed files
grep -r "password123" src/ --exclude-dir=node_modules
# Should return no results
```

## 🆘 Troubleshooting

### Common Issues
1. **Tests failing**: Check that `.env` file exists and has correct values
2. **Environment variables not loading**: Restart your development server
3. **Configuration not found**: Ensure `src/config/test-config.js` exists

### Support
If you encounter issues with the secure configuration:
1. Check that all environment variables are set
2. Verify the `.env` file is in the correct location
3. Ensure the test configuration file is properly imported
4. Check the console for any configuration errors

## 📚 Additional Resources

- [Environment Variables Best Practices](https://12factor.net/config)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#processenv)
- [Jest Environment Setup](https://jestjs.io/docs/environment-setup)
