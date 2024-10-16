import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from 'assemblyai'; 

// Initialize the AssemblyAI client
const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLY_API! 
});

// Define the API route
export async function POST(req: NextRequest) {
    // Parse form data to get the uploaded file
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
        return NextResponse.json({ message: "Audio file is required." }, { status: 400 });
    }
    
    // Convert the File object to an ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the audio file to AssemblyAI
    const params = {
        audio: buffer,
        speaker_labels: true,
    };

    try {
        // Start transcription
        const transcript = await client.transcripts.transcribe(params);

        // Check for errors in the transcription response
        if (transcript.status === 'error') {
            console.error(`Transcription failed: ${transcript.error}`);
            return NextResponse.json({ message: `Transcription failed: ${transcript.error}` }, { status: 500 });
        }

        // Return the transcription text and speaker utterances
        const response = {
            text: transcript.text,
            utterances: transcript.utterances?.map((utterance) => ({
                speaker: utterance.speaker,
                text: utterance.text,
            })),
        };
        console.log(response.text)

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error("Error processing transcription:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
