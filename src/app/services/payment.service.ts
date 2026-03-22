import { Injectable } from '@angular/core';

export type PaymentMethod = 'jazzcash' | 'easypaisa';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  orderId: string;
  customerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  /**
   * Initiates a payment request to the specified gateway.
   * In a real-world scenario, this would communicate with a backend API
   * which securely holds the merchant credentials and interacts with JazzCash/Easypaisa.
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`[PaymentService] Initiating ${request.method} payment for order ${request.orderId}...`);
    
    // Simulate network request to backend payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate an 80% success rate
        const isSuccess = Math.random() > 0.2;
        
        if (isSuccess) {
          resolve({
            success: true,
            transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            message: 'Payment processed successfully.'
          });
        } else {
          resolve({
            success: false,
            message: 'Payment failed or was declined by the gateway.'
          });
        }
      }, 2500);
    });
  }
}
