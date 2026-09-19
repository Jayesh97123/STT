import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranscriptionResponse {
  success: boolean;
  text: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SttService {
  private apiUrl = 'http://localhost:5000/api/stt';

  constructor(private http: HttpClient) {}

  transcribe(audioBlob: Blob): Observable<TranscriptionResponse> {
    const formData = new FormData();

    formData.append('audio', audioBlob, 'recording.webm');

    return this.http.post<TranscriptionResponse>(`${this.apiUrl}/transcribe`, formData);
  }
}
