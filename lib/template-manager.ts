export interface PPTXTemplate {
  id: string;
  name: string;
  file: string; // base64 encoded PPTX file
  isDefault: boolean;
  createdAt: string;
}

const TEMPLATES_STORAGE_KEY = 'pptx_templates';

export const templateManager = {
  // Get all templates
  getTemplates(): PPTXTemplate[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Add a new template
  addTemplate(name: string, file: string): PPTXTemplate {
    const templates = this.getTemplates();
    const newTemplate: PPTXTemplate = {
      id: `template_${Date.now()}`,
      name,
      file,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return newTemplate;
  },

  // Get template by ID
  getTemplate(id: string): PPTXTemplate | null {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id) || null;
  },

  // Delete template
  deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  },

  // Get default template (built-in)
  getDefaultTemplate(): PPTXTemplate {
    return {
      id: 'default',
      name: 'Default Template',
      file: '',
      isDefault: true,
      createdAt: new Date().toISOString(),
    };
  },
};
