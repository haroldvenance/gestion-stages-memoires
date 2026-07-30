import React, { useState, useEffect, useContext } from 'react';
import { getDocuments, uploadDocument } from '../services/demandes';
import AuthContext from '../context/AuthContext';
import Button from './ui/Button';
import { FaFileAlt, FaDownload, FaUpload } from 'react-icons/fa';

const DocumentList = ({ demandeId }) => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('brouillon');

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments(demandeId);
      setDocuments(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [demandeId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10 Mo.');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadDocument(demandeId, {
        fichier: selectedFile,
        type_doc: documentType,
      });
      setSelectedFile(null);
      setDocumentType('brouillon');
      fetchDocuments();
      document.getElementById('fileInput').value = '';
    } catch (err) {
      alert('Erreur lors de l\'upload');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-secondary">Chargement des documents...</div>;
  }

  return (
    <div>
      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-secondary">Aucun document déposé.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-secondary" />
                <div>
                  <p className="font-medium">Version {doc.version} – {doc.type_doc}</p>
                  <p className="text-xs text-secondary">{new Date(doc.date_depot).toLocaleString()}</p>
                </div>
              </div>
              <a
                href={doc.fichier_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1"
              >
                <FaDownload /> Télécharger
              </a>
            </div>
          ))
        )}
      </div>

      {user.role === 'etudiant' && (
        <form onSubmit={handleUpload} className="mt-6 border-t pt-4">
          <h4 className="font-medium mb-3">Déposer un nouveau document</h4>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-secondary mb-1">Fichier (PDF, DOCX, ODT, JPG, PNG) – 10 Mo max</label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx,.odt,.jpg,.png"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-secondary mb-1">Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              >
                <option value="brouillon">Brouillon</option>
                <option value="final">Version finale</option>
                <option value="rapport_stage">Rapport de stage</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <Button type="submit" disabled={!selectedFile || uploading} icon={FaUpload}>
              {uploading ? 'Upload...' : 'Upload'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DocumentList;