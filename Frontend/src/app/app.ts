import { Component } from '@angular/core';
import { SttComponent } from './components/stt/stt';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SttComponent],
  templateUrl: './app.html',
})
export class App {}
