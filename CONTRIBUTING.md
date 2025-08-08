# Contributing to the Lost and Found App

Thank you for your interest in contributing to the LostNoMore App! 🎉  
This document outlines the processes, expectations, and technical guidelines for contributing to the project—whether you're fixing bugs, improving documentation, or suggesting new features.

---

## 📌 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Types of Contributions We Welcome](#types-of-contributions-we-welcome)
3. [Getting Started (For Newcomers)](#getting-started-for-newcomers)
4. [Filing a Bug Report](#filing-a-bug-report)
5. [Suggesting a New Feature](#suggesting-a-new-feature)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Technical Requirements](#technical-requirements)
8. [Setting Up the Development Environment](#setting-up-the-development-environment)
9. [Project Vision & Roadmap](#project-vision--roadmap)
10. [Architecture Overview](#architecture-overview)
11. [Communication Guidelines](#communication-guidelines)

---

## 🧭 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

---

## ✅ Types of Contributions We Welcome

We welcome contributions of all kinds, including:

- 💻 Code (bug fixes, new features, performance improvements)
- 🐛 Bug reporting
- 📝 Documentation updates and improvements
- 📐 UI/UX suggestions
- 🔍 Testing and reviewing pull requests

We **do not** currently accept:

- Non-functional design overhauls without discussion
- Features unrelated to the lost and found use case

---

## 🌱 Getting Started (For Newcomers)

If you're new to contributing, look for issues labeled:

> `good first issue` or `help wanted`

These are well-suited for beginners and have extra guidance or a smaller scope.

---

## 🐞 Filing a Bug Report

To file a bug report:

1. Go to the [Issues tab](https://github.com/your-repo/issues).
2. Click **"New issue"** and choose **Bug Report**.
3. Include:
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (e.g., browser, device)

Please check for existing issues before creating a new one.

---

## 💡 Suggesting a New Feature

To suggest a feature:

1. Go to the [Issues tab](https://github.com/your-repo/issues).
2. Click **"New issue"** and choose **Feature Request**.
3. Explain:
   - What problem the feature solves
   - Why it’s valuable
   - Any ideas for how it might work

Discussion is encouraged in the comments.

---

## 🔃 Submitting a Pull Request

1. Fork the repository and clone it locally.
2. Create a new branch: `git checkout -b your-feature-name`
3. Make your changes (include tests if applicable).
4. Commit with a descriptive message: `git commit -m "Fix: handle empty form submissions"`
5. Push to your fork: `git push origin your-feature-name`
6. Open a pull request against the `main` branch.

### 🔍 What Happens Next?

- Two other contributors must review the written code.
- Feedback may be provided; you may need to revise your PR.
- If no additional changes are required, a contributor that is someone other than the last pusher needs to approve the changes to merge to the `main` branch on the shared repository.

---

## 🧪 Technical Requirements

- Follow our [Style Guidelines](./STYLE_GUIDE.md) *(create this file if needed)*.
- Include tests with all functional code changes.
- Ensure all existing tests pass (`npm test` or `pytest`, depending on stack).
- Use descriptive variable names and concise commit messages.

---

## 🛠️ Setting Up the Development Environment

1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/lost-and-found-app.git
   cd lost-and-found-app


## 🛠️ High Level Architecture Diagram

+--------------------+       +----------------------+       +------------------------+
|                    |       |                      |       |                        |
|    Frontend (Web)  | <---> |   Backend/API Server | <---> |   PostgreSQL + Firebase|
| React + Tailwind   |       | Node.js + Express    |       |   (Geo & metadata DB)  |
|                    |       |                      |       |                        |
+--------------------+       +----------------------+       +------------------------+
        |                              |                                  |
        |                              |                                  |
        v                              v                                  v
+--------------------+     +-----------------------+           +----------------------+
|   AWS S3 Bucket    | <-- |    Image Upload API   |           |  Elasticsearch       |
|  (Item photos)     |     |   (Presigned URLs)    |           |  (Search, Filters)   |
+--------------------+     +-----------------------+           +----------------------+

+-----------------------------------------+
| GitHub Actions (CI/CD)                  |
| - Linting, Tests, Builds, Deployment    |
+-----------------------------------------+

+-----------------------------------------+
| JWT Auth + UPI SSO (Trust badges)       |
| - Secure login, Identity verification   |
+-----------------------------------------+
