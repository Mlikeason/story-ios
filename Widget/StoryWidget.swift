import SwiftUI
import WidgetKit

struct FieldEntry: TimelineEntry {
    let date: Date
    let recording: Recording?
    var chinese = StoryLanguage.isChinese
}

struct FieldProvider: TimelineProvider {
    private var recordings: [Recording] {
        guard let data = try? Recording.catalogData(in: .main) else { return [] }
        return (try? JSONDecoder().decode([Recording].self, from: data)) ?? []
    }

    func placeholder(in context: Context) -> FieldEntry { FieldEntry(date: .now, recording: recordings.first) }

    func getSnapshot(in context: Context, completion: @escaping (FieldEntry) -> Void) {
        completion(entry(at: .now, from: recordings))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FieldEntry>) -> Void) {
        let calendar = Calendar.current, collection = recordings, today = calendar.startOfDay(for: .now)
        let days = (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: today) }
        completion(Timeline(entries: days.map { entry(at: $0, from: collection) }, policy: .atEnd))
    }

    private func entry(at date: Date, from sounds: [Recording]) -> FieldEntry {
        let day = Calendar.current.ordinality(of: .day, in: .era, for: date) ?? 0
        return FieldEntry(date: date, recording: sounds.isEmpty ? nil : sounds[day % sounds.count])
    }
}

struct FieldFace: View {
    let entry: FieldEntry
    private var chinese: Bool { entry.chinese }

    var body: some View {
        let caption = entry.recording?.caption(chinese: chinese)
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text("Story.").font(.system(.headline, design: .serif).italic())
                Spacer()
                Image(systemName: "waveform").accessibilityHidden(true)
            }
            Spacer(minLength: 2)
            Text(caption?.name ?? "Story")
                .font(.system(.headline, design: .serif).weight(.medium))
                .lineLimit(2).minimumScaleFactor(0.8).layoutPriority(1)
                .accessibilityLabel((chinese ? "今日录音，" : "Daily recording, ") + (caption?.name ?? "Story"))
            if #available(iOSApplicationExtension 17.0, macOS 14.0, *), let sound = entry.recording {
                HStack(spacing: 8) {
                    Button(intent: PlayFieldRecording(sound.id)) {
                        Image(systemName: "play.fill").frame(minWidth: 44, minHeight: 44)
                    }
                    .accessibilityLabel(chinese ? "播放今日录音" : "Play daily recording")
                    Button(intent: PauseFieldRecording()) {
                        Image(systemName: "pause.fill").frame(minWidth: 44, minHeight: 44)
                    }
                    .accessibilityLabel(chinese ? "暂停播放" : "Pause playback")
                }
                .font(.headline)
                .buttonStyle(.plain)
            } else {
                Label(chinese ? "打开播放" : "Open to play", systemImage: "play.fill").font(.caption)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetURL(entry.recording.flatMap { URL(string: "story://recording/" + $0.id) })
        .accessibilityElement(children: .contain)
    }
}

@main
struct StoryWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "StoryDailyRecording", provider: FieldProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                FieldFace(entry: entry).containerBackground(for: .widget) { Color(red: 0.14, green: 0.22, blue: 0.18) }
                    .foregroundStyle(.white)
            } else {
                FieldFace(entry: entry).padding().background(Color.black).foregroundStyle(.white)
            }
        }
        .configurationDisplayName("Story · Field recordings")
        .description("A different field recording every day.")
        .supportedFamilies([.systemSmall])
    }
}
