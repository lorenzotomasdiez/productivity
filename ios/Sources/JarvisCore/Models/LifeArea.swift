import Foundation

/// Represents a life area in the Jarvis system
public struct LifeArea: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var type: LifeAreaType
    public var description: String?
    public var configuration: [String: AnyCodable]
    public var isActive: Bool
    public var sortOrder: Int
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: String = UUID().uuidString,
        name: String,
        type: LifeAreaType,
        description: String? = nil,
        configuration: [String: AnyCodable] = [:],
        isActive: Bool = true,
        sortOrder: Int = 0,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.description = description
        self.configuration = configuration
        self.isActive = isActive
        self.sortOrder = sortOrder
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Life Area Type
public enum LifeAreaType: String, CaseIterable, Codable {
    case health = "health"
    case finance = "finance"
    case learning = "learning"
    case work = "work"
    case goals = "goals"
    case productivity = "productivity"
    case relationships = "relationships"
    case hobbies = "hobbies"
    case travel = "travel"
    case personal = "personal"
    
    public var displayName: String {
        switch self {
        case .health: return "Health & Wellness"
        case .finance: return "Finance"
        case .learning: return "Learning"
        case .work: return "Work"
        case .goals: return "Goals"
        case .productivity: return "Productivity"
        case .relationships: return "Relationships"
        case .hobbies: return "Hobbies"
        case .travel: return "Travel"
        case .personal: return "Personal"
        }
    }
    
    public var systemImageName: String {
        switch self {
        case .health: return "heart.fill"
        case .finance: return "dollarsign.circle.fill"
        case .learning: return "book.fill"
        case .work: return "briefcase.fill"
        case .goals: return "target"
        case .productivity: return "checkmark.circle.fill"
        case .relationships: return "person.2.fill"
        case .hobbies: return "gamecontroller.fill"
        case .travel: return "airplane"
        case .personal: return "person.fill"
        }
    }
}

// MARK: - AnyCodable Helper
public struct AnyCodable: Codable, Hashable {
    public let value: Any
    
    public init<T>(_ value: T?) {
        self.value = value ?? ()
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self.init(())
        } else if let bool = try? container.decode(Bool.self) {
            self.init(bool)
        } else if let int = try? container.decode(Int.self) {
            self.init(int)
        } else if let double = try? container.decode(Double.self) {
            self.init(double)
        } else if let string = try? container.decode(String.self) {
            self.init(string)
        } else if let array = try? container.decode([AnyCodable].self) {
            self.init(array.map { $0.value })
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            self.init(dictionary.mapValues { $0.value })
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "AnyCodable value cannot be decoded")
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case is Void:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(codingPath: container.codingPath, debugDescription: "AnyCodable value cannot be encoded")
            throw EncodingError.invalidValue(value, context)
        }
    }
    
    public func hash(into hasher: inout Hasher) {
        switch value {
        case let bool as Bool:
            hasher.combine(bool)
        case let int as Int:
            hasher.combine(int)
        case let double as Double:
            hasher.combine(double)
        case let string as String:
            hasher.combine(string)
        default:
            hasher.combine(0)
        }
    }
    
    public static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        switch (lhs.value, rhs.value) {
        case (let lhs as Bool, let rhs as Bool):
            return lhs == rhs
        case (let lhs as Int, let rhs as Int):
            return lhs == rhs
        case (let lhs as Double, let rhs as Double):
            return lhs == rhs
        case (let lhs as String, let rhs as String):
            return lhs == rhs
        default:
            return false
        }
    }
}