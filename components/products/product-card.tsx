"use client";

import { motion } from "framer-motion";
import { ExternalLink, Heart, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductDTO } from "@/types/product";
import { formatCurrency, formatNumber, getPlatformBadgeColor } from "@/lib/utils";
import { useState } from "react";

interface ProductCardProps {
  product: ProductDTO;
  onAddToProposal?: (product: ProductDTO) => void;
}

export function ProductCard({ product, onAddToProposal }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-200 group bg-white border-gray-200">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          {!imageError && product.image_urls[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="h-16 w-16" />
            </div>
          )}
          
          <div className="absolute top-3 left-3">
            <Badge className={getPlatformBadgeColor(product.source)}>
              {product.source.toUpperCase()}
            </Badge>
          </div>

          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:scale-110 transition-transform"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            />
          </button>

          {product.price.original && product.price.original > product.price.current && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="destructive" className="bg-red-500">
                {Math.round(
                  ((product.price.original - product.price.current) /
                    product.price.original) *
                    100
                )}
                % OFF
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[3rem]">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-sky-600">
              {formatCurrency(product.price.current, product.price.currency)}
            </span>
            {product.price.original && product.price.original > product.price.current && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.price.original, product.price.currency)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            {product.sales_volume && (
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                <span>{formatNumber(product.sales_volume)} sold</span>
              </div>
            )}
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {product.moq && (
            <div className="mb-3 text-sm">
              <span className="text-gray-600">MOQ:</span>{" "}
              <span className="font-semibold text-gray-900">{product.moq} units</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-300 hover:bg-gray-50"
              onClick={() => window.open(product.url, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => onAddToProposal?.(product)}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
