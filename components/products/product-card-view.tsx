"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProductDTO } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, ShoppingCart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardViewProps {
  products: ProductDTO[];
  onAddToProposal: (product: ProductDTO) => void;
  selectedProducts: Set<string>;
  setSelectedProducts: (products: Set<string>) => void;
}

export function ProductCardView({
  products,
  onAddToProposal,
  selectedProducts,
  setSelectedProducts,
}: ProductCardViewProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Use refs to always have current values in event handler
  const focusedIndexRef = useRef(focusedIndex);
  const selectedProductsRef = useRef(selectedProducts);
  
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);
  
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  const toggleCard = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  const toggleSelection = useCallback((productId: string) => {
    const newSelected = new Set(selectedProductsRef.current);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  }, [setSelectedProducts]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (products.length === 0) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, products.length - 1);
            cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return next;
          });
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return next;
          });
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          const currentIndex = focusedIndexRef.current;
          if (currentIndex >= 0 && currentIndex < products.length) {
            toggleSelection(products[currentIndex].id);
          }
          break;
        case 'Enter':
          e.preventDefault();
          const focusedIdx = focusedIndexRef.current;
          if (focusedIdx >= 0 && focusedIdx < products.length) {
            onAddToProposal(products[focusedIdx]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, toggleSelection, onAddToProposal]);

  // Focus first card on mount
  useEffect(() => {
    if (products.length > 0) {
      setFocusedIndex(0);
    }
  }, [products]);

  return (
    <>
      {/* Keyboard Navigation Hint */}
      <div className="mb-4 text-xs text-gray-500 flex items-center gap-4">
        <span>💡 Use arrow keys to navigate</span>
        <span>•</span>
        <span>Space to select</span>
        <span>•</span>
        <span>Enter to add to proposal</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => {
          const isExpanded = expandedCards.has(product.id);
          const isSelected = selectedProducts.has(product.id);
          const isFocused = index === focusedIndex;

          return (
            <Card
              key={product.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              className={`overflow-hidden transition-all ${
                isSelected ? "ring-2 ring-sky-500" : ""
              } ${
                isFocused ? "ring-2 ring-sky-400 shadow-lg" : ""
              }`}
              tabIndex={0}
              onFocus={() => setFocusedIndex(index)}
            >
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img
                    src={product.image_urls[0].startsWith("//") ? `https:${product.image_urls[0]}` : product.image_urls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-product.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(product.id)}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg text-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer bg-white/90 backdrop-blur-sm"
                  />
                </div>

                {/* Platform Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-orange-500 text-white">
                    {product.source}
                  </Badge>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                  {product.title}
                </h3>

                {/* Price */}
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

                {/* Seller Info */}
                <div className="text-xs text-gray-600 mb-3">
                  <p className="truncate">
                    <span className="font-medium">Seller:</span> {product.seller.name}
                  </p>
                  {product.seller.location && (
                    <p className="truncate">
                      <span className="font-medium">Location:</span> {product.seller.location}
                    </p>
                  )}
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t pt-3 mb-3 space-y-2 text-sm">
                        {product.moq && (
                          <p className="text-gray-600">
                            <span className="font-medium">MOQ:</span> {product.moq}
                          </p>
                        )}
                        {product.lead_time && (
                          <p className="text-gray-600">
                            <span className="font-medium">Lead Time:</span> {product.lead_time}
                          </p>
                        )}
                        {product.description_short && (
                          <p className="text-gray-600">
                            <span className="font-medium">Description:</span>{" "}
                            {product.description_short}
                          </p>
                        )}
                        {product.price.tiers && product.price.tiers.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Price Tiers:</p>
                            <div className="space-y-1">
                              {product.price.tiers.map((tier, idx) => (
                                <p key={idx} className="text-xs text-gray-600">
                                  {tier.min_quantity}+ units: {formatCurrency(tier.price, product.price.currency)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCard(product.id)}
                    className="flex-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        More
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddToProposal(product)}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add
                  </Button>

                  {product.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(product.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </>
  );
}
