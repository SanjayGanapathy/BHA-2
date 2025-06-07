import React from "react";
import { CartItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingCart as CartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClear: () => void;
  className?: string;
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClear,
  className,
}: ShoppingCartProps) {
  const safeItems = Array.isArray(items) ? items : [];

  const subtotal = safeItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  const totalItems = safeItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CartIcon className="h-5 w-5" />
          Cart
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {totalItems} items
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {safeItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="text-muted-foreground">
              <CartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs">Add items to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
              {safeItems.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product.stock}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-sm font-semibold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="space-y-2">
              <Separator />

              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={onCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Process Sale
                </Button>
                <Button
                  onClick={onClear}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
