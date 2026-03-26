import { useState } from 'react';
import { X, Pencil, Type, ArrowRight, Save, Download } from 'lucide-react';
import { Button } from './ui/button';

interface ImageAnnotatorProps {
  onClose: () => void;
}

export function ImageAnnotator({ onClose }: ImageAnnotatorProps) {
  const [tool, setTool] = useState<'pen' | 'text' | 'arrow'>('pen');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900">Annotation d'image - Scanner thoracique</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Crayon
          </Button>
          <Button
            variant={tool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('text')}
          >
            <Type className="w-4 h-4 mr-2" />
            Texte
          </Button>
          <Button
            variant={tool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('arrow')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Flèche
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          <div className="bg-gray-800 rounded-lg h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-64 h-64 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-500">Image DICOM</span>
              </div>
              <p className="text-gray-400">
                Cliquez et dessinez pour annoter l'image
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
