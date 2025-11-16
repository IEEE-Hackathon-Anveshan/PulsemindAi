# 🤝 Contributing to PulseMind

Thank you for considering contributing to PulseMind! This document outlines the guidelines for contributing code, reporting issues, and improving documentation.

---

## 📋 Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Message Guidelines](#commit-message-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)
8. [Issue Reporting](#issue-reporting)

---

## Code of Conduct

### **Our Pledge**

We are committed to fostering a welcoming and inclusive community. All contributors are expected to:

- ✅ **Be respectful**: Treat everyone with kindness and empathy
- ✅ **Be constructive**: Provide helpful feedback and suggestions
- ✅ **Be inclusive**: Welcome diverse perspectives and backgrounds
- ✅ **Be patient**: Understand that everyone has different skill levels
- ❌ **No harassment**: Zero tolerance for discriminatory or offensive behavior
- ❌ **No toxicity**: Ironic given our project's focus, but absolutely no toxic behavior!

**Enforcement**: Violations will result in warnings, temporary bans, or permanent bans at maintainer discretion.

---

## How Can I Contribute?

### **1. Report Bugs**
Found a bug? Help us fix it!
- Use the **Bug Report** template in [GitHub Issues](https://github.com/IEEE-Hackathon-Anveshan/PulsemindAi/issues)
- Include reproduction steps, screenshots, and environment details

### **2. Suggest Features**
Have an idea to improve PulseMind?
- Use the **Feature Request** template in [GitHub Issues](https://github.com/IEEE-Hackathon-Anveshan/PulsemindAi/issues)
- Explain the problem and proposed solution

### **3. Improve Documentation**
Documentation is always a work in progress!
- Fix typos, add clarifications, or write tutorials
- Update README.md, SETUP.md, or ARCHITECTURE.md

### **4. Submit Code**
Ready to code? Follow the [Development Workflow](#development-workflow) below.

---

## Development Workflow

### **Step 1: Fork the Repository**
Click the **"Fork"** button on [GitHub](https://github.com/IEEE-Hackathon-Anveshan/PulsemindAi) to create your own copy.

### **Step 2: Clone Your Fork**
```bash
git clone https://github.com/YOUR_USERNAME/PulsemindAi.git
cd PulsemindAi
```

### **Step 3: Add Upstream Remote**
```bash
git remote add upstream https://github.com/IEEE-Hackathon-Anveshan/PulsemindAi.git
git fetch upstream
```

### **Step 4: Create a Branch**
Use descriptive names prefixed with type:
```bash
# For new features
git checkout -b feature/add-wellness-challenges

# For bug fixes
git checkout -b fix/oauth-redirect-error

# For documentation
git checkout -b docs/update-setup-guide
```

### **Step 5: Install Dependencies**
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### **Step 6: Set Up Environment**
```bash
# Copy example environment file
cp .env.example .env

# Fill in your credentials (see SETUP.md for detailed guide)
code .env
```

### **Step 7: Make Your Changes**
Edit files, add features, or fix bugs. Follow [Coding Standards](#coding-standards).

### **Step 8: Test Locally**
```bash
# Start backend
node server/server.js

# In another terminal, start frontend
npm run dev

# Open http://localhost:5173 and test your changes
```

### **Step 9: Commit Your Changes**
Follow [Commit Message Guidelines](#commit-message-guidelines):
```bash
git add .
git commit -m "feat: add wellness challenge feature"
```

### **Step 10: Push to Your Fork**
```bash
git push origin feature/add-wellness-challenges
```

### **Step 11: Open a Pull Request**
1. Go to your fork on GitHub
2. Click **"Compare & pull request"**
3. Fill in the PR template (see [Pull Request Process](#pull-request-process))
4. Submit!

---

## Coding Standards

### **General Principles**
- ✅ **Write clean, readable code**: Use meaningful variable/function names
- ✅ **Keep functions small**: Single Responsibility Principle
- ✅ **Comment complex logic**: Explain "why", not "what"
- ✅ **Follow existing patterns**: Match the style of surrounding code

---

### **TypeScript / React (Frontend)**

#### **1. Component Structure**
```tsx
// ✅ Good: Functional component with TypeScript
import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
  onUpdate: (data: UserData) => void;
}

const UserProfile: React.FC<Props> = ({ userId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch user data
  }, [userId]);

  return <div>...</div>;
};

export default UserProfile;
```

#### **2. Type Safety**
```tsx
// ❌ Bad: Using 'any'
const handleSubmit = (data: any) => { ... };

// ✅ Good: Explicit types
interface FormData {
  name: string;
  email: string;
  age: number;
}

const handleSubmit = (data: FormData) => { ... };
```

#### **3. Avoid Inline Styles**
```tsx
// ❌ Bad
<div style={{ color: 'red', fontSize: '16px' }}>...</div>

// ✅ Good: Use Tailwind classes
<div className="text-red-500 text-base">...</div>
```

#### **4. Use Hooks Properly**
```tsx
// ✅ Good: Dependencies array prevents stale closures
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ❌ Bad: Missing dependency (ESLint will warn)
useEffect(() => {
  fetchData(userId);
}, []);
```

---

### **Node.js / Express (Backend)**

#### **1. Async/Await Error Handling**
```javascript
// ✅ Good: Try-catch for async operations
app.post('/api/user', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### **2. Input Validation**
```javascript
// ✅ Good: Validate before processing
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, age } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (age < 13) {
    return res.status(400).json({ error: 'Must be 13 or older' });
  }
  
  // Proceed with signup
});
```

#### **3. RESTful Conventions**
- `GET /api/resource` - Get all
- `GET /api/resource/:id` - Get one
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Update (full)
- `PATCH /api/resource/:id` - Update (partial)
- `DELETE /api/resource/:id` - Delete

#### **4. Environment Variables**
```javascript
// ✅ Good: Never hardcode secrets
const JWT_SECRET = process.env.JWT_SECRET;

// ❌ Bad
const JWT_SECRET = 'my_secret_key_12345';
```

---

### **Database (MongoDB/Mongoose)**

#### **1. Schema Definitions**
```javascript
// ✅ Good: Explicit schema with validation
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  age: { 
    type: Number, 
    required: true, 
    min: 13 
  }
}, { timestamps: true });
```

#### **2. Error Handling**
```javascript
// ✅ Good: Handle duplicate key errors
try {
  await User.create(userData);
} catch (error) {
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  throw error;
}
```

---

### **ESLint**

We use ESLint to enforce code quality. Run before committing:

```bash
npm run lint
```

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

**Configuration**: See `eslint.config.js` for rules.

---

## Commit Message Guidelines

We follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting (no code change)
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding tests
- `chore`: Build process, dependencies

### **Examples**

**Feature:**
```
feat(chat): add voice input support for Pulse conversations

- Integrated Web Speech API for microphone input
- Added voice button to chat interface
- Handles browser compatibility fallbacks
```

**Bug Fix:**
```
fix(auth): resolve OAuth redirect loop on port-forwarded URLs

- Updated authorized origins to include tunnel domains
- Fixed redirect URI mismatch in Google OAuth flow
- Closes #42
```

**Documentation:**
```
docs(setup): add MongoDB Atlas troubleshooting steps

- Added IP whitelist instructions
- Clarified connection string format
- Included test connection command
```

**Chore:**
```
chore(deps): update Vite to v5.4.2

- Fixes security vulnerability CVE-2024-XXXX
- See https://github.com/vitejs/vite/releases/tag/v5.4.2
```

---

## Pull Request Process

### **Before Submitting**

1. ✅ **Test locally**: Ensure everything works on `localhost`
2. ✅ **Run linter**: `npm run lint` should pass
3. ✅ **Update docs**: If behavior changed, update README/SETUP/ARCHITECTURE
4. ✅ **Check commits**: Follow commit message guidelines
5. ✅ **Rebase on main**: Ensure no merge conflicts

```bash
git fetch upstream
git rebase upstream/main
```

### **PR Template**

When opening a PR, fill in:

```markdown
## Description
What does this PR do? Why is it needed?

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Documentation update

## Testing
How did you test this? What scenarios did you cover?

## Screenshots (if UI changes)
Before:
After:

## Checklist
- [ ] Code follows project style guidelines
- [ ] Lint passes (`npm run lint`)
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or documented in PR)
- [ ] Related issue linked (e.g., "Closes #42")
```

### **Review Process**

1. **Automated checks**: Linter and build must pass
2. **Code review**: Maintainer will review within 3-5 days
3. **Feedback**: Address comments by pushing new commits
4. **Approval**: Once approved, maintainer will merge
5. **Celebration**: Your contribution is live! 🎉

---

## Testing Guidelines

### **Manual Testing Checklist**

For frontend changes:
- [ ] Tested on Chrome, Firefox, Edge
- [ ] Tested on mobile viewport (responsive design)
- [ ] Tested logged-in and logged-out states
- [ ] No console errors

For backend changes:
- [ ] Tested all affected endpoints with Postman/curl
- [ ] Verified database updates
- [ ] Checked error handling (invalid inputs, missing tokens, etc.)
- [ ] No crashes in server logs

For Progressive Trust changes:
- [ ] Tested all 4 phases (ai-only, micro-therapy, community-readonly, full-access)
- [ ] Verified readiness score calculations
- [ ] Tested phase gating (blocked features should show lock message)

### **Future: Automated Tests**

We plan to add:
- **Unit tests**: Jest for backend logic
- **Integration tests**: Supertest for API endpoints
- **E2E tests**: Playwright for user flows

Contributions to test infrastructure are highly welcome!

---

## Issue Reporting

### **Bug Reports**

Use this template:

```markdown
## Bug Description
Clear description of the issue.

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Screenshots
(if applicable)

## Environment
- OS: Windows 11 / macOS Sonoma / Ubuntu 22.04
- Browser: Chrome 120 / Firefox 115 / Safari 17
- Node.js version: v18.17.0
- MongoDB version: 7.0.5

## Additional Context
Anything else? Error logs, network tab, etc.
```

### **Feature Requests**

Use this template:

```markdown
## Problem Description
What problem does this feature solve?

## Proposed Solution
How would this feature work?

## Alternative Solutions
Other approaches considered?

## Additional Context
Mockups, examples, related issues?
```

---

## 🌟 Recognition

All contributors will be:
- 🏆 Listed in README.md "Contributors" section (coming soon!)
- 🎖️ Acknowledged in release notes
- 💙 Eternally appreciated for improving mental wellness technology

---

## 📧 Questions?

Not sure about something? Ask!
- **GitHub Discussions**: [Start a discussion](https://github.com/IEEE-Hackathon-Anveshan/PulsemindAi/discussions)
- **Email**: karthik.b.college@gmail.com
- **Issue Comments**: Tag `@Kart-0010-0101` in any issue

---

**Thank you for contributing to PulseMind! Together, we're building a safer, smarter path to wellness. 💙**
