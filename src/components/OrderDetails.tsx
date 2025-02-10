import { Order } from "@/services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>Information about the recent order</CardDescription>
      </CardHeader>
      <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-medium">#{order.orderId.slice(0, 8)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Customer Name</p>
          <p className="font-medium">{order.customerName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Order Total</p>
          <p className="font-medium">${order.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Order Rating</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {(
                      order.ratings.reduce((sum, r) => sum + r.rating, 0) /
                      order.ratings.length
                    ).toFixed(1)}
                  </span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-muted-foreground">
                    (based on {order.ratings.length} criteria)
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="space-y-2">
                {order.ratings.map((criteria, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <span>{criteria.criterion}</span>
                    <span className="flex items-center gap-1">
                      {criteria.rating}
                      <span className="text-yellow-400">★</span>
                    </span>
                  </div>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="p-6 pt-0">
        <p className="text-sm text-muted-foreground mb-2">Ordered Items</p>
        <div className="space-y-2">
          {order.orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  x{item.quantity}
                </span>
              </div>
              <span className="font-medium">${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      {order.customerReview && (
        <div className="p-6 pt-0">
          <p className="text-sm text-muted-foreground mb-2">Customer Review</p>
          <blockquote className="pl-4 border-l-2 border-muted">
            "{order.customerReview}"
          </blockquote>
        </div>
      )}
    </Card>
  );
}
