import Foundation

enum StoryLanguage {
    // Both targets receive the same App Group identifier from the project.
    static let defaults: UserDefaults? = {
        guard let group = Bundle.main.object(forInfoDictionaryKey: "StoryAppGroup") as? String else { return nil }
        return UserDefaults(suiteName: group)
    }()

    static var isChinese: Bool { defaults?.string(forKey: "captionLanguage") == "zh" }
}

struct Recording: Decodable {
    struct Caption: Decodable {
        let name: String
        let location: String
        let desc: String
    }

    let id: String
    let trimDB: Double?
    let file: String
    let zh: Caption
    let en: Caption

    func caption(chinese: Bool) -> Caption { chinese ? zh : en }

    // A top-level Resources directory makes codesign interpret an iOS app as
    // a different bundle layout. The widget bundles only the catalog at its root.
    static let contentDirectory = "Content/Resources"

    static func catalogData(in bundle: Bundle, subdirectory: String? = nil) throws -> Data {
        guard let url = bundle.url(forResource: "recordings", withExtension: "json", subdirectory: subdirectory) else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try Data(contentsOf: url)
    }
}
