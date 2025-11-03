# Contributing to EcoSort SmartWaste Backend

Thank you for your interest in contributing! This document provides guidelines and best practices for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request**

## 📋 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ecosort-backend.git
cd ecosort-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Setup database
npm run migrate
npm run seed

# Run in development mode
npm run dev
```

## 🎨 Code Style

We use ESLint and Prettier for consistent code formatting.

```bash
# Lint code
npm run lint

# Format code
npm run format
```

**Standards:**
- Use ES6+ features (async/await, arrow functions, destructuring)
- Follow Airbnb JavaScript Style Guide
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add JSDoc comments for exported functions

**Example:**
```javascript
/**
 * Calculate combined confidence from multimodal inputs
 * @param {Object} imageResult - Image classification result
 * @param {Object} audioResult - Audio transcription result
 * @returns {Object} Combined prediction with enhanced confidence
 */
async function combineMultimodalPredictions(imageResult, audioResult) {
  // Implementation
}
```

## 🧪 Testing Requirements

All contributions must include tests.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.js

# Run with coverage
npm test -- --coverage
```

**Test Guidelines:**
- Write unit tests for all new functions
- Add integration tests for API endpoints
- Maintain >80% code coverage
- Mock external API calls (Hugging Face, Firebase)
- Use descriptive test names

**Example:**
```javascript
describe('classifyImage', () => {
  it('should successfully classify an image and return normalized result', async () => {
    // Test implementation
  });
  
  it('should retry on 503 error and succeed', async () => {
    // Test implementation
  });
});
```

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(classify): add multimodal prediction combining

fix(feedback): resolve database locking issue on concurrent writes

docs(readme): update deployment instructions for Render

test(huggingface): add retry logic test cases
```

## 🔀 Pull Request Process

1. **Update documentation** if adding features
2. **Add tests** for new functionality
3. **Run linter and tests** before submitting
4. **Update CHANGELOG.md** with your changes
5. **Reference issues** in PR description

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## 🐛 Bug Reports

**Good bug reports include:**
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)
- Logs or error messages
- Screenshots if applicable

**Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Send POST request to /classify
2. Include image file over 10MB
3. See error

**Expected behavior**
Should return 413 error with helpful message

**Environment:**
- OS: Ubuntu 22.04
- Node: v18.16.0
- npm: 9.5.1

**Additional context**
Error logs, screenshots, etc.
```

## ✨ Feature Requests

**Good feature requests include:**
- Problem statement
- Proposed solution
- Alternative solutions considered
- Impact on existing features

## 🏗️ Architecture Guidelines

### Adding New Routes

1. Create route file in `routes/`
2. Add validation using express-validator
3. Use asyncHandler for error handling
4. Include rate limiting if needed
5. Add comprehensive tests

### Adding New Services

1. Create service file in `services/`
2. Export well-documented functions
3. Handle errors gracefully
4. Include retry logic for external APIs
5. Add unit tests with mocks

### Database Changes

1. Create Knex migration in `db/migrations/`
2. Update `database.js` with helper functions
3. Add seed data if needed
4. Document schema changes

## 🔒 Security

- **Never commit secrets** or API keys
- Use environment variables for sensitive data
- Validate and sanitize all inputs
- Follow OWASP security best practices
- Report security issues privately

## 📦 Dependencies

- **Adding dependencies**: Justify why needed
- **Update dependencies**: Test thoroughly
- **Security patches**: Apply promptly
- **Minimize bundle size**: Choose lightweight libraries

## 🌐 Internationalization

When adding user-facing messages:
- Use clear, concise language
- Avoid technical jargon
- Consider future i18n support

## 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for functions
- Include inline comments for complex logic
- Update API documentation for endpoint changes

## 🎯 Priority Areas

Looking for contributors in these areas:
- PostgreSQL adapter for production
- WebSocket support for real-time feedback
- Advanced analytics dashboard
- Performance optimizations
- Additional AI model integrations

## 🤝 Code Review

When reviewing:
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security issues
- Verify tests are comprehensive
- Suggest improvements, don't demand

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an Issue
- **Chat**: Join our community Discord (link)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to EcoSort SmartWaste! 🌱**
