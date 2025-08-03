import Foundation
import JarvisCore

// MARK: - API Service Protocol
public protocol APIServiceProtocol {
    func fetchGoals() async throws -> [Goal]
    func createGoal(_ request: CreateGoalRequest) async throws -> Goal
    func updateGoal(_ id: String, request: UpdateGoalRequest) async throws -> Goal
    func deleteGoal(_ id: String) async throws
    
    func fetchLifeAreas() async throws -> [LifeArea]
    func createLifeArea(_ request: CreateLifeAreaRequest) async throws -> LifeArea
    func updateLifeArea(_ id: String, request: UpdateLifeAreaRequest) async throws -> LifeArea
    func deleteLifeArea(_ id: String) async throws
}

// MARK: - API Service Implementation
public class APIService: APIServiceProtocol {
    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?
    
    public init(baseURL: String = "http://localhost:3000/api/v1", session: URLSession = .shared) {
        guard let url = URL(string: baseURL) else {
            fatalError("Invalid base URL: \(baseURL)")
        }
        self.baseURL = url
        self.session = session
    }
    
    // MARK: - Authentication
    public func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    // MARK: - Goals API
    public func fetchGoals() async throws -> [Goal] {
        let request = try createRequest(endpoint: "goals", method: .GET)
        let (data, response) = try await session.data(for: request)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<[Goal]>.self, from: data)
        return apiResponse.data
    }
    
    public func createGoal(_ request: CreateGoalRequest) async throws -> Goal {
        let httpRequest = try createRequest(endpoint: "goals", method: .POST, body: request)
        let (data, response) = try await session.data(for: httpRequest)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<Goal>.self, from: data)
        return apiResponse.data
    }
    
    public func updateGoal(_ id: String, request: UpdateGoalRequest) async throws -> Goal {
        let httpRequest = try createRequest(endpoint: "goals/\(id)", method: .PUT, body: request)
        let (data, response) = try await session.data(for: httpRequest)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<Goal>.self, from: data)
        return apiResponse.data
    }
    
    public func deleteGoal(_ id: String) async throws {
        let request = try createRequest(endpoint: "goals/\(id)", method: .DELETE)
        let (_, response) = try await session.data(for: request)
        
        try validateResponse(response)
    }
    
    // MARK: - Life Areas API
    public func fetchLifeAreas() async throws -> [LifeArea] {
        let request = try createRequest(endpoint: "life-areas", method: .GET)
        let (data, response) = try await session.data(for: request)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<[LifeArea]>.self, from: data)
        return apiResponse.data
    }
    
    public func createLifeArea(_ request: CreateLifeAreaRequest) async throws -> LifeArea {
        let httpRequest = try createRequest(endpoint: "life-areas", method: .POST, body: request)
        let (data, response) = try await session.data(for: httpRequest)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<LifeArea>.self, from: data)
        return apiResponse.data
    }
    
    public func updateLifeArea(_ id: String, request: UpdateLifeAreaRequest) async throws -> LifeArea {
        let httpRequest = try createRequest(endpoint: "life-areas/\(id)", method: .PUT, body: request)
        let (data, response) = try await session.data(for: httpRequest)
        
        try validateResponse(response)
        
        let apiResponse = try JSONDecoder.api.decode(APIResponse<LifeArea>.self, from: data)
        return apiResponse.data
    }
    
    public func deleteLifeArea(_ id: String) async throws {
        let request = try createRequest(endpoint: "life-areas/\(id)", method: .DELETE)
        let (_, response) = try await session.data(for: request)
        
        try validateResponse(response)
    }
}

// MARK: - Private Helpers
private extension APIService {
    enum HTTPMethod: String {
        case GET = "GET"
        case POST = "POST"
        case PUT = "PUT"
        case DELETE = "DELETE"
    }
    
    func createRequest<T: Encodable>(endpoint: String, method: HTTPMethod, body: T? = nil) throws -> URLRequest {
        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder.api.encode(body)
        }
        
        return request
    }
    
    func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        case 429:
            throw APIError.rateLimited
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.httpError(httpResponse.statusCode)
        }
    }
}

// MARK: - API Models
public struct APIResponse<T: Codable>: Codable {
    public let success: Bool
    public let data: T
    public let meta: APIMetadata?
}

public struct APIMetadata: Codable {
    public let timestamp: String
    public let pagination: APIPagination?
}

public struct APIPagination: Codable {
    public let page: Int
    public let limit: Int
    public let total: Int
    public let hasMore: Bool
}

// MARK: - Request Models
public struct CreateGoalRequest: Codable {
    public let title: String
    public let description: String?
    public let goalType: GoalType
    public let targetValue: Int?
    public let targetUnit: String?
    public let deadline: Date?
    public let lifeAreaId: String?
    
    public init(title: String, description: String? = nil, goalType: GoalType = .numeric, targetValue: Int? = nil, targetUnit: String? = nil, deadline: Date? = nil, lifeAreaId: String? = nil) {
        self.title = title
        self.description = description
        self.goalType = goalType
        self.targetValue = targetValue
        self.targetUnit = targetUnit
        self.deadline = deadline
        self.lifeAreaId = lifeAreaId
    }
}

public struct UpdateGoalRequest: Codable {
    public let title: String?
    public let description: String?
    public let targetValue: Int?
    public let targetUnit: String?
    public let deadline: Date?
    public let status: GoalStatus?
    
    public init(title: String? = nil, description: String? = nil, targetValue: Int? = nil, targetUnit: String? = nil, deadline: Date? = nil, status: GoalStatus? = nil) {
        self.title = title
        self.description = description
        self.targetValue = targetValue
        self.targetUnit = targetUnit
        self.deadline = deadline
        self.status = status
    }
}

public struct CreateLifeAreaRequest: Codable {
    public let name: String
    public let type: LifeAreaType
    public let description: String?
    
    public init(name: String, type: LifeAreaType, description: String? = nil) {
        self.name = name
        self.type = type
        self.description = description
    }
}

public struct UpdateLifeAreaRequest: Codable {
    public let name: String?
    public let description: String?
    public let isActive: Bool?
    
    public init(name: String? = nil, description: String? = nil, isActive: Bool? = nil) {
        self.name = name
        self.description = description
        self.isActive = isActive
    }
}

// MARK: - API Errors
public enum APIError: Error, LocalizedError {
    case invalidResponse
    case unauthorized
    case notFound
    case rateLimited
    case serverError
    case httpError(Int)
    case networkUnavailable
    
    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized access"
        case .notFound:
            return "Resource not found"
        case .rateLimited:
            return "Too many requests, please try again later"
        case .serverError:
            return "Server error occurred"
        case .httpError(let code):
            return "HTTP error with status code: \(code)"
        case .networkUnavailable:
            return "Network unavailable"
        }
    }
}

// MARK: - JSON Coding Extensions
private extension JSONDecoder {
    static let api: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()
}

private extension JSONEncoder {
    static let api: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }()
}