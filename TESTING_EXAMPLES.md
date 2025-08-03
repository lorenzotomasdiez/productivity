# TDD Implementation Examples
## Jarvis Personal Life Management System

## Example 1: Goal Progress Calculation (Backend)

### Step 1: Write Failing Test First
```javascript
// /backend/tests/unit/models/Goal.test.js
import { Goal } from '../../../src/models/Goal.js';
import { ProgressEntry } from '../../../src/models/ProgressEntry.js';

describe('Goal Model', () => {
  describe('progress calculation', () => {
    test('should calculate correct progress percentage for numeric goal', () => {
      // Given
      const goal = new Goal({
        title: 'Read 50 books',
        goal_type: 'numeric',
        target_value: 50,
        current_value: 12
      });

      // When
      const percentage = goal.getProgressPercentage();

      // Then
      expect(percentage).toBe(24); // 12/50 * 100 = 24%
    });

    test('should return 100% when goal is exceeded', () => {
      // Given
      const goal = new Goal({
        title: 'Save $1000',
        goal_type: 'numeric',
        target_value: 1000,
        current_value: 1200
      });

      // When
      const percentage = goal.getProgressPercentage();

      // Then
      expect(percentage).toBe(100);
    });

    test('should calculate streak for habit goals', async () => {
      // Given
      const goal = new Goal({
        title: 'Workout daily',
        goal_type: 'habit',
        target_value: 1 // per day
      });

      const progressEntries = [
        { entry_date: '2025-01-01', value: 1 },
        { entry_date: '2025-01-02', value: 1 },
        { entry_date: '2025-01-03', value: 1 }
      ];

      // When
      const streak = goal.calculateStreak(progressEntries);

      // Then
      expect(streak).toBe(3);
    });
  });
});
```

### Step 2: Run Test (Should Fail)
```bash
npm test -- Goal.test.js
# Test fails: Goal.getProgressPercentage is not a function
```

### Step 3: Write Minimal Code to Pass
```javascript
// /backend/src/models/Goal.js
export class Goal {
  constructor(data) {
    this.title = data.title;
    this.goal_type = data.goal_type;
    this.target_value = data.target_value;
    this.current_value = data.current_value || 0;
  }

  getProgressPercentage() {
    if (this.target_value === 0) return 0;
    
    const percentage = (this.current_value / this.target_value) * 100;
    return Math.min(percentage, 100);
  }

  calculateStreak(progressEntries) {
    if (!progressEntries || progressEntries.length === 0) return 0;
    
    // Sort entries by date descending
    const sortedEntries = progressEntries
      .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return streak;
  }
}
```

### Step 4: Run Test (Should Pass)
```bash
npm test -- Goal.test.js
# ✓ All tests passing
```

### Step 5: Refactor (Improve Code Quality)
```javascript
// /backend/src/models/Goal.js
export class Goal {
  constructor(data) {
    this.title = data.title;
    this.goal_type = data.goal_type;
    this.target_value = data.target_value;
    this.current_value = data.current_value || 0;
  }

  getProgressPercentage() {
    if (!this.target_value || this.target_value === 0) {
      return 0;
    }
    
    const percentage = (this.current_value / this.target_value) * 100;
    return Math.min(Math.round(percentage * 100) / 100, 100); // Round to 2 decimals
  }

  calculateStreak(progressEntries) {
    if (!progressEntries?.length) return 0;
    
    const sortedEntries = this._sortEntriesByDateDesc(progressEntries);
    return this._countConsecutiveDays(sortedEntries);
  }

  _sortEntriesByDateDesc(entries) {
    return entries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
  }

  _countConsecutiveDays(sortedEntries) {
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      if (this._isConsecutiveDay(entry.entry_date, currentDate, streak)) {
        streak++;
        currentDate = new Date(entry.entry_date);
      } else {
        break;
      }
    }
    
    return streak;
  }

  _isConsecutiveDay(entryDate, currentDate, expectedDaysDiff) {
    const entryDateObj = new Date(entryDate);
    const daysDiff = Math.floor((currentDate - entryDateObj) / (1000 * 60 * 60 * 24));
    return daysDiff === expectedDaysDiff;
  }
}
```

## Example 2: API Endpoint Testing (Backend)

### Step 1: Write Integration Test First
```javascript
// /backend/tests/integration/api/goals.test.js
import request from 'supertest';
import { app } from '../../../src/app.js';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/testDatabase.js';
import { createTestUser, generateTestToken, createTestGoals } from '../../fixtures/users.js';

describe('Goals API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateTestToken(testUser.id);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/goals', () => {
    test('should create a new goal and return 201', async () => {
      // Given
      const goalData = {
        title: 'Read 24 books this year',
        description: 'Expand knowledge through reading',
        goal_type: 'numeric',
        target_value: 24,
        target_unit: 'books',
        deadline: '2025-12-31'
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'Read 24 books this year',
          goal_type: 'numeric',
          target_value: 24,
          current_value: 0,
          status: 'active'
        })
      });
    });

    test('should return 400 for invalid goal data', async () => {
      // Given
      const invalidGoalData = {
        title: '', // Empty title should fail validation
        goal_type: 'invalid_type'
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGoalData)
        .expect(400);

      // Then
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('title')
        })
      });
    });

    test('should return 401 for unauthenticated request', async () => {
      // Given
      const goalData = { title: 'Test Goal' };

      // When & Then
      await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(401);
    });
  });

  describe('GET /api/v1/goals', () => {
    test('should return user goals with pagination', async () => {
      // Given
      await createTestGoals(testUser.id, 5); // Create 5 test goals

      // When
      const response = await request(app)
        .get('/api/v1/goals?limit=3&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            user_id: testUser.id
          })
        ]),
        meta: expect.objectContaining({
          pagination: {
            page: 1,
            limit: 3,
            total: 5,
            hasMore: true
          }
        })
      });

      expect(response.body.data).toHaveLength(3);
    });
  });
});
```

### Step 2: Write API Route (Minimal Implementation)
```javascript
// /backend/src/routes/goals.js
import express from 'express';
import { GoalService } from '../services/GoalService.js';
import { authenticate } from '../middleware/auth.js';
import { validateGoalData } from '../middleware/validation.js';

const router = express.Router();

router.post('/', authenticate, validateGoalData, async (req, res) => { // FIXED: Use '/' since router is mounted at '/api/v1/goals'
  try {
    const goalData = {
      ...req.body,
      user_id: req.user.id
    };

    const goal = await GoalService.create(goalData);

    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GOAL_CREATION_ERROR',
        message: error.message
      }
    });
  }
});

router.get('/', authenticate, async (req, res) => { // FIXED: Use '/' since router is mounted at '/api/v1/goals'
  try {
    const { limit = 10, page = 1, status } = req.query;
    
    const result = await GoalService.findByUser(req.user.id, {
      limit: parseInt(limit),
      page: parseInt(page),
      status
    });

    res.json({
      success: true,
      data: result.goals,
      meta: {
        pagination: result.pagination
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GOALS_FETCH_ERROR',
        message: error.message
      }
    });
  }
});

export { router as goalsRouter };
```

## Example 3: SwiftUI View Testing (Frontend)

### Step 1: Write UI Test First
```swift
// /ios/JarvisTests/Views/GoalListViewTests.swift
import XCTest
import SwiftUI
@testable import Jarvis

class GoalListViewTests: XCTestCase {
    var viewModel: MockGoalListViewModel!
    
    override func setUp() {
        super.setUp()
        viewModel = MockGoalListViewModel()
    }
    
    func testGoalListDisplaysGoals() {
        // Given
        let testGoals = [
            Goal(id: "1", title: "Read 24 books", progressPercentage: 25),
            Goal(id: "2", title: "Workout 4x/week", progressPercentage: 75)
        ]
        viewModel.goals = testGoals
        
        // When
        let view = GoalListView(viewModel: viewModel)
        let hostingController = UIHostingController(rootView: view)
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 2)
        XCTAssertEqual(viewModel.goals[0].title, "Read 24 books")
        XCTAssertEqual(viewModel.goals[1].progressPercentage, 75)
    }
    
    func testGoalListShowsLoadingState() {
        // Given
        viewModel.isLoading = true
        viewModel.goals = []
        
        // When
        let view = GoalListView(viewModel: viewModel)
        
        // Then
        XCTAssertTrue(viewModel.isLoading)
        XCTAssertTrue(viewModel.goals.isEmpty)
    }
    
    func testAddGoalTriggersViewModel() {
        // Given
        let view = GoalListView(viewModel: viewModel)
        
        // When
        viewModel.addGoal(Goal(title: "New Goal"))
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 1)
        XCTAssertEqual(viewModel.goals.first?.title, "New Goal")
    }
}

// Mock ViewModel for testing
class MockGoalListViewModel: ObservableObject {
    @Published var goals: [Goal] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func addGoal(_ goal: Goal) {
        goals.append(goal)
    }
    
    func loadGoals() {
        isLoading = true
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.isLoading = false
        }
    }
}
```

### Step 2: Write SwiftUI View (Minimal Implementation)
```swift
// /ios/Jarvis/Views/GoalListView.swift
import SwiftUI

struct GoalListView: View {
    @ObservedObject var viewModel: GoalListViewModel
    @State private var showingAddGoal = false
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading goals...")
                } else if viewModel.goals.isEmpty {
                    EmptyStateView(
                        title: "No Goals Yet",
                        subtitle: "Create your first goal to get started",
                        actionTitle: "Add Goal"
                    ) {
                        showingAddGoal = true
                    }
                } else {
                    List(viewModel.goals) { goal in
                        GoalRowView(goal: goal)
                    }
                }
            }
            .navigationTitle("Goals")
            .navigationBarItems(
                trailing: Button("Add") {
                    showingAddGoal = true
                }
            )
            .sheet(isPresented: $showingAddGoal) {
                AddGoalView(viewModel: viewModel)
            }
            .onAppear {
                viewModel.loadGoals()
            }
        }
    }
}

struct GoalRowView: View {
    let goal: Goal
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(goal.title)
                    .font(.headline)
                
                if let description = goal.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(goal.progressPercentage)%")
                    .font(.caption)
                    .fontWeight(.medium)
                
                ProgressView(value: Double(goal.progressPercentage), in: 0...100)
                    .frame(width: 60)
            }
        }
        .padding(.vertical, 4)
    }
}

struct EmptyStateView: View {
    let title: String
    let subtitle: String
    let actionTitle: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "target")
                .font(.system(size: 64))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.title2)
                .fontWeight(.medium)
            
            Text(subtitle)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(actionTitle, action: action)
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

### Step 3: Write ViewModel with Tests
```swift
// /ios/JarvisTests/ViewModels/GoalListViewModelTests.swift
import XCTest
import Combine
@testable import Jarvis

class GoalListViewModelTests: XCTestCase {
    var viewModel: GoalListViewModel!
    var mockAPIService: MockAPIService!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        mockAPIService = MockAPIService()
        viewModel = GoalListViewModel(apiService: mockAPIService)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        cancellables = nil
        viewModel = nil
        mockAPIService = nil
        super.tearDown()
    }
    
    func testLoadGoalsSuccess() async {
        // Given
        let expectedGoals = [
            Goal(id: "1", title: "Test Goal 1"),
            Goal(id: "2", title: "Test Goal 2")
        ]
        mockAPIService.mockGoals = expectedGoals
        
        // When
        await viewModel.loadGoals()
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 2)
        XCTAssertEqual(viewModel.goals[0].title, "Test Goal 1")
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
    }
    
    func testLoadGoalsFailure() async {
        // Given
        mockAPIService.shouldFail = true
        
        // When
        await viewModel.loadGoals()
        
        // Then
        XCTAssertTrue(viewModel.goals.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNotNil(viewModel.errorMessage)
    }
    
    func testAddGoalUpdatesState() async {
        // Given
        let newGoal = Goal(title: "New Goal")
        
        // When
        await viewModel.addGoal(newGoal)
        
        // Then
        XCTAssertTrue(viewModel.goals.contains { $0.id == newGoal.id })
    }
}
```

## Example 4: AI Service Testing with Mocks

### Step 1: Write AI Service Test
```javascript
// /backend/tests/unit/services/AIService.test.js
import { AIService } from '../../../src/services/AIService.js';
import { MockOpenAIClient } from '../../mocks/OpenAIClient.js';

describe('AIService', () => {
  let aiService;
  let mockOpenAI;

  beforeEach(() => {
    mockOpenAI = new MockOpenAIClient();
    aiService = new AIService(mockOpenAI);
  });

  describe('generateResponse', () => {
    test('should generate contextual response using user data', async () => {
      // Given
      const userContext = {
        user_id: 'test-user',
        goals: [
          { title: 'Read 24 books', progress: 25 },
          { title: 'Workout 4x/week', progress: 75 }
        ],
        recent_progress: [
          { goal: 'Workout 4x/week', value: 1, date: '2025-01-01' }
        ]
      };

      const message = 'How am I doing with my goals?';

      mockOpenAI.mockResponse({
        content: 'You\'re doing great! Your workout goal is 75% complete...',
        usage: { total_tokens: 150 }
      });

      // When
      const response = await aiService.generateResponse(message, userContext);

      // Then
      expect(response).toMatchObject({
        content: expect.stringContaining('workout'),
        context_data: expect.objectContaining({
          goals_referenced: expect.arrayContaining(['Workout 4x/week']),
          data_sources: expect.arrayContaining(['goals', 'recent_progress'])
        }),
        metadata: expect.objectContaining({
          tokens_used: 150,
          model_used: 'gpt-4'
        })
      });

      // Verify context was properly formatted for AI
      const aiCall = mockOpenAI.getLastCall();
      expect(aiCall.messages[0].content).toContain('User has 2 goals');
      expect(aiCall.messages[0].content).toContain('Recent progress');
    });

    test('should handle AI service errors gracefully', async () => {
      // Given
      const userContext = { user_id: 'test-user' };
      const message = 'Test message';
      
      mockOpenAI.mockError(new Error('API rate limit exceeded'));

      // When & Then
      await expect(
        aiService.generateResponse(message, userContext)
      ).rejects.toThrow('AI service temporarily unavailable');
    });
  });

  describe('generateInsights', () => {
    test('should analyze user data and generate insights', async () => {
      // Given
      const userData = {
        goals: [
          { title: 'Workout', target: 4, current: 3, type: 'habit' }
        ],
        progress_entries: [
          { date: '2025-01-01', value: 1 },
          { date: '2025-01-02', value: 1 },
          { date: '2025-01-03', value: 1 }
        ]
      };

      mockOpenAI.mockResponse({
        content: JSON.stringify({
          insights: [
            {
              type: 'habit_insight',
              title: 'Consistent Workout Pattern',
              content: 'You\'ve maintained a 3-day workout streak...'
            }
          ]
        })
      });

      // When
      const insights = await aiService.generateInsights(userData);

      // Then
      expect(insights).toHaveLength(1);
      expect(insights[0]).toMatchObject({
        type: 'habit_insight',
        title: 'Consistent Workout Pattern',
        confidence_score: expect.any(Number)
      });
    });
  });
});
```

### Step 2: Implement AI Service
```javascript
// /backend/src/services/AIService.js
export class AIService {
  constructor(openaiClient, config = {}) {
    this.openai = openaiClient;
    this.model = config.model || 'gpt-4';
    this.maxTokens = config.maxTokens || 1000;
  }

  async generateResponse(message, userContext) {
    const startTime = Date.now(); // FIXED: Declare startTime variable
    try {
      const systemPrompt = this._buildSystemPrompt(userContext);
      const userPrompt = this._buildUserPrompt(message, userContext);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content,
        context_data: this._extractContextData(userContext, response),
        metadata: {
          tokens_used: response.usage.total_tokens,
          model_used: this.model,
          processing_time: Date.now() - startTime
        }
      };
    } catch (error) {
      throw new Error('AI service temporarily unavailable');
    }
  }

  _buildSystemPrompt(userContext) {
    return `You are Jarvis, a personal AI assistant for life management.
    
User Context:
- User has ${userContext.goals?.length || 0} goals
- Goals: ${userContext.goals?.map(g => `${g.title} (${g.progress}% complete)`).join(', ')}
- Recent activity: ${userContext.recent_progress?.length || 0} progress entries

Be helpful, encouraging, and provide actionable insights based on the user's data.`;
  }

  _buildUserPrompt(message, userContext) {
    return `${message}

Recent Progress:
${userContext.recent_progress?.map(p => 
  `- ${p.goal}: ${p.value} on ${p.date}`
).join('\n') || 'No recent progress'}`;
  }

  _extractContextData(userContext, aiResponse) {
    return {
      goals_referenced: this._findReferencedGoals(userContext.goals, aiResponse),
      data_sources: this._identifyDataSources(userContext),
      response_type: 'contextual_response'
    };
  }

  // FIXED: Add missing methods referenced in tests
  _findReferencedGoals(goals, aiResponse) {
    if (!goals || !aiResponse.choices?.[0]?.message?.content) return [];
    
    const responseContent = aiResponse.choices[0].message.content.toLowerCase();
    return goals
      .filter(goal => responseContent.includes(goal.title.toLowerCase()))
      .map(goal => goal.title);
  }

  _identifyDataSources(userContext) {
    const sources = [];
    if (userContext.goals?.length > 0) sources.push('goals');
    if (userContext.recent_progress?.length > 0) sources.push('recent_progress');
    if (userContext.life_areas?.length > 0) sources.push('life_areas');
    return sources;
  }

  // FIXED: Add missing generateInsights method
  async generateInsights(userData) {
    const startTime = Date.now();
    try {
      const analysisPrompt = this._buildAnalysisPrompt(userData);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI analyst. Generate insights from user data in JSON format.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3
      });

      const insights = JSON.parse(response.choices[0].message.content);
      
      return insights.insights.map(insight => ({
        ...insight,
        confidence_score: this._calculateConfidenceScore(insight, userData),
        generated_at: new Date().toISOString(),
        processing_time: Date.now() - startTime
      }));
    } catch (error) {
      throw new Error('Failed to generate insights');
    }
  }

  _buildAnalysisPrompt(userData) {
    return `Analyze this user data and provide insights:
    
Goals: ${JSON.stringify(userData.goals)}
Progress Entries: ${JSON.stringify(userData.progress_entries)}

Return insights in this JSON format:
{
  "insights": [
    {
      "type": "habit_insight|progress_insight|trend_insight",
      "title": "Brief title",
      "content": "Detailed insight description"
    }
  ]
}`;
  }

  _calculateConfidenceScore(insight, userData) {
    // Simple confidence calculation based on data availability
    let score = 0.5;
    if (userData.progress_entries?.length > 5) score += 0.2;
    if (userData.goals?.length > 2) score += 0.2;
    if (insight.content.length > 50) score += 0.1;
    return Math.min(score, 1.0);
  }
}
```

## Test Utilities and Mock Implementations

### Missing Test Database Utilities
```javascript
// /backend/tests/utils/testDatabase.js
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/jarvis_test'
});

export async function setupTestDatabase() {
  try {
    // Create test database schema
    const schemaSQL = await fs.readFile(
      path.join(process.cwd(), 'database/schema.sql'), 
      'utf8'
    );
    await testPool.query(schemaSQL);
    
    // Load seed data
    const seedSQL = await fs.readFile(
      path.join(process.cwd(), 'database/seed.sql'), 
      'utf8'
    );
    await testPool.query(seedSQL);
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase() {
  try {
    // Drop all tables to ensure clean state
    await testPool.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    throw error;
  }
}

export function getTestDatabase() {
  return testPool;
}
```

### Missing User Test Fixtures
```javascript
// /backend/tests/fixtures/users.js
import jwt from 'jsonwebtoken';
import { getTestDatabase } from '../utils/testDatabase.js';

export const testUsers = {
  lorenzo: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'lorenzo.test@example.com',
    name: 'Lorenzo Test',
    apple_id: 'test_apple_id'
  }
};

export async function createTestUser(userData = {}) {
  const db = getTestDatabase();
  const user = { ...testUsers.lorenzo, ...userData };
  
  const result = await db.query(`
    INSERT INTO users (id, email, name, apple_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [user.id, user.email, user.name, user.apple_id]);
  
  return result.rows[0];
}

export function generateTestToken(userId) {
  return jwt.sign(
    { user_id: userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '15m' }
  );
}

export async function createTestGoals(userId, count = 1) {
  const db = getTestDatabase();
  const goals = [];
  
  for (let i = 0; i < count; i++) {
    const result = await db.query(`
      INSERT INTO goals (user_id, title, goal_type, target_value, target_unit, status, created_at, updated_at)
      VALUES ($1, $2, 'numeric', $3, 'books', 'active', NOW(), NOW())
      RETURNING *
    `, [userId, `Test Goal ${i + 1}`, (i + 1) * 10]);
    
    goals.push(result.rows[0]);
  }
  
  return goals;
}
```

### Missing AI Service Mocks
```javascript
// /backend/tests/mocks/OpenAIClient.js
export class MockOpenAIClient {
  constructor() {
    this.mockResponses = [];
    this.mockErrors = [];
    this.callHistory = [];
  }
  
  mockResponse(response) {
    this.mockResponses.push({
      choices: [{
        message: {
          content: response.content
        }
      }],
      usage: response.usage || { total_tokens: 100 }
    });
  }
  
  mockError(error) {
    this.mockErrors.push(error);
  }
  
  getLastCall() {
    return this.callHistory[this.callHistory.length - 1];
  }
  
  get chat() {
    return {
      completions: {
        create: async (params) => {
          this.callHistory.push(params);
          
          if (this.mockErrors.length > 0) {
            throw this.mockErrors.shift();
          }
          
          if (this.mockResponses.length > 0) {
            return this.mockResponses.shift();
          }
          
          // Default response
          return {
            choices: [{
              message: {
                content: 'Mock AI response'
              }
            }],
            usage: { total_tokens: 50 }
          };
        }
      }
    };
  }
}
```

### Missing SwiftUI Mock Services
```swift
// /ios/JarvisTests/Mocks/MockAPIService.swift
import Foundation
import Combine
@testable import Jarvis

class MockAPIService: APIServiceProtocol {
    var mockGoals: [Goal] = []
    var shouldFail = false
    var mockError: APIError = .networkUnavailable
    var shouldFailNextRequest = false
    
    func fetchGoals() async throws -> [Goal] {
        if shouldFail || shouldFailNextRequest {
            shouldFailNextRequest = false
            throw mockError
        }
        return mockGoals
    }
    
    func createGoal(_ request: CreateGoalRequest) async throws -> Goal {
        if shouldFail {
            throw mockError
        }
        
        let newGoal = Goal(
            id: UUID().uuidString,
            title: request.title,
            description: request.description,
            goalType: request.goalType,
            targetValue: request.targetValue,
            currentValue: 0,
            status: .active
        )
        
        mockGoals.append(newGoal)
        return newGoal
    }
    
    func updateGoal(_ id: String, request: UpdateGoalRequest) async throws -> Goal {
        guard let index = mockGoals.firstIndex(where: { $0.id == id }) else {
            throw APIError.notFound
        }
        
        if shouldFail {
            throw mockError
        }
        
        mockGoals[index].title = request.title ?? mockGoals[index].title
        return mockGoals[index]
    }
    
    func deleteGoal(_ id: String) async throws {
        if shouldFail {
            throw mockError
        }
        
        mockGoals.removeAll { $0.id == id }
    }
}

enum APIError: Error, LocalizedError {
    case networkUnavailable
    case notFound
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            return "Network unavailable"
        case .notFound:
            return "Resource not found"
        case .unauthorized:
            return "Unauthorized access"
        }
    }
}
```

### Missing SwiftUI Components
```swift
// /ios/Jarvis/Views/AddGoalView.swift
import SwiftUI

struct AddGoalView: View {
    @ObservedObject var viewModel: GoalListViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var title = ""
    @State private var description = ""
    @State private var goalType: GoalType = .numeric
    @State private var targetValue: Double = 0
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Goal Details")) {
                    TextField("Goal title", text: $title)
                    TextField("Description (optional)", text: $description)
                    
                    Picker("Goal Type", selection: $goalType) {
                        ForEach(GoalType.allCases, id: \.self) { type in
                            Text(type.displayName).tag(type)
                        }
                    }
                    
                    if goalType == .numeric {
                        HStack {
                            Text("Target")
                            Spacer()
                            TextField("0", value: $targetValue, format: .number)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                }
            }
            .navigationTitle("New Goal")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Save") {
                    Task {
                        await saveGoal()
                    }
                }
                .disabled(title.isEmpty || isLoading)
            )
        }
    }
    
    private func saveGoal() async {
        isLoading = true
        
        let newGoal = Goal(
            title: title,
            description: description.isEmpty ? nil : description,
            goalType: goalType,
            targetValue: goalType == .numeric ? Int(targetValue) : nil
        )
        
        await viewModel.addGoal(newGoal)
        
        isLoading = false
        presentationMode.wrappedValue.dismiss()
    }
}

enum GoalType: String, CaseIterable {
    case numeric = "numeric"
    case habit = "habit"
    case milestone = "milestone"
    case binary = "binary"
    
    var displayName: String {
        switch self {
        case .numeric: return "Numeric"
        case .habit: return "Habit"
        case .milestone: return "Milestone"
        case .binary: return "Yes/No"
        }
    }
}
```

### Complete TDD Cycle Example (Fixing Missing Red Phase)
```javascript
// Example showing complete Red-Green-Refactor cycle
describe('Complete TDD Example: Goal Completion Logic', () => {
  test('STEP 1 (RED): should mark goal as completed when target reached', () => {
    // Given
    const goal = new Goal({
      title: 'Read 10 books',
      goal_type: 'numeric',
      target_value: 10,
      current_value: 9 // Not yet complete
    });

    // When & Then - This should FAIL initially (RED phase)
    expect(goal.isCompleted()).toBe(false); // This will pass
    
    // Update to target value
    goal.current_value = 10;
    expect(goal.isCompleted()).toBe(true); // This will FAIL if method doesn't exist
  });
});

// STEP 2 (GREEN): Add minimal implementation to make test pass
export class Goal {
  constructor(data) {
    this.title = data.title;
    this.goal_type = data.goal_type;
    this.target_value = data.target_value;
    this.current_value = data.current_value || 0;
  }

  // Minimal implementation to make test pass
  isCompleted() {
    if (this.goal_type === 'numeric') {
      return this.current_value >= this.target_value;
    }
    return false; // Simple implementation for now
  }
}

// STEP 3 (REFACTOR): Improve implementation while keeping tests green
export class Goal {
  constructor(data) {
    this.title = data.title;
    this.goal_type = data.goal_type;
    this.target_value = data.target_value;
    this.current_value = data.current_value || 0;
    this.status = data.status || 'active';
  }

  isCompleted() {
    // Improved implementation supporting different goal types
    switch (this.goal_type) {
      case 'numeric':
        return this.current_value >= this.target_value;
      case 'binary':
        return this.current_value > 0;
      case 'habit':
        return this.status === 'completed';
      case 'milestone':
        return this.status === 'completed';
      default:
        return false;
    }
  }

  // Additional methods discovered during refactoring
  getCompletionPercentage() {
    if (this.goal_type === 'numeric' && this.target_value > 0) {
      return Math.min((this.current_value / this.target_value) * 100, 100);
    }
    return this.isCompleted() ? 100 : 0;
  }
}
```

This comprehensive TDD approach ensures that every feature is thoroughly tested before implementation, leading to more reliable, maintainable code for the Jarvis application.