import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ActivityDto,
  CreateStudentRequest,
  GameResultDto,
  PlayGameRequest,
  PlayGameResponse,
  StudentDto,
} from '../models/api.models';

/** Envelope de paginação do Spring Data */
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class GameIntegrationService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Students ──────────────────────────────────────────────────────────────

  getStudentsByUser(userId: string): Observable<StudentDto[]> {
    return this.http
      .get<SpringPage<StudentDto>>(`${this.base}/students/responsavel/${userId}`)
      .pipe(map(page => page.content));
  }

  createStudent(body: CreateStudentRequest): Observable<StudentDto> {
    return this.http.post<StudentDto>(`${this.base}/students`, body);
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/students/${id}`);
  }

  // ── Activities ────────────────────────────────────────────────────────────

  getActivities(): Observable<ActivityDto[]> {
    return this.http
      .get<SpringPage<ActivityDto>>(`${this.base}/activities`)
      .pipe(map(page => page.content));
  }

  createActivity(dto: Omit<ActivityDto, 'id'>): Observable<ActivityDto> {
    return this.http.post<ActivityDto>(`${this.base}/activities`, dto);
  }

  deleteActivity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/activities/${id}`);
  }

  // ── Game ──────────────────────────────────────────────────────────────────

  playGame(req: PlayGameRequest): Observable<PlayGameResponse> {
    return this.http.post<PlayGameResponse>(`${this.base}/agent/play-game`, req);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getResultsByStudent(studentId: string): Observable<GameResultDto[]> {
    return this.http
      .get<SpringPage<GameResultDto>>(`${this.base}/game-results/student/${studentId}`)
      .pipe(map(page => page.content));
  }
}
