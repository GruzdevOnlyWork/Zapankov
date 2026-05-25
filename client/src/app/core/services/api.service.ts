import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrders(params?: { status?: string; search?: string }) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any[]>(`${this.baseUrl}/orders`, { params: httpParams });
  }

  getOrderStats() {
    return this.http.get<any>(`${this.baseUrl}/orders/stats`);
  }

  getOrder(id: number) {
    return this.http.get<any>(`${this.baseUrl}/orders/${id}`);
  }

  createOrder(data: any) {
    return this.http.post<any>(`${this.baseUrl}/orders`, data);
  }

  updateOrder(id: number, data: any) {
    return this.http.patch<any>(`${this.baseUrl}/orders/${id}`, data);
  }

  deleteOrder(id: number) {
    return this.http.delete(`${this.baseUrl}/orders/${id}`);
  }

  getRequests(params?: { status?: string }) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<any[]>(`${this.baseUrl}/requests`, { params: httpParams });
  }

  submitRequest(data: any) {
    return this.http.post<any>(`${this.baseUrl}/requests`, data);
  }

  updateRequest(id: number, data: any) {
    return this.http.patch<any>(`${this.baseUrl}/requests/${id}`, data);
  }

  convertRequest(id: number) {
    return this.http.post<any>(`${this.baseUrl}/requests/${id}/convert`, {});
  }

  deleteRequest(id: number) {
    return this.http.delete(`${this.baseUrl}/requests/${id}`);
  }

  getClients(params?: { search?: string }) {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any[]>(`${this.baseUrl}/clients`, { params: httpParams });
  }

  getClient(id: number) {
    return this.http.get<any>(`${this.baseUrl}/clients/${id}`);
  }

  createClient(data: any) {
    return this.http.post<any>(`${this.baseUrl}/clients`, data);
  }

  updateClient(id: number, data: any) {
    return this.http.patch<any>(`${this.baseUrl}/clients/${id}`, data);
  }

  deleteClient(id: number) {
    return this.http.delete(`${this.baseUrl}/clients/${id}`);
  }

  getPortfolio(params?: { category?: string }) {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<any[]>(`${this.baseUrl}/portfolio`, { params: httpParams });
  }

  createPortfolioItem(data: any) {
    return this.http.post<any>(`${this.baseUrl}/portfolio`, data);
  }

  updatePortfolioItem(id: number, data: any) {
    return this.http.patch<any>(`${this.baseUrl}/portfolio/${id}`, data);
  }

  deletePortfolioItem(id: number) {
    return this.http.delete(`${this.baseUrl}/portfolio/${id}`);
  }

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ url: string; filename: string }>(`${this.baseUrl}/upload`, formData);
  }

  getOrdersReport(params?: any) {
    return this.http.get<any>(`${this.baseUrl}/reports/orders`, { params: this.toParams(params) });
  }

  getRevenueReport(params?: any) {
    return this.http.get<any>(`${this.baseUrl}/reports/revenue`, { params: this.toParams(params) });
  }

  getClientsReport() {
    return this.http.get<any>(`${this.baseUrl}/reports/clients`);
  }

  getWorksReport(params?: any) {
    return this.http.get<any>(`${this.baseUrl}/reports/works`, { params: this.toParams(params) });
  }

  getWorkloadReport(params?: any) {
    return this.http.get<any>(`${this.baseUrl}/reports/workload`, { params: this.toParams(params) });
  }

  exportReport(type: string, format: string, params?: any) {
    const p = this.toParams({ type, format, ...params });
    return this.http.get(`${this.baseUrl}/reports/export`, { params: p, responseType: 'blob' });
  }

  private toParams(obj?: any): HttpParams {
    let p = new HttpParams();
    if (obj) Object.keys(obj).forEach(k => { if (obj[k]) p = p.set(k, obj[k]); });
    return p;
  }
}
