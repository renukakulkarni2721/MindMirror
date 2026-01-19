import { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';

export default function AudioRecorder({ onRecordingComplete, maxDuration = 60, minDuration = 30 }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            setError(null);
            setPermissionDenied(false);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err) {
            console.error('Recording error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionDenied(true);
                setError('Microphone access is required to record your reflection.');
            } else {
                setError('Could not start recording. Please check your microphone.');
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            clearInterval(timerRef.current);
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const resetRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setError(null);
    };

    const handleSubmit = () => {
        if (audioBlob && onRecordingComplete) {
            onRecordingComplete(audioBlob, recordingTime);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (recordingTime / maxDuration) * 100;
    const isReady = audioBlob && recordingTime >= minDuration;

    return (
        <div className="audio-recorder">
            {error && (
                <div className="recorder-error">
                    <span>⚠️</span>
                    <p>{error}</p>
                    {permissionDenied && (
                        <button className="btn btn-secondary" onClick={startRecording}>
                            Try Again
                        </button>
                    )}
                </div>
            )}

            {!error && !audioUrl && (
                <div className="recorder-controls">
                    <div className={`record-button-container ${isRecording ? 'recording' : ''}`}>
                        <button
                            className={`record-button ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            {isRecording ? (
                                <span className="stop-icon">■</span>
                            ) : (
                                <span className="mic-icon">🎙️</span>
                            )}
                        </button>
                        {isRecording && <div className="pulse-ring"></div>}
                    </div>

                    <div className="recorder-info">
                        <span className="recording-time">{formatTime(recordingTime)}</span>
                        <span className="recording-hint">
                            {isRecording
                                ? `Recording... (${minDuration}s minimum)`
                                : 'Tap to start recording'}
                        </span>
                    </div>

                    {isRecording && (
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            <div
                                className="progress-marker"
                                style={{ left: `${(minDuration / maxDuration) * 100}%` }}
                                title="Minimum recording length"
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {audioUrl && (
                <div className="recorder-preview fade-in">
                    <div className="preview-header">
                        <span className="preview-icon">✅</span>
                        <span>Recording complete</span>
                    </div>

                    <audio controls src={audioUrl} className="audio-player" />

                    <div className="preview-info">
                        <span>Duration: {formatTime(recordingTime)}</span>
                        {recordingTime < minDuration && (
                            <span className="warning-text">
                                ⚠️ Recording should be at least {minDuration} seconds
                            </span>
                        )}
                    </div>

                    <div className="preview-actions">
                        <button className="btn btn-secondary" onClick={resetRecording}>
                            Record Again
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!isReady}
                        >
                            Submit Reflection
                        </button>
                    </div>
                </div>
            )}

            <p className="recorder-reassurance">
                🔒 No judgment. This is private.
            </p>
        </div>
    );
}
