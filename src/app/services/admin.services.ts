import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { url, file_url } from '../config';

@Injectable({
  providedIn: 'root'
})
export class adminService {
  private httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(private http: HttpClient) { }

  private getAuthorizationHeaders(): HttpHeaders | null {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const localData = JSON.parse(userData);
      return new HttpHeaders().set('Authorization', 'Bearer ' + localData.token);
    }
    console.error("No user data found in localStorage");
    return null;
  }

  /* Async Insert User */
  async userInsert(data: any): Promise<any> {
    const headers = this.getAuthorizationHeaders();
    if (!headers) return null;

    try {
      return await this.http.post<any>(`${url}/user/create`, data, { headers }).toPromise();
    } catch (error) {
      console.error("User insert error:", error);
      throw error;
    }
  }

  /* Login */
  login(data: any): Observable<any> {
    return this.http.post<any>(`${url}/admin/login`, data).pipe(
      catchError(this.handleError)
    );
  }

  /* Category Operations */
  getCategory(params?: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${url}/category/read`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  getCategoryPro(): Observable<any> {
    return this.http.get<any>(`${url}/category/read`).pipe(
      catchError(this.handleError)
    );
  }

  getCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/category/read/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  addCategory(data: FormData): Observable<any> {
    return this.http.post<any>(`${url}/category/create`, data).pipe(
      catchError(this.handleError)
    );
  }

  removeCategory(id: number): Observable<any> {
    return this.http.post<any>(`${url}/category/delete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  updateCategory(id: number, category: any): Observable<any> {
    const formData = new FormData();
    formData.append('category_name', category.category_name);
    if (category.category_img instanceof File) {
      formData.append('category_img', category.category_img);
    }
    return this.http.put<any>(`${url}/category/update/${id}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /* Subcategory Operations */
  getSubCategory(params?: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${url}/sub_category/read`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  getSubCategoryPro(): Observable<any> {
    return this.http.get<any>(`${url}/sub_category/read`).pipe(
      catchError(this.handleError)
    );
  }

  addSubCategory(data: FormData): Observable<any> {
    return this.http.post<any>(`${url}/sub_category/create`, data).pipe(
      catchError(this.handleError)
    );
  }

  getSubCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/sub_category/read/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  removeSubCategory(id: number): Observable<any> {
    return this.http.post<any>(`${url}/sub_category/delete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  updateSubCategory(id: number, subCategory: any): Observable<any> {
    const formData = new FormData();
    formData.append('sub_category_name', subCategory.sub_category_name);
    formData.append('category', subCategory.category);
    return this.http.put<any>(`${url}/sub_category/update/${id}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /* Product Operations */
  getProducts(params?: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${url}/product/read`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  addProduct(data: FormData): Observable<any> {
    return this.http.post<any>(`${url}/product/create`, data).pipe(
      catchError(this.handleError)
    );
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/product/read/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateProduct(data: FormData, id: number): Observable<any> {
    return this.http.put<any>(`${url}/product/update/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  removeProduct(id: number): Observable<any> {
    return this.http.post<any>(`${url}/product/delete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /* User Operations */
  getUsers(params?: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${url}/users/read`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  /* Feedback Operations */
  getFeedbacks(): Observable<any> {
    return this.http.get<any>(`${url}/feedback/read`).pipe(
      catchError(this.handleError)
    );
  }

  deleteFeedback(feedbackId: number): Observable<any> {
    return this.http.post<any>(`${url}/feedback/delete/${feedbackId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /* Transaction Operations */
  getTransactions(): Observable<any> {
    return this.http.get<any>(`${url}/transaction_datails/read`).pipe(
      catchError(this.handleError)
    );
  }

  getTransactionScreenshot(transactionId: string): Observable<any> {
    return this.http.get<any>(`${url}/transaction_datails/transaction-screenshot/${transactionId}`).pipe(
      catchError(this.handleError)
    );
  }

  updateTransactionStatus(transactionId: string, status: string, courierName: string, courierId: number, courierPhone: number): Observable<any> {
    return this.http.put<any>(
      `${url}/transaction_datails/update-transaction-status/${transactionId}`, 
      { status, courierName, courierId, courierPhone }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /* Error Handling */
  private handleError(error: any): Observable<never> {
    console.error("API Error:", error);
    return throwError(error);
  }
}
