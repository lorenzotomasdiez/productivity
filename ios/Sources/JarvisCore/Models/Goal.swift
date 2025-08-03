import Foundation

/// Represents a user's goal in the Jarvis system
public struct Goal: Identifiable, Codable, Hashable {
    public let id: String
    public var title: String
    public var description: String?
    public var goalType: GoalType
    public var targetValue: Int?
    public var currentValue: Int
    public var targetUnit: String?
    public var deadline: Date?
    public var status: GoalStatus
    public var lifeAreaId: String?
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: String = UUID().uuidString,
        title: String,
        description: String? = nil,
        goalType: GoalType = .numeric,
        targetValue: Int? = nil,
        currentValue: Int = 0,
        targetUnit: String? = nil,
        deadline: Date? = nil,
        status: GoalStatus = .active,
        lifeAreaId: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.goalType = goalType
        self.targetValue = targetValue
        self.currentValue = currentValue
        self.targetUnit = targetUnit
        self.deadline = deadline
        self.status = status
        self.lifeAreaId = lifeAreaId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Goal Type
public enum GoalType: String, CaseIterable, Codable {
    case numeric = "numeric"
    case habit = "habit"
    case milestone = "milestone"
    case binary = "binary"
    
    public var displayName: String {
        switch self {
        case .numeric: return "Numeric"
        case .habit: return "Habit"
        case .milestone: return "Milestone"
        case .binary: return "Yes/No"
        }
    }
}

// MARK: - Goal Status
public enum GoalStatus: String, CaseIterable, Codable {
    case active = "active"
    case completed = "completed"
    case paused = "paused"
    case cancelled = "cancelled"
    
    public var displayName: String {
        switch self {
        case .active: return "Active"
        case .completed: return "Completed"
        case .paused: return "Paused"
        case .cancelled: return "Cancelled"
        }
    }
}

// MARK: - Goal Extensions
public extension Goal {
    /// Calculate progress percentage (0-100)
    var progressPercentage: Double {
        guard let targetValue = targetValue, targetValue > 0 else { return 0 }
        return min(Double(currentValue) / Double(targetValue) * 100, 100)
    }
    
    /// Check if goal is completed based on progress
    var isCompleted: Bool {
        switch goalType {
        case .numeric:
            guard let targetValue = targetValue else { return false }
            return currentValue >= targetValue
        case .binary:
            return currentValue > 0
        case .habit, .milestone:
            return status == .completed
        }
    }
    
    /// Days remaining until deadline
    var daysUntilDeadline: Int? {
        guard let deadline = deadline else { return nil }
        let calendar = Calendar.current
        let today = Date()
        return calendar.dateComponents([.day], from: today, to: deadline).day
    }
    
    /// Is deadline approaching (within 7 days)
    var isDeadlineApproaching: Bool {
        guard let days = daysUntilDeadline else { return false }
        return days <= 7 && days >= 0
    }
    
    /// Is deadline overdue
    var isOverdue: Bool {
        guard let days = daysUntilDeadline else { return false }
        return days < 0
    }
}