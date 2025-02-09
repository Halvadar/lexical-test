const API_BASE_URL = "http://localhost:3001/api";

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  review?: string;
  ratings: { criterion: string; rating: number }[];
  createdAt: string;
}

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return response.json();
};

export const fetchOrderDetails = async (orderId: string): Promise<Order> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch order details");
  }
  return response.json();
};
