import { Component, signal } from '@angular/core';
import { SttService } from '../../services/stt.service';

@Component({
  selector: 'app-stt',
  standalone: true,
  templateUrl: './stt.html',
  styleUrl: './stt.css',
})
export class SttComponent {
  mediaRecorder!: MediaRecorder;

  audioChunks: Blob[] = [];

  isRecording = signal(false);
  isTranscribing = signal(false);

  transcript = signal('');

  constructor(private sttService: SttService) {}

  async startRecording() {
    try {
      this.transcript.set('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      this.audioChunks = [];

      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm',
        });

        // Stop microphone
        stream.getTracks().forEach((track) => {
          track.stop();
        });

        this.sendAudio(audioBlob);
      };

      this.mediaRecorder.start();

      this.isRecording.set(true);
    } catch (error) {
      console.error('Microphone error:', error);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      this.isRecording.set(false);
    }
  }

  sendAudio(audioBlob: Blob) {
    this.isTranscribing.set(true);

    this.sttService.transcribe(audioBlob).subscribe({
      next: (response) => {
        console.log('Gemini response:', response, this.isTranscribing);

        this.transcript.set(response.text);

        this.isTranscribing.set(false);
      },

      error: (error) => {
        console.error('STT error:', error);

        this.isTranscribing.set(false);
      },
    });
  }
}
