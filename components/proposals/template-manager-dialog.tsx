"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { templateManager, PPTXTemplate } from "@/lib/template-manager";

interface TemplateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateManagerDialog({ open, onOpenChange }: TemplateManagerDialogProps) {
  const [templates, setTemplates] = useState<PPTXTemplate[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = () => {
    setTemplates(templateManager.getTemplates());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      alert('Please upload a .pptx file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const name = file.name.replace('.pptx', '');
        templateManager.addTemplate(name, base64);
        loadTemplates();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading template:', error);
      alert('Failed to upload template');
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      templateManager.deleteTemplate(id);
      loadTemplates();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage PPTX Templates</DialogTitle>
          <DialogDescription>
            Upload custom PPTX templates for your proposals. The system will populate your template with product data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".pptx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="template-upload"
            />
            <label htmlFor="template-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload PPTX template'}
                </p>
                <p className="text-xs text-gray-500">
                  Upload a .pptx file to use as a custom template
                </p>
              </div>
            </label>
          </div>

          {/* Templates List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Your Templates</h3>
            
            {/* Default Template */}
            <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="font-medium text-sm">Default Template</p>
                  <p className="text-xs text-gray-500">Built-in template</p>
                </div>
              </div>
              <span className="text-xs bg-sky-600 text-white px-2 py-1 rounded">Default</span>
            </div>

            {/* Custom Templates */}
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No custom templates yet. Upload one to get started!
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500">
                        Added {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
