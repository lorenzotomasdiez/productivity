# Test-Driven Development Strategy
## Jarvis Personal Life Management System

## TDD Philosophy & Approach

### Core TDD Principles
1. **Red-Green-Refactor Cycle**: Write failing test → Make it pass → Improve code
2. **Test First**: No production code without a failing test
3. **Minimal Code**: Write only enough code to make tests pass
4. **Continuous Refactoring**: Improve design while maintaining green tests
5. **Living Documentation**: Tests serve as executable documentation

### Testing Pyramid Structure

```
                   ┌─────────────────┐
                   │   E2E Tests     │ (10%)
                   │   UI Tests      │
                   └─────────────────┘
               ┌─────────────────────────┐
               │   Integration Tests     │ (20%)
               │   API Tests             │
               │   Database Tests        │
               └─────────────────────────┘
           ┌─────────────────────────────────┐
           │        Unit Tests               │ (70%)
           │   Business Logic               │
           │   Models, Services             │
           └─────────────────────────────────┘
```

## Backend TDD Strategy

### 1. Unit Tests (70% of test suite)

#### Technologies
- **Node.js/Express**: Jest + Supertest
- **Python/FastAPI**: pytest + httpx
- **Database**: In-memory SQLite for fast tests

#### Test Categories

**Model Tests** (`/tests/unit/models/`)
```javascript
// Example: Goal model tests
describe('Goal Model', () => {
  test('should calculate progress percentage correctly', () => {
    const goal = new Goal({
      target_value: 100,
      current_value: 25
    });
    expect(goal.getProgressPercentage()).toBe(25);
  });

  test('should validate required fields', () => {
    expect(() => new Goal({})).toThrow('Title is required');
  });
});
```

**Service Tests** (`/tests/unit/services/`)
```javascript
// Example: ProgressService tests
describe('ProgressService', () => {
  test('should update goal current_value when progress added', async () => {
    // Given
    const goal = await createTestGoal({ target_value: 100 });
    
    // When
    await ProgressService.addEntry({
      goal_id: goal.id,
      value: 25
    });
    
    // Then
    const updatedGoal = await Goal.findById(goal.id);
    expect(updatedGoal.current_value).toBe(25);
  });
});
```

**Utility Tests** (`/tests/unit/utils/`)
```javascript
// Example: DateUtils tests
describe('DateUtils', () => {
  test('should calculate streak correctly', () => {
    const dates = ['2025-01-01', '2025-01-02', '2025-01-03'];
    expect(DateUtils.calculateStreak(dates)).toBe(3);
  });
});
```

### 2. Integration Tests (20% of test suite)

#### Error Handling Tests (`/tests/unit/errors/`)
```javascript
// Example: Comprehensive error handling
describe('Error Handling', () => {
  describe('Network Errors', () => {
    test('should handle connection timeout gracefully', async () => {
      // Given
      mockHTTPClient.mockError(new Error('ECONNRESET'));
      
      // When
      const result = await apiService.fetchGoals();
      
      // Then
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.retryable).toBe(true);
      expect(errorLogger.logError).toHaveBeenCalledWith('NETWORK_ERROR', expect.any(Object));
    });
    
    test('should retry failed requests with exponential backoff', async () => {
      // Given
      let attempts = 0;
      mockHTTPClient.mockImplementation(() => {
        attempts++;
        if (attempts < 3) throw new Error('Network error');
        return { data: { goals: [] } };
      });
      
      // When
      const result = await apiService.fetchGoalsWithRetry();
      
      // Then
      expect(attempts).toBe(3);
      expect(result.success).toBe(true);
    });
  });
  
  describe('AI Service Errors', () => {
    test('should handle rate limiting from OpenAI', async () => {
      // Given
      mockAI.mockError({ status: 429, message: 'Rate limit exceeded' });
      
      // When
      const response = await AIService.generateResponse('test message');
      
      // Then
      expect(response.error).toBe('AI_RATE_LIMITED');
      expect(response.retryAfter).toBeGreaterThan(0);
      expect(response.fallbackResponse).toBeTruthy();
    });
    
    test('should handle invalid API key gracefully', async () => {
      // Given
      mockAI.mockError({ status: 401, message: 'Invalid API key' });
      
      // When
      const response = await AIService.generateResponse('test');
      
      // Then
      expect(response.error).toBe('AI_AUTHENTICATION_FAILED');
      expect(response.fallbackResponse).toBe('I\'m currently unavailable. Please try again later.');
      expect(alertService.notifyAdmin).toHaveBeenCalled();
    });
  });
  
  describe('Data Validation Errors', () => {
    test('should validate goal creation input', async () => {
      // Given
      const invalidGoal = { title: '', target_value: -1 };
      
      // When & Then
      await expect(GoalService.createGoal(invalidGoal)).rejects.toThrow('Validation failed');
      
      // Verify specific validation errors
      try {
        await GoalService.createGoal(invalidGoal);
      } catch (error) {
        expect(error.details).toContain('Title is required');
        expect(error.details).toContain('Target value must be positive');
      }
    });
    
    test('should handle database constraint violations', async () => {
      // Given
      const duplicateGoal = { title: 'Existing Goal', user_id: 'user123' };
      await Goal.create(duplicateGoal);
      
      // When & Then
      await expect(Goal.create(duplicateGoal)).rejects.toThrow('UNIQUE_CONSTRAINT_VIOLATION');
    });
  });
  
  describe('Authentication Errors', () => {
    test('should handle expired JWT tokens', async () => {
      // Given
      const expiredToken = 'expired.jwt.token';
      
      // When
      const response = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      // Then
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
      expect(response.body.error.message).toBe('Please refresh your token');
    });
    
    test('should handle Apple Sign In failures', async () => {
      // Given
      mockAppleAuth.mockError({ error: 'user_cancelled' });
      
      // When
      const result = await AuthService.signInWithApple('invalid_code');
      
      // Then
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('APPLE_AUTH_CANCELLED');
      expect(result.error.userMessage).toBe('Sign in was cancelled');
    });
  });
});
```

#### API Integration Tests (`/tests/integration/api/`)
```javascript
// Example: Goals API integration tests
describe('Goals API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await authenticateTestUser();
  });

  test('POST /api/v1/goals should create goal and return 201', async () => {
    // Given
    const goalData = {
      title: 'Read 50 books',
      goal_type: 'numeric',
      target_value: 50
    };

    // When
    const response = await request(app)
      .post('/api/v1/goals')
      .send(goalData)
      .expect(201);

    // Then
    expect(response.body.data.title).toBe('Read 50 books');
    
    // Verify in database
    const goal = await Goal.findById(response.body.data.id);
    expect(goal).toBeTruthy();
  });
});
```

#### Database Integration Tests (`/tests/integration/database/`)
```javascript
// Example: Database constraints and triggers
describe('Database Integration', () => {
  test('should automatically update goal current_value via trigger', async () => {
    // Given
    const goal = await createTestGoal({ target_value: 100 });
    
    // When
    await db.query(`
      INSERT INTO progress_entries (goal_id, user_id, value) 
      VALUES ($1, $2, $3)
    `, [goal.id, goal.user_id, 25]);
    
    // Then
    const result = await db.query('SELECT current_value FROM goals WHERE id = $1', [goal.id]);
    expect(result.rows[0].current_value).toBe(25);
  });
});
```

#### AI Service Integration Tests (`/tests/integration/ai/`)
```javascript
// Example: AI service integration
describe('AI Service Integration', () => {
  test('should generate contextual response using user data', async () => {
    // Given
    const user = await createTestUser();
    const goals = await createTestGoals(user.id, 3);
    
    // When
    const response = await AIService.generateResponse({
      user_id: user.id,
      message: 'How am I doing with my goals?'
    });
    
    // Then
    expect(response.content).toContain('goals');
    expect(response.context_data.goals_referenced).toHaveLength(3);
  });
});
```

### Python/FastAPI Tests (AI Service)

#### Unit Tests (`/tests/unit/ai/`)
```python
# Example: AI service unit tests
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient
from app.services.jarvis_ai import JarvisAI
from app.models.context import UserContext

class TestJarvisAI:
    def setup_method(self):
        self.jarvis = JarvisAI()
        self.mock_context = UserContext(
            user_id="test-user-123",
            goals=[{"title": "Read 50 books", "progress": 0.5}],
            recent_activities=["workout", "reading"]
        )
    
    @pytest.mark.asyncio
    async def test_generate_response_with_context(self):
        # Given
        user_message = "How am I doing with my reading goal?"
        
        # When
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = AsyncMock()
            mock_openai.return_value.choices = [
                MagicMock(message=MagicMock(content="You're halfway to your 50 books goal! Great progress on reading."))
            ]
            
            response = await self.jarvis.generate_response(user_message, self.mock_context)
        
        # Then
        assert "reading" in response.content.lower()
        assert response.context_data["goals_referenced"] == 1
        assert response.model_used == "gpt-4"
        mock_openai.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_context_preparation(self):
        # Given
        user_message = "What should I focus on today?"
        
        # When
        context_prompt = await self.jarvis._prepare_context_prompt(self.mock_context, user_message)
        
        # Then
        assert "Read 50 books" in context_prompt
        assert "50%" in context_prompt
        assert "recent activities: workout, reading" in context_prompt.lower()
    
    def test_validate_response_format(self):
        # Given
        raw_response = {
            "content": "Test response",
            "context_references": ["goal_123"]
        }
        
        # When
        validated = self.jarvis._validate_response(raw_response)
        
        # Then
        assert validated.content == "Test response"
        assert len(validated.context_data["referenced_entities"]) == 1

    @pytest.mark.asyncio
    async def test_handle_ai_errors(self):
        # Given
        user_message = "Test message"
        
        # When
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.side_effect = Exception("API Error")
            
            response = await self.jarvis.generate_response(user_message, self.mock_context)
        
        # Then
        assert response.error == "AI_SERVICE_ERROR"
        assert response.fallback_content is not None
```

#### Integration Tests (`/tests/integration/ai/`)
```python
# Example: AI service integration with real API
import pytest
from httpx import AsyncClient
from app.main import app
from app.services.jarvis_ai import JarvisAI
from tests.utils.test_data import create_test_user, create_test_goals

@pytest.mark.integration
class TestAIServiceIntegration:
    @pytest.mark.asyncio
    async def test_chat_endpoint_with_context(self):
        # Given
        async with AsyncClient(app=app, base_url="http://test") as client:
            user = await create_test_user()
            goals = await create_test_goals(user.id, 2)
            
            # When
            response = await client.post(
                f"/api/v1/chat/conversations",
                json={"message": "How are my goals progressing?"},
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            # Then
            assert response.status_code == 201
            data = response.json()
            assert "goals" in data["data"]["content"].lower()
            assert len(data["data"]["context_data"]["goals_referenced"]) == 2
    
    @pytest.mark.asyncio
    async def test_ai_research_automation(self):
        # Given
        research_prompt = "Find latest productivity techniques for goal setting"
        
        # When
        with patch('app.services.research_engine.conduct_research') as mock_research:
            mock_research.return_value = {
                "title": "Latest Goal Setting Techniques",
                "content": "SMART goals are effective...",
                "sources": ["https://example.com/article1"]
            }
            
            result = await JarvisAI.conduct_research(research_prompt)
        
        # Then
        assert result.title == "Latest Goal Setting Techniques"
        assert "SMART goals" in result.content
        assert len(result.sources) > 0

#### FastAPI Test Configuration (`/ai-service/tests/conftest.py`)
```python
import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.database import get_database
from app.models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_openai():
    with patch('openai.ChatCompletion.acreate') as mock:
        yield mock

@pytest.fixture
def test_db():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_database] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
```

### 3. End-to-End Tests (10% of test suite)

#### API E2E Tests (`/tests/e2e/`)
```javascript
// Example: Complete user flow
describe('Goal Management E2E', () => {
  test('complete goal lifecycle: create → track → complete', async () => {
    // 1. Create user
    const user = await createTestUser();
    
    // 2. Create goal
    const goalResponse = await request(app)
      .post('/api/v1/goals')
      .send({ title: 'Test Goal', target_value: 5 })
      .expect(201);
    
    // 3. Add progress entries
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post(`/api/v1/goals/${goalResponse.body.data.id}/progress`)
        .send({ value: 1 })
        .expect(201);
    }
    
    // 4. Check goal completion
    const completedGoal = await request(app)
      .get(`/api/v1/goals/${goalResponse.body.data.id}`)
      .expect(200);
    
    expect(completedGoal.body.data.status).toBe('completed');
  });
});
```

## Frontend TDD Strategy (Swift/SwiftUI)

### 1. Unit Tests (70%)

#### Technologies
- **XCTest**: Apple's testing framework
- **Quick/Nimble**: BDD-style testing (optional)
- **Combine Testing**: For reactive code
- **ViewInspector**: For SwiftUI view testing without UI automation
- **SnapshotTesting**: For visual regression testing
- **XCTest Performance**: For performance testing

#### Model Tests (`JarvisTests/Models/`)
```swift
// Example: Goal model tests
class GoalTests: XCTestCase {
    func testProgressPercentageCalculation() {
        // Given
        let goal = Goal(title: "Test", targetValue: 100, currentValue: 25)
        
        // When
        let percentage = goal.progressPercentage
        
        // Then
        XCTAssertEqual(percentage, 0.25, accuracy: 0.01)
    }
    
    func testGoalCompletion() {
        // Given
        let goal = Goal(title: "Test", targetValue: 10, currentValue: 10)
        
        // When & Then
        XCTAssertTrue(goal.isCompleted)
    }
}
```

#### Service Tests (`JarvisTests/Services/`)
```swift
// Example: API service tests
class APIServiceTests: XCTestCase {
    var apiService: APIService!
    var mockURLSession: MockURLSession!
    
    override func setUp() {
        mockURLSession = MockURLSession()
        apiService = APIService(urlSession: mockURLSession)
    }
    
    func testFetchGoalsSuccess() async throws {
        // Given
        let expectedGoals = [Goal(title: "Test Goal")]
        mockURLSession.mockData = try JSONEncoder().encode(GoalsResponse(data: expectedGoals))
        
        // When
        let goals = try await apiService.fetchGoals()
        
        // Then
        XCTAssertEqual(goals.count, 1)
        XCTAssertEqual(goals.first?.title, "Test Goal")
    }
}
```

#### ViewModel Tests (`JarvisTests/ViewModels/`)
```swift
// Example: Goals view model tests
class GoalsViewModelTests: XCTestCase {
    var viewModel: GoalsViewModel!
    var mockAPIService: MockAPIService!
    
    override func setUp() {
        mockAPIService = MockAPIService()
        viewModel = GoalsViewModel(apiService: mockAPIService)
    }
    
    func testLoadGoalsSuccess() async {
        // Given
        let expectedGoals = [Goal(title: "Test Goal")]
        mockAPIService.mockGoals = expectedGoals
        
        // When
        await viewModel.loadGoals()
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 1)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }
    
    func testAddGoalUpdatesState() async {
        // Given
        let newGoal = Goal(title: "New Goal")
        
        // When
        await viewModel.addGoal(newGoal)
        
        // Then
        XCTAssertTrue(viewModel.goals.contains { $0.id == newGoal.id })
    }
    
    // ADDED: Error handling tests
    func testLoadGoalsHandlesNetworkError() async {
        // Given
        mockAPIService.shouldFailNextRequest = true
        mockAPIService.mockError = APIError.networkUnavailable
        
        // When
        await viewModel.loadGoals()
        
        // Then
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNotNil(viewModel.error)
        XCTAssertEqual(viewModel.error?.localizedDescription, "Network unavailable")
        XCTAssertTrue(viewModel.goals.isEmpty)
    }
}

#### Advanced SwiftUI Testing (`JarvisTests/Views/`)
```swift
// Example: SwiftUI view testing with ViewInspector
import ViewInspector
import SnapshotTesting

class GoalViewTests: XCTestCase {
    
    // ADDED: ViewInspector testing
    func testGoalViewDisplaysProgress() throws {
        // Given
        let goal = Goal(title: "Read 50 Books", targetValue: 50, currentValue: 25)
        let view = GoalView(goal: goal)
        
        // When
        let progressView = try view.inspect().find(ProgressView.self)
        let titleText = try view.inspect().find(text: "Read 50 Books")
        
        // Then
        XCTAssertEqual(try progressView.progressValue(), 0.5, accuracy: 0.01)
        XCTAssertTrue(try titleText.exists())
    }
    
    func testGoalViewShowsCompletionState() throws {
        // Given
        let completedGoal = Goal(title: "Completed Goal", targetValue: 10, currentValue: 10)
        let view = GoalView(goal: completedGoal)
        
        // When
        let completionIcon = try view.inspect().find(viewWithAccessibilityIdentifier: "completion-checkmark")
        
        // Then
        XCTAssertTrue(try completionIcon.exists())
    }
    
    // ADDED: Snapshot testing
    func testGoalViewAppearance() {
        let goal = Goal(title: "Test Goal", targetValue: 100, currentValue: 75)
        let view = GoalView(goal: goal)
            .frame(width: 300, height: 100)
        
        assertSnapshot(matching: view, as: .image, named: "goal-view-75-percent")
    }
    
    func testGoalViewDarkModeAppearance() {
        let goal = Goal(title: "Dark Mode Goal", targetValue: 50, currentValue: 20)
        let view = GoalView(goal: goal)
            .frame(width: 300, height: 100)
            .preferredColorScheme(.dark)
        
        assertSnapshot(matching: view, as: .image, named: "goal-view-dark-mode")
    }
    
    // ADDED: Combine testing for reactive properties
    func testGoalViewReactsToProgressChanges() {
        // Given
        let goal = Goal(title: "Reactive Goal", targetValue: 100, currentValue: 25)
        let expectation = XCTestExpectation(description: "Progress updated")
        
        // When
        let cancellable = goal.$currentValue
            .dropFirst()
            .sink { newValue in
                XCTAssertEqual(newValue, 50)
                expectation.fulfill()
            }
        
        goal.currentValue = 50
        
        // Then
        wait(for: [expectation], timeout: 1.0)
        cancellable.cancel()
    }
}
```

### 2. Integration Tests (20%)

#### API Integration Tests (`JarvisTests/Integration/`)
```swift
// Example: Real API integration tests
class APIIntegrationTests: XCTestCase {
    var apiService: APIService!
    
    override func setUp() {
        // Use test environment
        apiService = APIService(baseURL: TestConfig.apiBaseURL)
    }
    
    func testCreateAndFetchGoal() async throws {
        // Given
        let goalData = CreateGoalRequest(title: "Integration Test Goal")
        
        // When - Create goal
        let createdGoal = try await apiService.createGoal(goalData)
        
        // Then - Fetch and verify
        let fetchedGoals = try await apiService.fetchGoals()
        let foundGoal = fetchedGoals.first { $0.id == createdGoal.id }
        
        XCTAssertNotNil(foundGoal)
        XCTAssertEqual(foundGoal?.title, "Integration Test Goal")
        
        // Cleanup
        try await apiService.deleteGoal(createdGoal.id)
    }
}
```

### 3. UI Tests (10%)

#### SwiftUI View Tests (`JarvisUITests/`)
```swift
// Example: UI flow tests
class GoalManagementUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        app = XCUIApplication()
        app.launchEnvironment["UI_TESTING"] = "1"
        app.launch()
    }
    
    func testCreateGoalFlow() {
        // Navigate to goals
        app.tabBars.buttons["Goals"].tap()
        
        // Tap add button
        app.navigationBars.buttons["Add"].tap()
        
        // Fill form
        app.textFields["Goal Title"].tap()
        app.textFields["Goal Title"].typeText("Test UI Goal")
        
        app.textFields["Target Value"].tap()
        app.textFields["Target Value"].typeText("10")
        
        // Save goal
        app.buttons["Save"].tap()
        
        // Verify goal appears in list
        XCTAssertTrue(app.staticTexts["Test UI Goal"].exists)
    }
}
```

## Test Data Management

### Test Fixtures (`/tests/fixtures/`)

#### User Fixtures
```javascript
// /tests/fixtures/users.js
export const testUsers = {
  lorenzo: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'lorenzo.test@example.com',
    name: 'Lorenzo Test',
    apple_id: 'test_apple_id'
  }
};
```

#### Goal Fixtures
```javascript
// /tests/fixtures/goals.js
export const testGoals = {
  workoutGoal: {
    title: 'Workout 4 times per week',
    goal_type: 'habit',
    target_value: 4,
    target_unit: 'workouts/week'
  },
  readingGoal: {
    title: 'Read 24 books',
    goal_type: 'numeric',
    target_value: 24,
    target_unit: 'books'
  }
};
```

### Test Database Setup

#### Database Test Utilities (`/tests/utils/database.js`)
```javascript
export class TestDatabase {
  static async setup() {
    // Create test database
    await this.createTestDatabase();
    
    // Run migrations
    await this.runMigrations();
    
    // Seed with base data
    await this.seedBaseData();
  }
  
  static async cleanup() {
    // Clear all test data
    await this.clearTestData();
  }
  
  static async seedTestUser(userData = {}) {
    const user = { ...testUsers.lorenzo, ...userData };
    return await User.create(user);
  }
}
```

## Mocking Strategy

### API Mocks (`/tests/mocks/`)

#### HTTP Client Mock
```javascript
// /tests/mocks/httpClient.js
export class MockHTTPClient {
  constructor() {
    this.responses = new Map();
  }
  
  mockResponse(url, method, response) {
    this.responses.set(`${method}:${url}`, response);
  }
  
  async request(url, options) {
    const key = `${options.method}:${url}`;
    const mockResponse = this.responses.get(key);
    
    if (mockResponse) {
      return mockResponse;
    }
    
    throw new Error(`No mock response for ${key}`);
  }
}
```

#### AI Service Mock
```javascript
// /tests/mocks/aiService.js
export class MockAIService {
  constructor() {
    this.responses = [];
  }
  
  mockResponse(prompt, response) {
    this.responses.push({ prompt, response });
  }
  
  async generateResponse(prompt) {
    const mock = this.responses.find(r => r.prompt.includes(prompt));
    return mock ? mock.response : { content: 'Mock AI response' };
  }
}
```

## Test Configuration

### Jest Configuration (`/backend/jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/migrations/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Swift Code Coverage Configuration

#### Xcode Coverage Settings
```bash
# Enable code coverage in Xcode scheme
# Edit Scheme → Test → Options → Code Coverage: ✓ Gather coverage for all targets

# Generate coverage reports via command line
xcodebuild test \
  -project Jarvis.xcodeproj \
  -scheme Jarvis \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -enableCodeCoverage YES

# Export coverage data
xcrun xccov view --report --json Jarvis.xcresult > coverage.json
```

#### Coverage Tools Integration
```yaml
# .github/workflows/ios-coverage.yml
name: iOS Coverage
on: [push, pull_request]

jobs:
  coverage:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests with coverage
        run: |
          xcodebuild test \
            -project ios/Jarvis.xcodeproj \
            -scheme Jarvis \
            -destination 'platform=iOS Simulator,name=iPhone 15' \
            -enableCodeCoverage YES \
            -resultBundlePath TestResults.xcresult
      
      - name: Generate coverage report
        run: |
          xcrun xccov view --report --json TestResults.xcresult > coverage.json
          xcrun xccov view --report TestResults.xcresult
      
      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: coverage.json
          flags: ios
```

### XCode Test Plans (`/ios/Jarvis.xctestplan`)
```json
{
  "configurations": [
    {
      "name": "Unit Tests",
      "testTargets": [
        {
          "target": {
            "containerPath": "Jarvis.xcodeproj",
            "identifier": "JarvisTests",
            "name": "JarvisTests"
          }
        }
      ],
      "codeCoverage": true,
      "codeCoverageTargets": [
        {
          "target": {
            "containerPath": "Jarvis.xcodeproj",
            "identifier": "Jarvis",
            "name": "Jarvis"
          }
        }
      ]
    },
    {
      "name": "Integration Tests", 
      "testTargets": [
        {
          "target": {
            "containerPath": "Jarvis.xcodeproj",
            "identifier": "JarvisIntegrationTests",
            "name": "JarvisIntegrationTests"
          }
        }
      ]
    },
    {
      "name": "Performance Tests",
      "testTargets": [
        {
          "target": {
            "containerPath": "Jarvis.xcodeproj",
            "identifier": "JarvisPerformanceTests",
            "name": "JarvisPerformanceTests"
          }
        }
      ]
    }
  ]
}
```

## CI/CD Testing Pipeline

### GitHub Actions (`/.github/workflows/test.yml`)
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
        
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend
        
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./backend

  ios-tests:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
          
      - name: Run iOS tests
        run: |
          xcodebuild test \
            -project ios/Jarvis.xcodeproj \
            -scheme Jarvis \
            -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'
```

## Test Automation Scripts

### Package.json Scripts (`/backend/package.json`)
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## TDD Development Workflow

### 1. Feature Development Process
```
1. Write failing acceptance test (E2E)
2. Write failing integration test (API)
3. Write failing unit test (smallest component)
4. Write minimal code to pass unit test
5. Refactor while keeping tests green
6. Move up the testing pyramid
7. All tests green = feature complete
```

### 2. Bug Fix Process
```
1. Write failing test that reproduces bug
2. Fix the minimum code to make test pass
3. Refactor if needed
4. Ensure all existing tests still pass
```

### 3. Refactoring Process
```
1. Ensure all tests are green
2. Make small refactoring changes
3. Run tests after each change
4. If red, revert and try smaller change
5. Continue until refactoring complete
```

## Testing Best Practices

### Test Writing Guidelines
1. **AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Focus on single behavior
3. **Descriptive Names**: Test name should describe expected behavior
4. **Independent Tests**: No test dependencies
5. **Fast Tests**: Unit tests should run in milliseconds
6. **Deterministic**: Same input = same output always

### Test Organization
```
/tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── external/
├── e2e/
├── fixtures/
├── mocks/
└── utils/
```

## Performance Testing Strategy

### Backend Performance Tests (`/tests/performance/`)
```javascript
// Example: API performance tests
describe('Performance Tests', () => {
  test('should handle 100 concurrent goal creations', async () => {
    // Given
    const goalData = { title: 'Performance Test Goal', target_value: 100 };
    const promises = Array(100).fill().map(() => 
      request(app).post('/api/v1/goals').send(goalData)
    );
    
    // When
    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;
    
    // Then
    expect(duration).toBeLessThan(5000); // 5 seconds max
    expect(responses.every(r => r.status === 201)).toBe(true);
  });
  
  test('should maintain response time under load', async () => {
    // Given
    const startTime = Date.now();
    
    // When - Simulate 50 users fetching goals simultaneously
    const promises = Array(50).fill().map(() => 
      request(app).get('/api/v1/goals').expect(200)
    );
    
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Then
    const avgResponseTime = totalTime / 50;
    expect(avgResponseTime).toBeLessThan(200); // 200ms average
  });
  
  test('should handle AI service timeouts gracefully', async () => {
    // Given
    const slowAIResponse = new Promise(resolve => 
      setTimeout(() => resolve({ content: 'Slow response' }), 10000)
    );
    mockAI.mockImplementation(() => slowAIResponse);
    
    // When
    const start = Date.now();
    const response = await request(app)
      .post('/api/v1/chat/conversations/123/messages')
      .send({ message: 'Test message' });
    const duration = Date.now() - start;
    
    // Then
    expect(duration).toBeLessThan(5000); // Should timeout before 5s
    expect(response.body.data.content).toBe('I\'m thinking, please wait...');
  });
});
```

### iOS Performance Tests (`JarvisPerformanceTests/`)
```swift
// Example: iOS performance tests
class JarvisPerformanceTests: XCTestCase {
    
    func testGoalListScrollingPerformance() {
        // Given
        let goals = (1...1000).map { Goal(title: "Goal \($0)", progress: Double($0) / 1000.0) }
        let viewModel = GoalsViewModel()
        viewModel.goals = goals
        
        // When & Then
        measure {
            let view = GoalListView(viewModel: viewModel)
            _ = view.body // Force view rendering
        }
    }
    
    func testDataSyncPerformance() {
        // Given
        let syncService = DataSyncService()
        let largeDataSet = generateTestData(count: 10000)
        
        // When & Then
        measure {
            syncService.syncToCloud(data: largeDataSet)
        }
    }
    
    func testCoreDataBatchInsertPerformance() {
        // Given
        let context = CoreDataStack.shared.context
        let goalData = (1...1000).map { ["title": "Goal \($0)", "targetValue": $0] }
        
        // When & Then
        measure {
            CoreDataStack.shared.batchInsertGoals(goalData)
        }
    }
}
```

### Load Testing with Artillery (`/tests/load/api-load-test.yml`)
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120 
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./load-test-processor.js"

scenarios:
  - name: "Goal Management Flow"
    weight: 70
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/v1/goals"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/v1/goals"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Load Test Goal {{ $randomInt(1, 1000) }}"
            target_value: "{{ $randomInt(10, 100) }}"
            
  - name: "AI Chat Flow"
    weight: 30
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.data.token"
              as: "token"
      - post:
          url: "/api/v1/chat/conversations"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            message: "How are my goals progressing?"
```

### Code Coverage Targets
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage  
- **Critical Paths**: 95%+ coverage
- **Overall Project**: 85%+ coverage
- **Performance Benchmarks**: All critical paths must meet SLA

### Coverage Enforcement
```javascript
// jest.config.js - Enforce coverage thresholds
module.exports = {
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/models/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

This comprehensive TDD strategy ensures robust, maintainable, and performant code with extensive test coverage across the entire Jarvis application stack, including advanced error handling, performance testing, and visual regression testing for SwiftUI components.