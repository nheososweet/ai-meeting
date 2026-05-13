"use client"

import { useMemo, useRef, useState } from "react"

type TranscriptItem = {
    speaker: string
    start: number
    end: number
    content: string
}

export default function AudioTranscriptTester() {
    const audioRef = useRef<HTMLAudioElement>(null)

    const [audioUrl, setAudioUrl] = useState<string>("")

    const [rawTranscript, setRawTranscript] = useState(`
Người 0 (0.08s - 7.6s): Tổng đài là hệ thống tiếp nhận và xử lý các cuộc gọi từ khách hàng nhằm hỗ trợ tư vấn giải đáp thắc mắc

Người 1 (8.2s - 14.5s): Hệ thống có thể ghi âm và lưu trữ toàn bộ nội dung cuộc gọi để phục vụ quản lý

Người 0 (15.0s - 22.8s): Ngoài ra tổng đài còn hỗ trợ phân phối cuộc gọi tự động đến từng bộ phận
`)

    // Parse transcript
    const transcripts = useMemo<TranscriptItem[]>(() => {
        return rawTranscript
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const match = line.match(
                    /(Người\s\d+)\s\(([\d.]+)s\s-\s([\d.]+)s\):\s(.+)/
                )

                if (!match) return null

                return {
                    speaker: match[1],
                    start: Number(match[2]),
                    end: Number(match[3]),
                    content: match[4]
                }
            })
            .filter(Boolean) as TranscriptItem[]
    }, [rawTranscript])

    // Upload audio
    const handleUploadAudio = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]

        if (!file) return

        const url = URL.createObjectURL(file)

        setAudioUrl(url)
    }

    // Play segment
    const playSegment = (start: number, end: number) => {
        const audio = audioRef.current

        if (!audio) return

        audio.pause()

        audio.currentTime = start

        audio.ontimeupdate = () => {
            if (audio.currentTime >= end) {
                audio.pause()
                audio.ontimeupdate = null
            }
        }

        audio.play()
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Audio Transcript Tester
                </h1>

                {/* Upload */}
                <div className="mb-6">
                    <label className="block font-semibold mb-2">
                        Upload Audio
                    </label>

                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleUploadAudio}
                        className="block w-full"
                    />
                </div>

                {/* Audio Player */}
                {audioUrl && (
                    <div className="mb-8">
                        <audio
                            ref={audioRef}
                            controls
                            preload="metadata"
                            src={audioUrl}
                            className="w-full"
                        >
                            Trình duyệt không hỗ trợ audio.
                        </audio>
                    </div>
                )}

                {/* Transcript Input */}
                <div className="mb-8">
                    <label className="block font-semibold mb-2">
                        Transcript Input
                    </label>

                    <textarea
                        value={rawTranscript}
                        onChange={(e) =>
                            setRawTranscript(e.target.value)
                        }
                        rows={10}
                        className="w-full border rounded-lg p-4 font-mono text-sm"
                    />
                </div>

                {/* Parsed Result */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Transcript Segments
                    </h2>

                    <div className="space-y-4">
                        {transcripts.map((item, index) => (
                            <div
                                key={index}
                                className="border rounded-xl p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="font-bold text-blue-600">
                                            {item.speaker}
                                        </span>

                                        <span className="ml-3 text-sm text-gray-500">
                                            {item.start}s → {item.end}s
                                        </span>
                                    </div>

                                    <button
                                        onClick={() =>
                                            playSegment(item.start, item.end)
                                        }
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-80"
                                    >
                                        Play Segment
                                    </button>
                                </div>

                                <p className="text-gray-700 leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}