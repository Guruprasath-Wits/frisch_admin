import { Injectable } from '@angular/core';
import { url } from './config';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  newurl: any
  apiUrl: any
  labelUrl: any

  httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  constructor(private http: HttpClient) {
    this.newurl = url
    this.apiUrl = `${this.newurl}/production/pdf`;
    this.labelUrl = `${this.newurl}/label/excel`;
  }


  // private apiUrl = 'http://localhost:4001/production/pdf';

  // private labelUrl = 'http://localhost:4001/label/excel';

  // private apiUrl = "${this.url}/production/pdf";

  // private labelUrl = 'https://api.frischfuersie.de/label/excel';




  public login(data: any): Observable<any> {
    return this.http.post<any>(`${url}/users/login`, data);
  }

  public loadImprint(): Observable<any> {
    return this.http.get<any>(`${url}/impressum/read`);
  }

  public updateImprint(userId: string, imprintData: any): Observable<any> {
    return this.http.put<any>(`${url}/impressum/update/${userId}`, imprintData);
  }

  public updateProfile(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${url}/admin/update/${id}`, data);
  }

  // Create a new sample order
  public createSampleOrder(sampleOrder: any): Observable<any> {
    return this.http.post(`${url}/sampleOrder/create`, sampleOrder);
  }

  // Update an existing sample order
  public updateSampleOrder(sampleOrder: any): Observable<any> {
    return this.http.put(`${url}/sampleOrder/update/${sampleOrder.id}`, sampleOrder);
  }
  public uploadProductImage(data: FormData): Observable<any> {
    return this.http.post(`${url}/sampleOrder/upload-image`, data);
  }


  // Delete a sample order
  public deleteSampleOrder(sampleOrderId: number): Observable<any> {
    return this.http.post(`${url}/sampleOrder/delete/${sampleOrderId}`, {});
  }

  public createImprint(data: any): Observable<any> {
    return this.http.post<any>(`${url}/impressum/create`, data);
  }

  public getCategory(data: any): Observable<any> {
    return this.http.get<any>(`${url}/category/read`, data)
  }

  public getCategoryPro(): Observable<any> {
    return this.http.get<any>(`${url}/category/read`);
  }

  public getCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/category/read/${id}`);
  }


  public addCategory(data: FormData): Observable<any> {
    return this.http.post<any>(`${url}/category/create`, data)
  }

  public removeCategory(id: number): Observable<any> {
    return this.http.post<any>(`${url}/category/delete/${id}`, {});
  }

  public updateCategory(id: number, category: any): Observable<any> {

    return this.http.put<any>(`${url}/category/update/${id}`, category);
  }

  // Main Category Methods
  public getMainCategory(): Observable<any> {
    return this.http.get<any>(`${url}/main-category/read`);
  }

  public getMainCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/main-category/read/${id}`);
  }

  public addMainCategory(data: any): Observable<any> {
    return this.http.post<any>(`${url}/main-category/create`, data);
  }

  public updateMainCategory(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${url}/main-category/update/${id}`, data);
  }

  public removeMainCategory(id: number): Observable<any> {
    return this.http.post<any>(`${url}/main-category/delete/${id}`, {});
  }

  public getProducts(): Observable<any> {
    return this.http.get(`${url}/product/read`);
  }

  // Fetch sample orders
  public getSampleOrders(): Observable<any> {
    return this.http.get(`${url}/sampleOrder/read`);
  }

  // Create a new sample order
  // public createSampleOrder(sampleOrder: any): Observable<any> {
  //   return this.http.post(`${url}/sampleOrder/create`, sampleOrder);
  // }

  // Update an existing sample order
  // public updateSampleOrder(sampleOrder: any): Observable<any> {
  //   return this.http.put(`${url}/sampleOrder/update/${sampleOrder.id}`, sampleOrder);
  // }

  // Delete a sample order
  // public deleteSampleOrder(sampleOrderId: number): Observable<any> {
  //   return this.http.post(`${url}/sampleOrder/delete/${sampleOrderId}`,{});
  // }

  public getArea(): Observable<any> {
    return this.http.get(`${url}/deliveryArea/read`)
  }


  public createAera(aera: any): Observable<any> {
    return this.http.post(`${url}/deliveryArea/create`, aera);
  }

  // Update an existing sample order
  public updateAera(aeraId: any): Observable<any> {
    return this.http.put(`${url}/deliveryArea/update/${aeraId.id}`, aeraId);
  }

  // Delete a sample order
  public deleteAera(aeraIdId: number): Observable<any> {
    return this.http.post(`${url}/deliveryArea/delete/${aeraIdId}`, {});
  }

  public getAdvantages(): Observable<any> {
    return this.http.get<any>(`${url}/userAdv/read`);
  }

  public createAdvantages(data: any): Observable<any> {
    return this.http.post<any>(`${url}/userAdv/create`, data);
  }

  public updateAdvantages(data: any): Observable<any> {
    return this.http.put<any>(`${url}/userAdv/update/${data.id}`, data);
  }

  public deleteAdvantages(id: number): Observable<any> {
    return this.http.post<any>(`${url}/userAdv/delete/${id}`, {});
  }

  public getJobs(): Observable<any> {
    return this.http.get<any>(`${url}/jobs/read`);
  }

  public createJobs(data: any): Observable<any> {
    return this.http.post<any>(`${url}/jobs/create`, data);
  }

  public updateJobs(data: any): Observable<any> {
    return this.http.put<any>(`${url}/jobs/update/${data.id}`, data);
  }

  public deleteJobs(id: number): Observable<any> {
    return this.http.post<any>(`${url}/jobs/delete/${id}`, {});
  }

  public getFaqs(): Observable<any> {
    return this.http.get<any>(`${url}/faq/read`);
  }

  public createFaq(data: any): Observable<any> {
    return this.http.post<any>(`${url}/faq/create`, data);
  }

  public updateFaq(data: any): Observable<any> {
    return this.http.put<any>(`${url}/faq/update/${data.id}`, data);
  }

  public deleteFaq(id: number): Observable<any> {
    return this.http.post<any>(`${url}/faq/delete/${id}`, {});
  }

  public getRole(): Observable<any> {
    return this.http.get<any>(`${url}/role/read`);
  }

  public createRole(data: any): Observable<any> {
    return this.http.post<any>(`${url}/role/create`, data);
  }

  public updateRole(data: any): Observable<any> {
    return this.http.put<any>(`${url}/role/update/${data.id}`, data);
  }

  public deleteRole(id: number): Observable<any> {
    return this.http.post<any>(`${url}/role/delete/${id}`, {});
  }

  public createSetting(data: any): Observable<any> {
    return this.http.post<any>(`${url}/setting/create`, data);
  }

  public loadUsers(): Observable<any> {
    return this.http.get<any>(`${url}/users/read`);
  }

  public updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put<any>(`${url}/users/update/${userId}`, userData);
  }

  public updateUserStatus(userId: number, status: number): Observable<any> {
    return this.http.put<any>(`${url}/users/status/${userId}`, { status });
  }


  public getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${url}/users/read/${userId}`);
  }

  public createUser(createUser: any): Observable<any> {
    return this.http.post(`${url}/users/register`, createUser);
  }

  public deleteUser(id: number): Observable<any> {
    return this.http.post<any>(`${url}/users/delete/${id}`, {});
  }

  public removeProduct(id: number): Observable<any> {
    return this.http.post<any>(`${url}/product/delete/${id}`, {});
  }

  public fetchProducts(): Observable<any> {
    return this.http.get<any>(`${url}/product/read`);
  }

  public updateProduct(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(`${url}/product/update/${userId}`, userData);
  }

  public getProductById(userId: string): Observable<any> {
    return this.http.get<any>(`${url}/product/read/${userId}`);
  }

  public createProduct(createProduct: any): Observable<any> {
    return this.http.post(`${url}/product/create`, createProduct);
  }

  public loadSettings(): Observable<any> {
    return this.http.get<any>(`${url}/setting/read/1`);
  }

  public updateSetting(userId: string, settingData: any): Observable<any> {
    return this.http.put<any>(`${url}/setting/update/${userId}`, settingData);
  }

  public getNotification(): Observable<any> {
    return this.http.get<any>(`${url}/notifications/read`);
  }

  public updateStatus(notifiId: number, statusData: any): Observable<any> {
    return this.http.put<any>(`${url}/notifications/update/${notifiId}`, statusData);
  }

  public loadOrders(): Observable<any> {
    return this.http.get<any>(`${url}/orders/read`);
  }

  public loadSubsOrders(): Observable<any> {
    return this.http.get<any>(`${url}/subscribe-orders/read`);
  }

  public deliverycompleteAll(): Observable<any> {
    return this.http.get<any>(`${url}/orders/deliverycompleteAll`);
  }

  public driverPerform(): Observable<any> {
    return this.http.get<any>(`${url}/orders/driverperformanceRead`);
  }

  public createDriverPerformance(createDriverPerformance: any): Observable<any> {
    return this.http.post(`${url}/orders/driverperformance`, createDriverPerformance);
  }



  public deleteOrder(id: number): Observable<any> {
    return this.http.post<any>(`${url}/orders/delete/${id}`, {});
  }

  public updateOrders(orderId: number, orderData: any): Observable<any> {
    return this.http.put<any>(`${url}/orders/update/${orderId}`, orderData);
  }

  public updateSubOrders(orderId: number, orderData: any): Observable<any> {

    return this.http.post<any>(`${url}/orders/subcreate/`, orderData);
  }

  public updateSubscriptionOrders(orderId: number, orderData: any): Observable<any> {
    return this.http.put<any>(`${url}/subscribe-orders/update/${orderId}`, orderData);
  }

  public assignOrdersToDriver(orderData: { driverId: number; orderIds: number[] }): Observable<any> {
    return this.http.put<any>(`${url}/orders/assignDriver`, orderData);
  }

  public storeProcessedOrders(orders: any[]): Observable<any> {
    return this.http.post(`${url}/orders/storeProcessedOrders`, { orders });
  }

  public getOrder(order: any): Observable<any> {
    return this.http.post(`${url}/orders/OrderDetailsByDriver`, order);
  }


  public assignOrdersToDrivers(orderData: { driverId: number; orderIds: number[] }): Observable<any> {
    return this.http.put<any>(`${url}/subscribe-orders/assignDriver`, orderData);
  }

  public loadDetailsOrder(orderId: any): Observable<any> {
    return this.http.get<any>(`${url}/orders/orderDetails/${orderId}`, {});
  }

  public loadDetailsSubscriptionOrder(orderId: any): Observable<any> {
    return this.http.get<any>(`${url}/subscribe-orders/orderDetails/${orderId}`, {});
  }


  public updateOrderBag(orderId: number, orderData: any): Observable<any> {
    return this.http.put<any>(`${url}/orders/bagUpdate/${orderId}`, orderData);
  }

  public updateSubcriptionOrderBag(orderId: number, orderData: any): Observable<any> {
    return this.http.put<any>(`${url}/subscribe-orders/bagUpdate/${orderId}`, orderData);
  }


  public loadContactUs(): Observable<any> {
    return this.http.get<any>(`${url}/contactUS/read`);
  }

  public removecontactUS(id: number): Observable<any> {
    return this.http.post<any>(`${url}/contactUS/delete/${id}`, {});
  }

  public savePermissions(perData: any): Observable<any> {
    return this.http.post(`${url}/admin/permissions`, perData);
  }

  public deletePermission(id: number): Observable<any> {
    return this.http.post<any>(`${url}/admin/permissions/delete/${id}`, {});
  }

  public loadPermissions(): Observable<any> {
    return this.http.get<any>(`${url}/admin/permissions/read`);
  }

  public loadPermissionsById(perId: any): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get<any>(`${url}/admin/permissions/readPermissionId/${perId}?t=${timestamp}`);
  }

  public updatePermissions(perId: number, perData: any): Observable<any> {
    return this.http.put<any>(`${url}/admin/permissions/update/${perId}`, perData);
  }

  public getSubscription(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${url}/subscription/transactions?month=${month}&year=${year}`);
  }

  public getSubscriptionMonth(): Observable<any> {
    return this.http.get<any>(`${url}/subscription/billing-months`);
  }

  // public getPages():Observable<any>{
  //   return this.http.get(`${url}/admin/permissions/read`);
  // }

  public getLabelReport(data: any): Observable<Blob> {
    return this.http.post(this.labelUrl, data, {
      responseType: 'blob'
    });
  }

  // public getLabelReport(data:any): Observable<Blob> {
  //   const params = new HttpParams().set('data', JSON.stringify(data));
  //   return this.http.get(this.labelUrl, { responseType: 'blob', params });
  // }





  public getLabels(date: string, category: string): Observable<Blob> {
    const url = `${this.apiUrl}/?date=${encodeURIComponent(date)}&category=${encodeURIComponent(category)}`;
    return this.http.get<Blob>(url, { responseType: 'blob' as 'json' });
  }

  public getTaxes(): Observable<any> {
    return this.http.get<any>(`${url}/tax/read`);
  }

  public createTax(data: any): Observable<any> {
    return this.http.post<any>(`${url}/tax/create`, data);
  }

  public updateTax(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${url}/tax/update/${id}`, data);
  }

  public deleteTax(id: number): Observable<any> {
    return this.http.post<any>(`${url}/tax/delete/${id}`, {});
  }
  public getBottles(): Observable<any> {
    return this.http.get<any>(`${url}/bottle/`);
  }

  public createBottle(data: any): Observable<any> {
    return this.http.post<any>(`${url}/bottle/`, data);
  }

  public updateBottle(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${url}/bottle/${id}`, data);
  }

  public deleteBottle(id: number): Observable<any> {
    return this.http.post<any>(`${url}/bottle/delete/${id}`, {});
  }

  // Combo Pack Methods
  public getCombos(): Observable<any> {
    return this.http.get<any>(`${url}/combo/`);
  }

  public getComboById(id: number): Observable<any> {
    return this.http.get<any>(`${url}/combo/${id}`);
  }

  public createCombo(data: FormData): Observable<any> {
    return this.http.post<any>(`${url}/combo/`, data);
  }

  public updateCombo(id: number, data: FormData): Observable<any> {
    return this.http.put<any>(`${url}/combo/${id}`, data);
  }

  public deleteCombo(id: number): Observable<any> {
    return this.http.post<any>(`${url}/combo/delete/${id}`, {});
  }

  public getMissingProducts(): Observable<any> {
    return this.http.get<any>(`${url}/missingProduct`);
  }

  public markMissingProductAsRead(id: number): Observable<any> {
    return this.http.put<any>(`${url}/missingProduct/read/${id}`, {});
  }

  // Holiday Methods
  public getHolidays(): Observable<any> {
    return this.http.get<any>(`${url}/holiday/read`);
  }

  public addHoliday(data: any): Observable<any> {
    return this.http.post<any>(`${url}/holiday/create`, data);
  }

  public deleteHoliday(id: number): Observable<any> {
    return this.http.post<any>(`${url}/holiday/delete/${id}`, {});
  }
}
