import { Component, signal } from '@angular/core';

import { SttService, ChatMessage } from '../../services/stt.service';

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

  chatMessages = signal<ChatMessage[]>([]);

  /**
   * spk_1 -> Person A
   * spk_2 -> Person B
   * spk_3 -> Person C
   */
  speakerNames = signal<Record<string, string>>({});

  /**
   * Speaker currently being renamed
   */
  editingSpeaker = signal<string | null>(null);

  /**
   * Temporary input value
   */
  editingName = signal('');

  Object = Object;

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

        stream.getTracks().forEach((track) => track.stop());

        this.isRecording.set(false);

        this.sendAudio(audioBlob);
      };

      this.mediaRecorder.start();

      this.isRecording.set(true);
    } catch (error) {
      console.error('Microphone error:', error);

      this.isRecording.set(false);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  sendAudio(audioBlob: Blob) {
    this.isTranscribing.set(true);

    this.transcript.set('');

    this.chatMessages.set([]);

    this.speakerNames.set({});

    this.sttService.transcribe(audioBlob).subscribe({
      next: (response) => {
        console.log('Gemini response:', response);

        this.transcript.set(response.text);

        this.chatMessages.set(response.chat);

        this.speakerNames.set(response.speakerNames);

        this.isTranscribing.set(false);
      },

      error: (error) => {
        console.error('STT error:', error);

        this.isTranscribing.set(false);
      },
    });
  }

  /**
   * Get display name
   */
  getSpeakerName(speakerId: string): string {
    return this.speakerNames()[speakerId] || speakerId;
  }

  /**
   * Start renaming speaker
   */
  startRename(speakerId: string) {
    this.editingSpeaker.set(speakerId);

    this.editingName.set(this.getSpeakerName(speakerId));
  }

  /**
   * Save renamed speaker
   */
  saveRename(speakerId: string) {
    const newName = this.editingName().trim();

    if (!newName) {
      return;
    }

    this.speakerNames.update((names) => ({
      ...names,
      [speakerId]: newName,
    }));

    this.editingSpeaker.set(null);

    this.editingName.set('');
  }

  /**
   * Cancel rename
   */
  cancelRename() {
    this.editingSpeaker.set(null);

    this.editingName.set('');
  }

  /**
   * Handle input
   */
  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;

    this.editingName.set(input.value);
  }

  /**
   * Track chat message
   */
  trackMessage(index: number, message: ChatMessage) {
    return `${message.speaker}-${index}`;
  }
}
