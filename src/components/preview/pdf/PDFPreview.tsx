'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader } from 'lucide-react';
import { PDFCategoryItem } from './PDFCategoryItem';
import { MobilePDFReader } from './MobilePDFReader';
interface PDF {
  id: number;
  title: string;
  coverUrl: string;
  fileUrl: string;
  categoryId: number;
  categoryName?: string;
}
interface Category {
  id: number;
  name: string;
  description?: string;
  pdfs: PDF[];
}
interface PDFPreviewProps {
  filterCategoryIds?: number[];
}
export default function PDFPreview({
  filterCategoryIds
}: PDFPreviewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [readPDF, setReadPDF] = useState<PDF | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{
    id: number | null;
    status: 'downloading' | 'completed' | null;
  }>({
    id: null,
    status: null
  });
  useEffect(() => {
    fetchPDFsGroupedByCategory();

    // Detect mobile device
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(mobile);
    }
  }, [filterCategoryIds]);
  const fetchPDFsGroupedByCategory = async () => {
    try {
      setIsLoading(true);

      // Fetch categories
      const catResponse = await fetch('/api/categories');
      const categoriesData = await catResponse.json();

      // Filter categories if filterCategoryIds is provided
      const filteredCategories = filterCategoryIds ? categoriesData.filter((category: any) => filterCategoryIds.includes(category.id)) : categoriesData;

      // Fetch PDFs with sort parameter
      const pdfsResponse = await fetch('/api/pdfs?sort=asc');
      const pdfsData = await pdfsResponse.json();

      // Ensure PDFs are sorted by ID in ascending order
      if (Array.isArray(pdfsData)) {
        pdfsData.sort((a, b) => a.id - b.id);
      }

      // Group PDFs by category
      const pdfsByCategory = filteredCategories.map((category: any) => {
        const categoryPDFs = pdfsData.filter((pdf: PDF) => pdf.categoryId === category.id) || [];

        // Initialize all categories as expanded
        if (categoryPDFs.length > 0) {
          setExpandedCategories(prev => ({
            ...prev,
            [category.id]: true
          }));
        }
        return {
          ...category,
          pdfs: categoryPDFs
        };
      }).filter((category: Category) => category.pdfs.length > 0);
      setCategories(pdfsByCategory);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  const handleReadPDF = (pdf: PDF) => {
    setReadPDF(pdf);
    // Auto switch to read tab when PDF is selected
    const readTabTrigger = document.querySelector('[data-value="read"]') as HTMLElement;
    if (readTabTrigger) {
      readTabTrigger.click();
    }
  };
  const handleDownloadPDF = async (pdf: PDF) => {
    try {
      // Show downloading notification
      setDownloadStatus({
        id: pdf.id,
        status: 'downloading'
      });

      // Fetch the file as a blob to detect when download is complete
      const response = await fetch(pdf.fileUrl);
      const blob = await response.blob();

      // Create a local URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdf.title}.pdf`; // Set the download filename
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show completed notification
      setDownloadStatus({
        id: pdf.id,
        status: 'completed'
      });

      // Clear notification after 5 seconds
      setTimeout(() => {
        setDownloadStatus({
          id: null,
          status: null
        });
      }, 5000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus({
        id: null,
        status: null
      });
      alert('Failed to download PDF. Please try again.');
    }
  };
  return <Card data-unique-id="22ac0319-1d32-4c3a-abe6-a0cb0b1fbce2" data-file-name="components/preview/pdf/PDFPreview.tsx">
      <Tabs defaultValue="browse" data-unique-id="23d44b39-284d-492b-bbeb-dbe8abba2c0a" data-file-name="components/preview/pdf/PDFPreview.tsx">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="browse"><span className="editable-text" data-unique-id="4bc632ef-7afb-4340-ba33-7b3c915bb29b" data-file-name="components/preview/pdf/PDFPreview.tsx">Browse PDFs</span></TabsTrigger>
          <TabsTrigger value="read" disabled={!readPDF} className={readPDF ? 'pdf-read-tab-active' : ''}>
            <span className="editable-text" data-unique-id="c93695a4-879f-4918-aa15-8962472f6714" data-file-name="components/preview/pdf/PDFPreview.tsx">BACA PDF</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse">
          <CardContent className="p-6" data-unique-id="53d65a16-2e2b-46f4-9e6f-bbdcd3397084" data-file-name="components/preview/pdf/PDFPreview.tsx">
            <div className="w-full" data-unique-id="e0368a18-c79d-4462-8da5-d18a0279e0b4" data-file-name="components/preview/pdf/PDFPreview.tsx" data-dynamic-text="true">
              {isLoading ? <div className="flex justify-center py-8" data-unique-id="d9d2183e-db72-47c1-9afa-1a501345d020" data-file-name="components/preview/pdf/PDFPreview.tsx">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div> : categories.length === 0 ? <p className="text-center py-8 text-muted-foreground" data-unique-id="99174fc1-7b1f-42f6-baac-ec7473688a10" data-file-name="components/preview/pdf/PDFPreview.tsx"><span className="editable-text" data-unique-id="84a1ef5b-e970-4915-8732-1f16788a5d5e" data-file-name="components/preview/pdf/PDFPreview.tsx">Tidak ada PDF yang tersedia.</span></p> : <div className="space-y-6" data-unique-id="c75673e6-18c7-4a3c-8987-6a063ec82025" data-file-name="components/preview/pdf/PDFPreview.tsx" data-dynamic-text="true">
                  {categories.map(category => <PDFCategoryItem key={category.id} category={category} isExpanded={!!expandedCategories[category.id]} toggleCategory={toggleCategory} onDownloadPDF={handleDownloadPDF} onReadPDF={handleReadPDF} downloadStatus={downloadStatus} currentReadingPDF={readPDF} />)}
                </div>}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="read">
          <CardContent className="px-4 py-4" data-unique-id="441800aa-b78f-40bc-83a6-84605b9365ae" data-file-name="components/preview/pdf/PDFPreview.tsx" data-dynamic-text="true">
            {readPDF ? isMobile ? <MobilePDFReader selectedPDF={readPDF} onDownloadPDF={handleDownloadPDF} categoryName={categories.find(c => c.id === readPDF.categoryId)?.name} /> : <div className="space-y-4" data-unique-id="89e44c0f-94f7-4e35-be8a-41f9c9a91b4a" data-file-name="components/preview/pdf/PDFPreview.tsx">
                  <div className="flex justify-between items-center mb-4" data-unique-id="fd403024-4339-4ca3-8ffd-d2bdb3c5d8c7" data-file-name="components/preview/pdf/PDFPreview.tsx">
                    <h2 className="text-xl font-semibold" data-unique-id="6304dfd5-aab3-4307-b0ab-faafa85311ee" data-file-name="components/preview/pdf/PDFPreview.tsx" data-dynamic-text="true">{readPDF.title}</h2>
                    <span className="text-sm text-muted-foreground" data-unique-id="ff393d4b-17e6-40a7-822f-ba95fbc1fc28" data-file-name="components/preview/pdf/PDFPreview.tsx" data-dynamic-text="true">
                      {categories.find(c => c.id === readPDF.categoryId)?.name}
                    </span>
                  </div>
                  <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-white" data-unique-id="1bab4a76-3557-40a2-9722-a36d37587708" data-file-name="components/preview/pdf/PDFPreview.tsx">
                    <iframe src={`${readPDF.fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} className="w-full h-full" title={`PDF Viewer - ${readPDF.title}`} style={{
                border: 'none'
              }} data-unique-id="32c01323-bdd6-4e2a-abab-dca77af804c8" data-file-name="components/preview/pdf/PDFPreview.tsx" />
                  </div>
                </div> : <div className="flex flex-col items-center justify-center py-12" data-unique-id="6066ab96-b80e-41f0-8544-0171730aa899" data-file-name="components/preview/pdf/PDFPreview.tsx">
                <p className="text-lg font-medium mb-2" data-unique-id="a0b8d00a-5a30-4313-bd2a-a88701720318" data-file-name="components/preview/pdf/PDFPreview.tsx"><span className="editable-text" data-unique-id="0606e16f-3506-48ca-beec-e7f91b93c83e" data-file-name="components/preview/pdf/PDFPreview.tsx">Tidak ada PDF yang dipilih</span></p>
                <p className="text-muted-foreground" data-unique-id="9854cf2d-62ba-4e1a-ab6a-976d03f2d8f0" data-file-name="components/preview/pdf/PDFPreview.tsx"><span className="editable-text" data-unique-id="43b2077f-0c50-4825-8674-5e1c4e9efcda" data-file-name="components/preview/pdf/PDFPreview.tsx">Silakan pilih PDF untuk dibaca dari daftar</span></p>
              </div>}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>;
}