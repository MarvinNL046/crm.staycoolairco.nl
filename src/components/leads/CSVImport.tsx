'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  duplicates: number
}

interface CSVImportProps {
  onImportComplete?: () => void
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; result?: ImportResult; summary?: string; error?: string } | null>(null)
  const [showTemplate, setShowTemplate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)

      if (data.success && onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Netwerkfout bij uploaden van bestand'
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const csvContent = `naam,email,telefoon,bedrijf,bron,staat,notities,tags
Jan Jansen,jan@example.com,+31612345678,Jansen BV,website,new,Interesse in airco installatie,airco;installatie
Marie Peters,marie@example.com,+31687654321,Peters & Co,telefoon,contacted,Wil offerte ontvangen,offerte;commercieel
Piet de Vries,piet@example.com,+31654321098,,referral,qualified,Doorverwezen door klant,referral;warm`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'staycool-leads-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">CSV Import</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload een CSV bestand om meerdere leads tegelijk toe te voegen
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-blue-800">CSV Template</h4>
              <p className="mt-1 text-sm text-blue-700">
                Download eerst de template om te zien welke kolommen ondersteund worden
              </p>
              <button
                onClick={downloadTemplate}
                className="mt-2 inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* Supported Fields Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Verplichte Velden</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <code className="bg-gray-100 px-1 rounded">naam</code> (of voornaam + achternaam)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optionele Velden</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <code className="bg-gray-100 px-1 rounded">email</code></li>
              <li>• <code className="bg-gray-100 px-1 rounded">telefoon</code></li>
              <li>• <code className="bg-gray-100 px-1 rounded">bedrijf</code></li>
              <li>• <code className="bg-gray-100 px-1 rounded">bron</code></li>
              <li>• <code className="bg-gray-100 px-1 rounded">staat</code> (new, contacted, qualified, converted, lost)</li>
              <li>• <code className="bg-gray-100 px-1 rounded">notities</code></li>
              <li>• <code className="bg-gray-100 px-1 rounded">tags</code> (gescheiden door ;)</li>
            </ul>
          </div>
        </div>

        {/* Alternative Field Names */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <FileText className="h-4 w-4" />
            {showTemplate ? 'Verberg' : 'Toon'} alternatieve veldnamen
          </button>
          
          {showTemplate && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <strong>Naam:</strong> naam, name, volledige_naam, full_name, voornaam + achternaam
              </div>
              <div>
                <strong>Email:</strong> email, e_mail, e-mail, email_adres, email_address
              </div>
              <div>
                <strong>Telefoon:</strong> telefoon, phone, telephone, mobiel, mobile
              </div>
              <div>
                <strong>Bedrijf:</strong> bedrijf, company, bedrijfsnaam, company_name, organisatie
              </div>
              <div>
                <strong>Notities:</strong> notities, notes, opmerkingen, comments, bericht, message
              </div>
              <div>
                <strong>Tags:</strong> tags, labels, categories, categorieën
              </div>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV Bestand Uploaden
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Bezig met uploaden...</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Maximaal 1000 leads per bestand. Alleen .csv bestanden toegestaan.
          </p>
        </div>

        {/* Import Result */}
        {result && (
          <div className={`border rounded-md p-4 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <h4 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Import Geslaagd!' : 'Import Gefaald'}
                </h4>
                
                {result.summary && (
                  <p className={`mt-1 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.summary}
                  </p>
                )}

                {result.error && (
                  <p className="mt-1 text-sm text-red-700">
                    {result.error}
                  </p>
                )}

                {result.result && (
                  <div className="mt-3 space-y-2">
                    {/* Success/Failed Stats */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {result.result.success > 0 && (
                        <div className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span>{result.result.success} succesvol</span>
                        </div>
                      )}
                      {result.result.failed > 0 && (
                        <div className="flex items-center gap-1 text-red-700">
                          <XCircle className="h-4 w-4" />
                          <span>{result.result.failed} gefaald</span>
                        </div>
                      )}
                      {result.result.duplicates > 0 && (
                        <div className="flex items-center gap-1 text-yellow-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{result.result.duplicates} duplicaten</span>
                        </div>
                      )}
                    </div>

                    {/* Error Details */}
                    {result.result.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          Toon {result.result.errors.length} foutmeldingen
                        </summary>
                        <div className="mt-2 max-h-32 overflow-y-auto bg-white border rounded p-2">
                          {result.result.errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-600 py-1 border-b last:border-b-0">
                              {error}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import Tips */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Import Tips</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Gebruik UTF-8 encoding voor Nederlandse karakters (é, ë, ç, etc.)</li>
            <li>• Email adressen worden automatisch gevalideerd</li>
            <li>• Duplicaat emails worden automatisch gedetecteerd</li>
            <li>• Nieuwe leads met email krijgen automatisch een welkom email</li>
            <li>• Tags kunnen gescheiden worden door komma's of puntkomma's</li>
            <li>• Lege rijen worden automatisch overgeslagen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}