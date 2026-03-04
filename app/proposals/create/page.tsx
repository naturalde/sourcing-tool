"use client";

import { useState, useEffect } from "react";
import { ProductDTO } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CreateProposal() {
  const [proposalProducts, setProposalProducts] = useState<ProductDTO[]>([]);
  const [proposalName, setProposalName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load products from localStorage
    const stored = localStorage.getItem('proposalProducts');
    if (stored) {
      setProposalProducts(JSON.parse(stored));
    }
  }, []);

  const removeProduct = (productId: string) => {
    const updated = proposalProducts.filter(p => p.id !== productId);
    setProposalProducts(updated);
    localStorage.setItem('proposalProducts', JSON.stringify(updated));
  };

  const handleSaveProposal = async () => {
    if (!proposalName.trim()) {
      alert('Please enter a proposal name');
      return;
    }

    setIsSaving(true);

    const proposal = {
      name: proposalName,
      clientName,
      notes,
      products: proposalProducts,
      createdAt: new Date().toISOString(),
      totalItems: proposalProducts.length,
      totalValue: proposalProducts.reduce((sum, p) => sum + p.price.current, 0),
    };

    try {
      // Save to localStorage for now (can be replaced with API call)
      const existingProposals = JSON.parse(localStorage.getItem('proposals') || '[]');
      existingProposals.push(proposal);
      localStorage.setItem('proposals', JSON.stringify(existingProposals));
      
      // Clear proposal products
      localStorage.removeItem('proposalProducts');
      
      alert('Proposal saved successfully!');
      window.location.href = '/proposals';
    } catch (error) {
      console.error('Error saving proposal:', error);
      alert('Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };

  const totalValue = proposalProducts.reduce((sum, p) => sum + p.price.current, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sky-600 hover:text-sky-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Proposal</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Name *
              </label>
              <Input
                value={proposalName}
                onChange={(e) => setProposalName(e.target.value)}
                placeholder="e.g., Q1 2026 Product Sourcing"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., ABC Company"
                className="w-full"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special requirements..."
              rows={3}
              className="w-full"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items: {proposalProducts.length}</p>
                <p className="text-lg font-semibold text-gray-900">
                  Total Value: {formatCurrency(totalValue, 'CNY')}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProposal}
                  disabled={isSaving || proposalProducts.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Proposal'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Products ({proposalProducts.length})</h2>
          </div>

          {proposalProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No products added to proposal yet. Go back to search and add products.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {proposalProducts.map((product) => (
                <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-6">
                    {/* Product Images */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                        {product.image_urls[0] ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      {product.image_urls.length > 1 && (
                        <div className="mt-2 flex gap-2">
                          {product.image_urls.slice(1, 4).map((url, idx) => (
                            <div key={idx} className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {product.image_urls.length > 4 && (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                              +{product.image_urls.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <span className="ml-2 font-semibold text-sky-600">
                            {formatCurrency(product.price.current, product.price.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Platform:</span>
                          <span className="ml-2 capitalize">{product.source}</span>
                        </div>
                        {product.moq && (
                          <div>
                            <span className="text-gray-600">MOQ:</span>
                            <span className="ml-2">{product.moq} units</span>
                          </div>
                        )}
                        {product.seller?.location && (
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <span className="ml-2">{product.seller.location}</span>
                          </div>
                        )}
                        {product.sales_volume && (
                          <div>
                            <span className="text-gray-600">Sales:</span>
                            <span className="ml-2">{product.sales_volume.toLocaleString()} sold</span>
                          </div>
                        )}
                        {product.seller?.name && (
                          <div>
                            <span className="text-gray-600">Seller:</span>
                            <span className="ml-2">{product.seller.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-sky-600 hover:text-sky-700"
                        >
                          View on {product.source}
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
