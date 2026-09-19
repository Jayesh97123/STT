import { Component } from '@angular/core';
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

  isRecording = false;
  isTranscribing = false;

  transcript = '';

  constructor(private sttService: SttService) {}

  async startRecording() {
    try {
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

      this.isRecording = true;

      console.log('Recording started');
    } catch (error) {
      console.error('Microphone error:', error);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      this.isRecording = false;

      console.log('Recording stopped');
    }
  }

  sendAudio(audioBlob: Blob) {
    this.isTranscribing = true;

    this.sttService.transcribe(audioBlob).subscribe({
      next: (response) => {
        console.log('Gemini response:', response);

        this.transcript = response.text;

        this.isTranscribing = false;
      },

      error: (error) => {
        console.error('STT error:', error);

        this.isTranscribing = false;
      },
    });
  }
}
