import { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

export default function VoiceRecorder({ onTranscriptReady }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const isRecordingRef = useRef(false); // Track recording state to avoid stale closures

    const MAX_DURATION = 90; // 90 seconds
    const MIN_DURATION = 10; // 10 seconds

    useEffect(() => {
        // Check for Web Speech API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            let finalTranscript = '';

            recognition.onresult = (event) => {
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPiece = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPiece + ' ';
                    } else {
                        interim += transcriptPiece;
                    }
                }

                setTranscript(finalTranscript.trim());
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    // Ignore no-speech errors - continue recording through pauses
                    return;
                }
                if (event.error === 'not-allowed') {
                    setPermissionDenied(true);
                    setError('Microphone access is required to record your reflection.');
                    isRecordingRef.current = false;
                    setIsRecording(false);
                }
            };

            recognition.onend = () => {
                // Use ref to avoid stale closure - continue recording through pauses
                if (isRecordingRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Run only once on mount - don't recreate recognition

    const startRecording = async () => {
        try {
            setError(null);
            setPermissionDenied(false);
            setTranscript('');
            setInterimTranscript('');

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Start MediaRecorder (for audio meter/visualization)
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            // Start speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
            } else {
                setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            isRecordingRef.current = true; // Set ref
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= MAX_DURATION) {
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
        isRecordingRef.current = false; // Clear ref first

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
        setIsTranscribing(false);
    };

    const handleReset = () => {
        setTranscript('');
        setInterimTranscript('');
        setRecordingTime(0);
        setError(null);
        setIsTranscribing(false);
    };

    const handleSubmit = () => {
        if (transcript.trim() && onTranscriptReady) {
            onTranscriptReady(transcript.trim(), recordingTime);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (recordingTime / MAX_DURATION) * 100;
    const isReady = transcript.trim().length >= 20 && recordingTime >= MIN_DURATION;
    const currentTranscript = transcript + (interimTranscript ? ' ' + interimTranscript : '');

    return (
        <div className="voice-recorder">
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

            {!error && (!transcript || isRecording) && (
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
                                ? `Recording... (${MIN_DURATION}s minimum)`
                                : 'Tap to start voice recording'}
                        </span>
                    </div>

                    {isRecording && (
                        <>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                <div
                                    className="progress-marker"
                                    style={{ left: `${(MIN_DURATION / MAX_DURATION) * 100}%` }}
                                    title="Minimum recording length"
                                ></div>
                            </div>

                            {currentTranscript && (
                                <div className="live-transcript">
                                    <div className="transcript-label">Live Transcript:</div>
                                    <div className="transcript-text">
                                        {currentTranscript}
                                        <span className="transcript-cursor">|</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {transcript && !isRecording && (
                <div className="recorder-preview fade-in">
                    <div className="preview-header">
                        <span className="preview-icon">✅</span>
                        <span>Recording complete</span>
                    </div>

                    <div className="transcript-preview">
                        <div className="transcript-label">Your Transcript:</div>
                        <div className="transcript-box">
                            {transcript}
                        </div>
                    </div>

                    <div className="preview-info">
                        <span>Duration: {formatTime(recordingTime)}</span>
                        <span>Words: {transcript.split(' ').length}</span>
                        {recordingTime < MIN_DURATION && (
                            <span className="warning-text">
                                ⚠️ Recording should be at least {MIN_DURATION} seconds
                            </span>
                        )}
                    </div>

                    <div className="preview-actions">
                        <button className="btn btn-secondary" onClick={handleReset}>
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
                🔒 No judgment. This is private. Audio is never stored.
            </p>
        </div>
    );
}
