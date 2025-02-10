import { Order } from "@/services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSidebarProps {
  orders: Order[];
  selectedOrderId: string | null;
  onOrderSelect: (orderId: string) => void;
}

export function OrderSidebar({
  orders,
  selectedOrderId,
  onOrderSelect,
}: OrderSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="mb-4">
              <Menu className="w-4 h-4 mr-2" />
              Orders
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px]">
            <OrderList
              orders={orders}
              selectedOrderId={selectedOrderId}
              onOrderSelect={onOrderSelect}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle>Past Orders</CardTitle>
            <CardDescription>Recent customer orders</CardDescription>
          </CardHeader>
          <OrderList
            orders={orders}
            selectedOrderId={selectedOrderId}
            onOrderSelect={onOrderSelect}
          />
        </Card>
      </div>
    </>
  );
}

function OrderList({
  orders,
  selectedOrderId,
  onOrderSelect,
}: OrderSidebarProps) {
  return (
    <div className="p-4 space-y-2">
      {orders.map((order) => (
        <button
          key={order.orderId}
          onClick={() => onOrderSelect(order.orderId)}
          className={`w-full text-left p-2 rounded-md hover:bg-gray-100 ${
            selectedOrderId === order.orderId ? "bg-gray-200" : ""
          }`}
        >
          <div className="font-medium">{order.customerName}</div>
          <div className="text-sm text-gray-500">
            #{order.orderId.slice(0, 8)} - ${order.total.toFixed(2)}
          </div>
        </button>
      ))}
    </div>
  );
}
