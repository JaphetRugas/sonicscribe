"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Copy, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function AudioTranscriber() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setTranscription(''); // Clear the transcription on new file upload
      setProgress(0); // Reset progress
      setError(null); // Reset error

      // Create a URL for the audio file for playback
      audioUrlRef.current = URL.createObjectURL(file);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setIsTranscribing(true);
    console.log("Transcribing:", audioFile);

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        setTranscription(data.text);
        toast({ description: "Transcription completed!" });
      } else {
        console.error(data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio file. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscript = () => {
    setTranscription('');
    setProgress(0);
    setAudioFile(null);
    audioUrlRef.current = null; // Clear the audio URL
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({ description: "Transcript cleared" });
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcription).then(() => {
      toast({ description: "Transcript copied to clipboard!" });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({ variant: "destructive", description: "Failed to copy transcript" });
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Audio Transcription App</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File upload input */}
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTranscribing}
              className="flex-1"
            >
              <Upload className="mr-2" /> Upload Audio
            </Button>
            
            {/* Show progress while transcribing */}
            {isTranscribing && <Progress value={progress} className="w-full" />}
            
            {/* Transcript display area */}
            <div className="bg-white p-4 rounded-md shadow min-h-[200px] max-h-[400px] overflow-y-auto">
              {transcription || 'Upload an audio file to see the transcription here...'}
            </div>

            {/* Error display */}
            {error && <p className="text-red-500">{error}</p>}
            
            {/* Audio playback */}
            {audioFile && (
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold">Playback Audio:</h3>
                <audio controls src={audioUrlRef.current!} className="w-full mt-2" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <Button onClick={handleTranscribe} disabled={!audioFile || isTranscribing} className="flex-1">
            Transcribe
          </Button>
          <Button onClick={clearTranscript} variant="outline" className="flex-1" disabled={isTranscribing || !transcription}>
            <Trash2 className="mr-2" /> Clear
          </Button>
          <Button onClick={copyTranscript} variant="outline" className="flex-1" disabled={!transcription}>
            <Copy className="mr-2" /> Copy
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
