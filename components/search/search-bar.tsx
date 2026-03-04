"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onImageSearch?: (image: File) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, onImageSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImage && onImageSearch) {
      onImageSearch(uploadedImage);
    } else if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div 
          className={cn(
            "relative flex items-center bg-white rounded-full shadow-sm border-2 transition-all duration-200",
            isMounted && isDragging 
              ? "border-sky-400 bg-sky-50" 
              : "border-gray-200 hover:border-sky-300"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isMounted && imagePreview && (
            <div className="flex items-center gap-3 pl-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="Upload preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <Input
            type="text"
            placeholder={isMounted && isDragging ? "Drop image here..." : "Search for products across Taobao..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!!uploadedImage}
            className={cn(
              "flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 py-8 text-gray-900 placeholder:text-gray-500",
              isMounted && imagePreview ? "pl-2" : "pl-6"
            )}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            className="mr-2 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 flex-shrink-0"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || (!query.trim() && !uploadedImage)}
            size="icon"
            className={cn(
              "mr-4 h-11 w-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-all duration-200 flex-shrink-0",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isMounted && isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-50 bg-opacity-90 rounded-full pointer-events-none">
            <p className="text-sky-600 font-medium">Drop image to search</p>
          </div>
        )}
      </form>
    </motion.div>
  );
}
