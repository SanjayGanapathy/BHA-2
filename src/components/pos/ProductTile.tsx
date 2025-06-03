import React from "react";
import { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface ProductTileProps {
  product: Product;
  onClick: (product: Product) => void;
  className?: string;
}

export function ProductTile({ product, onClick, className }: ProductTileProps) {
  const isLowStock = product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
        isOutOfStock && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={() => !isOutOfStock && onClick(product)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          {/* Product Image Placeholder */}
          <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {product.description}
            </p>

            {/* Price */}
            <div className="text-lg font-bold text-primary mb-2">
              ${product.price.toFixed(2)}
            </div>

            {/* Stock and Category */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
              <div className="text-right">
                <div
                  className={cn(
                    "text-xs",
                    isLowStock ? "text-orange-600" : "text-muted-foreground",
                    isOutOfStock && "text-red-600",
                  )}
                >
                  {isOutOfStock ? "Out of Stock" : `${product.stock} left`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
