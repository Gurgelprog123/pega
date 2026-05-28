import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActivityDto,
  CreateStudentRequest,
  GameResultDto,
  PlayGameRequest,
  PlayGameResponse,
  StudentDto,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GameIntegrationService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Students ──────────────────────────────────────────────────────────────

  getStudentsByUser(userId: number): Observable<StudentDto[]> {
    return this.http.get<StudentDto[]>(`${this.base}/students/user/${userId}`);
  }

  createStudent(body: CreateStudentRequest): Observable<StudentDto> {
    return this.http.post<StudentDto>(`${this.base}/students`, body);
  }

  // ── Activities ────────────────────────────────────────────────────────────

  getActivities(): Observable<ActivityDto[]> {
    return this.http.get<ActivityDto[]>(`${this.base}/activities`);
  }

  createActivity(dto: Omit<ActivityDto, 'id'>): Observable<ActivityDto> {
    return this.http.post<ActivityDto>(`${this.base}/activities`, dto);
  }

  // ── Game ──────────────────────────────────────────────────────────────────

  playGame(req: PlayGameRequest): Observable<PlayGameResponse> {
    return this.http.post<PlayGameResponse>(`${this.base}/agent/play-game`, req);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getResultsByStudent(studentId: number): Observable<GameResultDto[]> {
    return this.http.get<GameResultDto[]>(`${this.base}/game-results/student/${studentId}`);
  }
}
