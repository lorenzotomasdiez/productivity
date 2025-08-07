//
//  CoreDataError.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import Foundation

enum CoreDataError: Error, LocalizedError {
    case invalidData(String)
    case notFound(String)
    case fetchFailed(String)
    case saveFailed(String)
    case relationshipError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidData(let message):
            return "Invalid data: \(message)"
        case .notFound(let message):
            return "Not found: \(message)"
        case .fetchFailed(let message):
            return "Fetch failed: \(message)"
        case .saveFailed(let message):
            return "Save failed: \(message)"
        case .relationshipError(let message):
            return "Relationship error: \(message)"
        }
    }
    
    var failureReason: String? {
        switch self {
        case .invalidData:
            return "The provided data is invalid or incomplete"
        case .notFound:
            return "The requested entity could not be found"
        case .fetchFailed:
            return "Failed to fetch data from Core Data"
        case .saveFailed:
            return "Failed to save changes to Core Data"
        case .relationshipError:
            return "Failed to establish or modify relationship between entities"
        }
    }
}
